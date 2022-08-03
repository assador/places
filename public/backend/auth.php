<?php
include "config.php";
include "newpdo.php";
include "common.php";

$_POST = json_decode(file_get_contents("php://input"), true);
$query = $conn->query(
	"SELECT * FROM `users` WHERE `login` = '" .
	$_POST["authLogin"] .
	"' AND `confirmed` = 1"
);
$result = $query->fetch(PDO::FETCH_ASSOC);
if(!$result || !password_verify($_POST["authPassword"], $result["password"])) {
	echo 0;
} else {
	$result["session"] = generateRandomString(32);
	echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
}
