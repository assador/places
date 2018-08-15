<?php
include "config.php";
include "newpdo.php";

function generateRandomString($length = 32) {
	$chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
	$numChars = strlen($chars);
	$string = "";
	for($i = 0; $i < $length; $i++) {
		$string .= substr($chars, rand(1, $numChars) - 1, 1);
	}
	return $string;
}
$_POST = json_decode(file_get_contents("php://input"), true);
$query = $conn->query(
	"SELECT `id`, `login`, `password` FROM `users` WHERE `login` = '" .
	$_POST["authLogin"] .
	"' AND `password` = '" .
	$_POST["authPassword"] .
	"'"
);
$result = $query->fetchAll(PDO::FETCH_ASSOC);
if(count($result) == 0) {
	echo 0;
} else {
	echo generateRandomString() . "|" . $result[0]["id"];
}
