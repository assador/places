<?php
include "config.php";
include "newpdo.php";
include "common.php";

$_POST = json_decode(file_get_contents("php://input"), true);
if(testAccountCheck($conn, $testaccountid, $_POST["id"])) {
	echo 2; exit;
} else {
	$query = $conn->prepare("
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
