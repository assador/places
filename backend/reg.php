<?php
include "config.php";
include "newpdo.php";
include "randomstring.php";

$date = new DateTime();
$date->add(new DateInterval("P1D"));

$_POST = json_decode(file_get_contents("php://input"), true);

$query = $conn->query("SELECT `login` FROM `users` WHERE `login` = '" . $_POST["regLogin"] . "'");
$result = $query->fetchAll(PDO::FETCH_ASSOC);
if(count($result) > 0) {echo 1; exit;}

$token = generateRandomString(32);
$query = $conn->prepare(
	"INSERT INTO `users` (`login`, `password`, `name`, `email`, `phone`, `confirmed`, `confirmbefore`, `token`) VALUES ('" .
	$_POST["regLogin"] .
	"', '" .
	password_hash($_POST["regPassword"], PASSWORD_DEFAULT) .
	"', '" .
	(!empty($_POST["regName"]) ? $_POST["regName"] : "") .
	"', '" .
	$_POST["regEmail"] .
	"', '" .
	(!empty($_POST["regPhone"]) ? $_POST["regPhone"] : "") .
	"', 0, '" .
	$date->format("Y-m-d H:i:s") .
	"', '" .
	$token .
	"')"
);
$result = $query->execute();

$headers =
	"MIME-Version: 1.0" . "\r\n" .
	"Content-type: text/html; charset=utf-8" . "\r\n" .
	"From: Сервис «Места» <allbox@scrofa-tridens.ru>"
;
$subject = "Подтверждение регистрации в сервисе «Места»";
$message = '
	<html>
	<head>
		<title>Подтверждение регистрации в сервисе «Места»</title>
	</head>
	<body>
		<h1>Подтверждение регистрации в сервисе «Места»</h1>
		<p>
			Для подтверждения регистрации в сервисе просмотра и редактирования
			библиотек геометок «Места» перейдите по ссылке:<br />
			<a href="http://places.scrofa-tridens.ru/confirm.php?token=' . $token . '">
				http://places.scrofa-tridens.ru/confirm.php?token=' . $token . '
			</a>
		</p>
	</body>
	</html>
';
mail($_POST["regEmail"], $subject, $message, $headers);
#if(count($result) == 0) {
#	echo 0;
#} else {
#	echo generateRandomString() . "|" . $result[0]["id"];
#}
