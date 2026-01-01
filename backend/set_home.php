<?php
require_once __DIR__ . '/bootstrap.php';

$_POST = json_decode(file_get_contents("php://input"), true);
if (testAccountCheck($ctx, $testaccountuuid, $_POST["id"])) {
	echo 2; exit;
} else {
	$query = $ctx->db->prepare("
		UPDATE `users`
		SET
			`homeplace` = " .
				($_POST["data"] == null ? "NULL" : "'{$_POST["data"]}'")
			. "
		WHERE
			`id` = '" . $_POST["id"] . "'
	");
	try {$query->execute();} catch(Exception $e) {echo 2; exit;}
	echo 1; exit;
}
