<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

function prepareSettingValue(mixed $value, int $type): string {
	if ($value === null) return "";
	$rawString = match ($type) {
		0 => "",
		1 => $value ? "1" : "0",
		2 => (string) $value,
		3 => is_array($value) || is_object($value)
			? json_encode($value, JSON_UNESCAPED_UNICODE)
			: (string) $value
		,
		default => "",
	};
	return mb_strcut($rawString, 0, 255, "8bit");
}

apiRun($ctx, function () use ($ctx, $config) {
	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

	$list = $data["data"] ?? [];
	if (empty($list)) apiSuccess();

	$binUserId = uuidToBin($data["userid"]);
	$binSessionId = uuidToBin($data["sessionid"]);

	if (!isValidSession($ctx, $binUserId, $binSessionId)) {
		throw new ApiException(401, "invalid_session");
	}
	if ($data["userid"] === $config["testaccountuuid"]) {
		throw new ApiException(403, "test_account");
	}

	$ctx->db->beginTransaction();

	$usersVocStmt = $ctx->db->query("
		SELECT `id`, `type`, `baseval`
		FROM `settings_users_voc`
		WHERE `public` = TRUE
	");
	$voc = $usersVocStmt->fetchAll(PDO::FETCH_UNIQUE);

	$insertSql = "
		INSERT INTO `settings_users` (
			`userid`, `settingid`, `value`, `updated`
		) VALUES (
			:userid, :settingid, :value, :updated
		)
		ON DUPLICATE KEY UPDATE
			`value`   = VALUES(`value`),
			`updated` = VALUES(`updated`)
	";
	$insertStmt = $ctx->db->prepare($insertSql);

	$deleteSql = "
		DELETE FROM `settings_users`
		WHERE `settingid` = :settingid AND `userid` = :userid
	";
	$deleteStmt = $ctx->db->prepare($deleteSql);

	foreach ($list as $row) {
		if (
			!isset($voc[$row["id"]]) ||
			(int) $voc[$row["id"]]["type"] !== (int) $row["valtype"]
		) {
			$ctx->db->rollBack();
			echo json_encode([1], JSON_NUMERIC_CHECK);
			exit;
		}
		if (!empty($row["updated"])) {
			if ($row["val"] === $voc[$row["id"]]["baseval"]) {
				$deleteStmt->execute([
					":userid"    => $binUserId,
					":settingid" => (int) $row["id"],
				]);
			} else {
				$insertStmt->execute([
					":userid"    => $binUserId,
					":settingid" => (int) ($row["id"]),
					":value"     => prepareSettingValue($row["val"], $row["valtype"]),
					":updated"   => (int) (microtime(true) * 1000),
				]);
			}
		}
	}

	$ctx->db->commit();
	apiSuccess();
});
