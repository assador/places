<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "1");

require_once __DIR__ . "/bootstrap.php";

$input = json_decode(
	file_get_contents("php://input"),
	true,
	512,
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);

$query = $ctx->db->prepare("
	SELECT * FROM `users`
	WHERE `login` = :login
		AND `confirmed` = 1
	LIMIT 1
");
$query->execute([ ":login" => $input["authLogin" ]]);
$result = $query->fetch(PDO::FETCH_ASSOC);

if (!$result) {
	exit(0);
}
if (!password_verify($input["authPassword"], $result["password"])) {
	throw new Exception("Authorization error.");
}
$result["session"] = createSession($ctx, $result["id"]);
$result["id"] = binToUuid($result["id"]);
$result["homeplace"] = binToUuid($result["homeplace"]);

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
