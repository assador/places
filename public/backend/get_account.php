<?php
include "config.php";
include "newpdo.php";

$query = $conn->query("SELECT * FROM `users` WHERE `id` = '" . $_GET["id"] . "'");
$result = $query->fetchAll(PDO::FETCH_ASSOC);
if(count($result) == 0) {
	echo 0;
} else {
	$result[0]["testaccount"] = $result[0]["id"] == $testaccountid ? true : false;
	echo json_encode($result[0], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
}
