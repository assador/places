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
$users = $data["users"];
$binUserId = uuidToBin($data["userid"]);
$binSessionId = uuidToBin($data["sessionid"]);

$result = [];

function isValidRights(AppContext $ctx, string $binUserId): bool {
	$stmt = $ctx->db->prepare("
		SELECT `id`, `parent` FROM `groups`
		WHERE `id` IN (
			SELECT `group` FROM `usergroup`
			WHERE `user` = :id
		)
			AND `parent` = 'management' OR `id` = 'superusers'
	");
	$stmt->bindValue(":id", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();
	if (!$stmt->fetch()) return false;
	return true;
}

// SEC Check

if (
	!isValidSession($ctx, $binUserId, $binSessionId) ||
	!isValidRights($ctx, $binUserId)
) {
	throw new Exception("Invalid or expired session.");
}

// SEC Transaction

try {
	$ctx->db->beginTransaction();

	if (!empty($users) && is_array($users)) {
		$ids = array_map("uuidToBin", $data["users"]);
		$in  = implode(",", array_fill(0, count($ids), "?"));
		$stmt = $ctx->db->prepare("
			SELECT `id`, `login`, `name` FROM `users`
			WHERE `id` IN ($in)
		");
		foreach ($ids as $i => $bin) {
			$stmt->bindValue($i + 1, $bin, PDO::PARAM_LOB);
		}
		$stmt->execute();
/*
		$result = $stmt->fetchAll(PDO::FETCH_ASSOC);
		foreach ($result as &$row) {
			$row["id"] = binToUuid($row["id"]);
		}
*/
	} else {
		$stmt = $ctx->db->query("
			SELECT
				`id`,
				`login`,
				`confirmed`,
				`homeplace`,
				`name`,
				`email`,
				`phone`,
				`lastupdates`,
				`confirmbefore`
			FROM `users`
		");
		$stmt->execute();
	}
	while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$row["id"] = binToUuid($row["id"]);
		$row["homeplace"] = binToUuid($row["homeplace"]);
		$row["confirmed"] = (bool) $row["confirmed"];
		$result[$row["id"]] = $row;
	}

	$ctx->db->commit();

} catch (Throwable $e) {
	error_log($e->getMessage());
	if ($ctx->db->inTransaction()) $ctx->db->rollBack();
}
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
