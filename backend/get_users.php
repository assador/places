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

$result = [];

if (empty($data["userid"]) || empty($data["sessionid"])) {
	throw new Exception("Wrong account.");
}

function checkSession(AppContext $ctx, string $sessionid): bool {
	$stmt = $ctx->db->prepare("
		SELECT 1 FROM `sessions`
		WHERE `id` = :sessionid
		LIMIT 1
	");
	$stmt->bindValue(":sessionid", uuidToBin($sessionid), PDO::PARAM_LOB);
	$stmt->execute();
	return (bool) $stmt->fetch();
}

// SEC Session check

if (checkSession($ctx, $data["sessionid"]) === false) {
	throw new Exception("Invalid or expired session.");
}

// SEC Transaction

try {
	$ctx->db->beginTransaction();

	if (!empty($users) && is_array($users)) {
		$ids = array_map("uuidToBin", $users);
		$in  = implode(",", array_fill(0, count($ids), "?"));
		$query = $ctx->db->prepare("
			SELECT `id`, `login`, `name` FROM `users`
			WHERE `id` IN ($in)
		");
		foreach ($ids as $i => $bin) {
			$query->bindValue($i + 1, $bin, PDO::PARAM_LOB);
		}
		$query->execute();
		$result = $query->fetchAll(PDO::FETCH_ASSOC);
		foreach ($result as &$row) {
			$row["id"] = binToUuid($row["id"]);
		}
	} else {
		$query = $ctx->db->query("SELECT `login`, `name` FROM `users`");
		$result = $query->fetchAll(PDO::FETCH_ASSOC);
	}

	$ctx->db->commit();

} catch (Throwable $e) {
	error_log($e->getMessage());
	if ($ctx->db->inTransaction()) $ctx->db->rollBack();
}
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
