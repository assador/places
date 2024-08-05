<?php
include "config.php";
include "newpdo.php";
include "common.php";

$query = $conn->query("
	SELECT `id`, `login`, `name`
	FROM `users`
	WHERE `token` = '" . $_GET["token"] . "'
");
$result = $query->fetch(PDO::FETCH_ASSOC);
if(!!$result) {
	$id = $result["id"];
	$login = $result["login"];
	$name = $result["name"];
} else {
	echo 1; exit;
}

$password = generateRandomString(8);
$query = $conn->prepare("
	UPDATE `users`
	SET `password` = '" . password_hash($password, PASSWORD_DEFAULT) . "'
	WHERE `id` = '" . $id . "'
");
$query->execute();

echo '
	<h1>Новый пароль создан</h1>
	<p>
		Здравствуйте' . ($name != "" && $name != null ? ', ' . $name : '') . '!
	<p>
		Создан новый пароль для вашего аккаунта
		на <a href="/">сервисе просмотра и редактирования библиотек
		геометок «Места»</a>.
	</p>
	<p>
		Ваш логин: ' . $login . '<br />
		Ваш новый пароль: ' . $password . '
	</p>
	<p>
		При желении вы сможете изменить их в личном кабинете после авторизации.
	</p>
';
