<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "1");

/* “Let there be light!” the beaver said. Debug with smile, that’s what we get.
set_exception_handler(function($e) {
	header("Content-Type: application/json");
	http_response_code(500);
	echo $e->getMessage();
	echo "\nfile: {$e->getFile()}";
	echo "\nline: {$e->getLine()}";
	exit;
});
*/

require_once __DIR__ . "/bootstrap.php";

$raw = file_get_contents("php://input");
$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
$list = $data["data"] ?? [];

$faults = [];
/*
1: wrong data,
2: wrong session,
3: test account,
*/

if (empty($data["userid"]) || empty($data["sessionid"])) {
	echo json_encode([1], JSON_NUMERIC_CHECK);
	exit;
}

// Helpers

function prepareSettingValue(mixed $value, int $type): string {
	if ($value === null) return "";
	$rawString = match ($type) {
		0 => "",
		1 => $value ? "1" : "0",
		2 => (string)$value,
		3 => is_array($value) || is_object($value)
			? json_encode($value, JSON_UNESCAPED_UNICODE)
			: (string)$value
		,
		default => "",
	};
	return mb_strcut($rawString, 0, 255, "8bit");
}
function checkSession(AppContext $ctx, string $sessionid): bool {
	$stmt = $ctx->db->prepare("
		SELECT 1 FROM `sessions`
		WHERE `id` = :sessionid
		LIMIT 1
	");
	$stmt->bindValue(":sessionid", uuidToBin($sessionid), PDO::PARAM_LOB);
	$stmt->execute();
	return (bool)$stmt->fetch();
}

// SEC Session check

if (checkSession($ctx, $data["sessionid"]) === false) {
	echo 2;
	exit;
}

// SEC Transaction

try {
	$ctx->db->beginTransaction();

	if (!empty($list)) {

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

		$binUserId = uuidToBin($data["userid"]);

		foreach ($list as $row) {
			if (
				!isset($voc[$row["id"]]) ||
				(int)$voc[$row["id"]]["type"] !== (int) $row["valtype"]
			) {
				$ctx->db->rollBack();
				echo 1;
				exit;
			}
			if (!empty($row["deleted"])) {
				$deleteStmt->execute([
					":userid"    => $binUserId,
					":settingid" => (int) $row["id"],
				]);
			}
			elseif (!empty($row["added"]) || !empty($row["updated"])) {
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

} catch (Throwable $e) {
	error_log($e->getMessage());
	if ($ctx->db->inTransaction()) $ctx->db->rollBack();
	if (!in_array(1, $faults, true)) $faults[] = 1;
}

header("Content-Type: application/json");
echo json_encode(
	$faults,
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK
);
exit;
