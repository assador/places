<?php
include "/backend/config.php";
include "/backend/newpdo.php";

$result = $conn->exec("UPDATE `users` SET `confirmed` = 1 WHERE `token` = '" . $_GET["token"] . "'");
if($result === 1) {
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
