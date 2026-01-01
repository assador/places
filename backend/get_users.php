<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$input = json_decode(
	file_get_contents("php://input"),
	true,
	512,
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
if (!$ctx->db) {
	http_response_code(500);
	echo json_encode(["error" => "DB connection failed"]);
	exit;
}
header("Content-Type: application/json; charset=utf-8");

try {
	if (!empty($input["users"]) && is_array($input["users"])) {
		$ids = array_map('uuidToBin', $input["users"]);
		$in  = implode(',', array_fill(0, count($ids), '?'));
		$query = $ctx->db->prepare("
			SELECT `id`, `login`, `name`
			FROM `users`
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
		echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
		exit;
	}
	if (!empty($input["user"]["id"]) && !empty($input["user"]["password"])) {
		$id = uuidToBin($input["user"]["id"]);
		$password = $input["user"]["password"];
		if (passwordHashCheck($ctx, $id, $password)) {
			$query = $ctx->db->query("SELECT * FROM `users`");
			$result = $query->fetchAll(PDO::FETCH_ASSOC);
			foreach ($result as &$row) {
				$row["id"] = binToUuid($row["id"]);
			}
			echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
			exit;
		}
	}
	http_response_code(403);
	echo json_encode(["error" => "Access denied"]);
} catch (Exception $e) {
	http_response_code(500);
	echo json_encode(["error" => $e->getMessage()]);
}
