<?php
include "config.php";
include "newpdo.php";
include "common.php";

$date = new DateTime();
$date->add(new DateInterval("P1D"));

$_POST = json_decode(file_get_contents("php://input"), true);

$query = $conn->query(
	"SELECT `login`, `email`
	FROM `users`
	WHERE
		`login` = '" .
		$_POST["regLogin"] .
		"'
	OR
		`email` = '" .
		$_POST["regEmail"] .
		"'"
);
$result = $query->fetch(PDO::FETCH_ASSOC);
if(!!$result) {echo 1; exit;}

$id = generateRandomString(32);
$token = generateRandomString(32);
$query = $conn->prepare(
	"INSERT INTO `users` (
		`id`,
		`login`,
		`password`,
		`name`,
		`email`,
		`phone`,
		`confirmed`,
		`confirmbefore`,
		`token`
	) VALUES ('" .
		$id .
		"', '" .
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
	"From: =?utf-8?b?" . base64_encode("Сервис «Места»") . "?= <" . $from . ">"
;
$subject = "=?utf-8?b?" . base64_encode("Подтверждение регистрации в сервисе «Места»") . "?=";
$message = '
	<html>
	<head>
		<title>Подтверждение регистрации в сервисе «Места»</title>
	</head>
	<body>
		<h1>Подтверждение регистрации в сервисе «Места»</h1>
		<p>
			Ваш e-mail был указан при регистрации в <a href="/">
			сервисе просмотра и редактирования библиотек геометок «Места»</a>.
			Если вы этого не делали, просто проигнорируйте это письмо.
		</p>
		<p>
			Для подтверждения регистрации в сервисе перейдите по ссылке:<br />
			<a href="/backend/confirm.php?token=' . $token . '">
				/backend/confirm.php?token=' . $token . '
			</a>
		</p>
	</body>
	</html>
';
mail($_POST["regEmail"], $subject, $message, $headers, "-f" . $from);
