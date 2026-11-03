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

$_POST = json_decode(
    file_get_contents("php://input"),
    true,
    512,
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
if (passwordHashCheck($ctx, $_POST["user"]["id"], $_POST["user"]["password"])) {
    $query = $ctx->db->query("SELECT * FROM `groups`");
    $result = $query->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} else {
    echo false;
}
