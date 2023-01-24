<?php
include "config.php";
include "newpdo.php";
include "common.php";

$_POST = json_decode(file_get_contents("php://input"), true);

$query = $conn->query("SELECT `id`, `name` FROM `users` WHERE `email` = '" . $_POST["forgotEmail"] . "'");
$result = $query->fetch(PDO::FETCH_ASSOC);
if($result) {
	$id = $result["id"];
	$name = $result["name"];
} else {
	echo 1; exit;
}

$token = generateRandomString(32);
$query = $conn->prepare("
	UPDATE `users`
	SET `token` = '" . $token . "'
	WHERE `id` = '" . $id . "'
");
$query->execute();

$headers =
	"MIME-Version: 1.0" . "\r\n" .
	"Content-type: text/html; charset=utf-8" . "\r\n" .
	"From: =?utf-8?b?" . base64_encode("Сервис «Места»") . "?= <" . $from . ">"
;
$subject = "=?utf-8?b?" . base64_encode("Восстановление пароля пользователя сервиса «Места»") . "?=";
$message = '
	<html>
	<head>
		<title>Восстановление пароля пользователя сервиса «Места»</title>
	</head>
	<body>
		<h1>Восстановление пароля пользователя сервиса «Места»</h1>
		<p>
			Здравствуйте' . ($name != "" && $name != null ? ', ' . $name : '') . '!
		<p>
			Ваш e-mail был указан для восстановления пароля пользователя
			<a href="' . $host . '">сервиса просмотра и редактирования библиотек
			геометок «Места»</a>. Если вы этого не делали, просто проигнорируйте это письмо.
			В противном случае для создания нового пароля вашего аккаунта перейдите по ссылке: 
			<a href="' . $host . '/backend/change_password.php?token=' . $token . '">' . $host . '/backend/change_password.php?token=' . $token . '</a>
		</p>
	</body>
	</html>
';
mail($_POST["forgotEmail"], $subject, $message, $headers, "-f" . $from);
