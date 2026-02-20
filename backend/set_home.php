<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$raw = file_get_contents("php://input");
$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

if (testAccountCheck($ctx, $config["testaccountuuid"], $data["id"])) {
	echo 2;
	exit;
} else {
	$sql = "
		UPDATE users
		SET homeplace = :homeplace
		WHERE id = :id
	";
	$stmt = $ctx->db->prepare($sql);
	$stmt->execute([
		":id"        => uuidToBin($data["id"]),
		":homeplace" => $data["data"] == null ? null : uuidToBin($data["data"]),
	]);
	echo 1;
	exit;
}
