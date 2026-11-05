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

	$stmt = $ctx->db->query("SELECT * FROM `groups`");
	$stmt->execute();

	while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$row["owner"] = binToUuid($row["owner"]);
		$row["system"] = (bool) $row["system"];
		$row["haschildren"] = (bool) $row["haschildren"];
		$result[$row["id"]] = $row;
	}

	$ctx->db->commit();

} catch (Throwable $e) {
	error_log($e->getMessage());
	if ($ctx->db->inTransaction()) $ctx->db->rollBack();
}
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
