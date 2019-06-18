<?php
include "config.php";
include "newpdo.php";
include "common.php";

file_put_contents("/var/www/places/uploads/1.txt", $_POST["data"]);
if(testAccountCheck($conn, $testaccountid, $_POST["id"])) {
	echo 2; exit;
} else {
	$query = $conn->prepare("
		UPDATE `users`
		SET
			`homeplace` = " .
				($_POST["data"] == "null" ? "NULL" : "'{$_POST["data"]}'")
			. "
		WHERE
			`id` = '" . $_POST["id"] . "'
	");
	try {$query->execute();} catch(Exception $e) {echo 2; exit;}
	echo 1; exit;
}
