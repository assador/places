<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$_POST = json_decode(file_get_contents("php://input"), true);

$query = $ctx->db->prepare("
	SELECT *
	FROM users
	WHERE login = :login
		AND confirmed = 1
");
$query->execute([":login" => $_POST["authLogin"]]);
$result = $query->fetch(PDO::FETCH_ASSOC);

if (!$result) {
	echo 0;
	exit;
}
if (!password_verify($_POST["authPassword"], $result["password"])) {
	echo 1;
	exit;
}
$result["session"] = createSession($ctx, $result["id"]);
$result["id"] = binToUuid($result["id"]);
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
