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

if(testAccountCheck($ctx, $config["testaccountuuid"], $_POST["userid"])) {
	throw new Exception("Test account.");
}

switch ($_POST["need"]) {
	case "visiting" :
		$query = $ctx->db->query("
			SELECT `id`
			FROM `groups`
			WHERE `id`
			IN (
				SELECT `group`
				FROM `usergroup`
				WHERE `user` = :userid
			)
			AND `parent` = 'visiting'
		");
		$query->execute([
			":userid" => $_POST["userid"],
		]);
		$groups = $query->fetchAll(PDO::FETCH_COLUMN);
		break;
	default :
		$query = $ctx->db->query("
			SELECT *
			FROM `groups`
			WHERE `id`
			IN (
				SELECT `group`
				FROM `usergroup`
				WHERE `user` = :userid
			)
		");
		$query->execute([
			":userid" => $_POST["userid"],
		]);
		$groups = $query->fetchAll(PDO::FETCH_COLUMN);
		break;
}
echo json_encode(
	$groups,
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK
);
