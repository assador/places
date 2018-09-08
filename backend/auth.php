<?php
include "config.php";
include "newpdo.php";
include "randomstring.php";

$_POST = json_decode(file_get_contents("php://input"), true);
$query = $conn->query(
	"SELECT * FROM `users` WHERE `login` = '" .
	$_POST["authLogin"] .
	"' AND `confirmed` = 1"
);
$result = $query->fetchAll(PDO::FETCH_ASSOC);
if(count($result) == 0 || !password_verify($_POST["authPassword"], $result[0]["password"])) {
	echo 0;
} else {
	$result[0]["session"] = generateRandomString(32);
	echo json_encode($result[0], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
}
