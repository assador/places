<?php
include "config.php";
include "newpdo.php";

$result = $conn->exec("
	UPDATE `users` SET `confirmed` = 1 WHERE `token` = '" . $_GET["token"] . "'
");
if($result === 1) {
	$query = $conn->query("
		SELECT `id` FROM `users` WHERE `token` = '" . $_GET["token"] . "'
	");
	$user = $query->fetch(PDO::FETCH_ASSOC);
	$query = $conn->prepare("
		INSERT INTO `usergroup` (`user`, `group`, `enabled`)
		VALUES ('" . $user["id"] . "', 'beginners', 1)
	");
	$query->execute();
	echo '
		<h1>Успешно</h1>
		<p>
			Ваша регистрация успешно подтвержена. Теперь вы можете
			<a href="/">авторизоваться</a> на сервисе под своим логином.
		</p>
	';
} else {
	echo '
		<h1>Неуспешно</h1>
		<p>
			Пользователь не найден. Возможно, прошёл отведённый срок
			подтверждения регистрации. Зарегистрируйтесь в сервисе ещё раз.
		</p>
	';
}
