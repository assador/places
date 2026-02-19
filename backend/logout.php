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
if (!empty($input["sessionId"]) && !empty($input["userId"])) {
	deleteSession($ctx, uuidToBin($input["sessionId"]), uuidToBin($input["userId"]));
}
