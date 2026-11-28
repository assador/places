<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx, $config) {

	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

	$list = $data["data"] ?? [];
	if (empty($list) || empty($list["user"])) apiSuccess();

	$binUserId = uuidToBin($data["userid"]);
	$binSessionId = uuidToBin($data["sessionid"]);

	if (!isValidSession($ctx, $binUserId, $binSessionId)) {
		throw new ApiException(401, "invalid_session");
	}
	if ($data["userid"] === $config["testaccountuuid"]) {
		throw new ApiException(403, "test_account");
	}

	$ctx->db->beginTransaction();

	$stmt = $ctx->db->query("
		SELECT `id`, `type`
		FROM `settings_users_voc`
		WHERE `public` = TRUE
	");
	$voc = $stmt->fetchAll(PDO::FETCH_UNIQUE);

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

	foreach ($list["user"] as $row) {
		if (!isset($voc[$row["settingid"]])) {
			throw new ApiException(400, "invalid_request");
		}
		if (!empty($row["deleted"])) {
			$deleteStmt->execute([
				":userid"    => $binUserId,
				":settingid" => (int) $row["settingid"],
			]);
		} elseif (!empty($row["added"]) || !empty($row["updated"])) {
			$insertStmt->execute([
				":userid"    => $binUserId,
				":settingid" => (int) ($row["settingid"]),
				":value"     => prepareSettingValue(
					$row["value"],
					(int) $voc[$row["settingid"]]["type"],
				),
				":updated"   => (int) (microtime(true) * 1000),
			]);
		}
	}

	$ctx->db->commit();
	apiSuccess();
});
