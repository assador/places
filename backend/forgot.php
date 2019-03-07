<?php
include "config.php";
include "newpdo.php";
include "randomstring.php";

$_POST = json_decode(file_get_contents("php://input"), true);

$query = $conn->query("SELECT `id`, `login`, `name` FROM `users` WHERE `email` = '" . $_POST["forgotEmail"] . "'");
$result = $query->fetchAll(PDO::FETCH_ASSOC);
if(count($result) > 0) {
	$id = $result[0]["id"];
	$login = $result[0]["login"];
	$name = $result[0]["name"];
} else {
	echo 1; exit;
}

$password = generateRandomString(8);
$query = $conn->prepare("UPDATE `users` SET `password` = '" . password_hash($password, PASSWORD_DEFAULT) . "' WHERE `id` = '" . $id . "'");
$result = $query->execute();

$headers =
	"MIME-Version: 1.0" . "\r\n" .
	"Content-type: text/html; charset=utf-8" . "\r\n" .
	"From: =?utf-8?b?" . base64_encode("Сервис «Места»") . "?= <" . $from . ">"
;
$subject = "=?utf-8?b?" . base64_encode("Пароль пользователя сервиса «Места» восстановлен") . "?=";
$message = '
	<html>
	<head>
		<title>Пароль пользователя сервиса «Места» восстановлен</title>
	</head>
	<body>
		<h1>Пароль пользователя сервиса «Места» восстановлен</h1>
		<p>
			Здравствуйте' . ($name != "" && $name != null ? ', ' . $name : '') . '!
		<p>
			Ваш e-mail был указан для восстановления пароля пользователя
			<a href="' . $host . '">сервиса просмотра и редактирования библиотек
			геометок «Места»</a>. Если вы этого не делали, просто проигнорируйте это письмо.
		</p>
		<p>
			Ваш логин: ' . $login . '<br />
			Ваш новый пароль: ' . $password . '
		</p>
		<p>
			При желении вы сможете изменить их в личном кабинете после авторизации.
		</p>
	</body>
	</html>
';
mail($_POST["forgotEmail"], $subject, $message, $headers, "-f" . $from);
