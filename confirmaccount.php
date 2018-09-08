<?php
include "./backend/config.php";
include "./backend/newpdo.php";

$query = $conn->query("SELECT * FROM `users_change` WHERE `token` = '" . $_GET["token"] . "'");
$result = $query->fetchAll(PDO::FETCH_ASSOC);
if(count($result) > 0) {
	$user = $result[0];
	$result = $conn->exec(
		"UPDATE `users` SET" .
		"`login`    = '" . $user["login"    ] . "', " .
		"`password` = '" . $user["password" ] . "', " .
		"`name`     = '" . $user["name"     ] . "', " .
		"`email`    = '" . $user["email"    ] . "', " .
		"`phone`    = '" . $user["phone"    ] . "' " .
		"WHERE `id` = '" . $user["id"       ] . "'"
	);
	if($result === 1) {
		$query = $conn->query("DELETE FROM `users_change` WHERE `token` = '" . $_GET["token"] . "'");
		$result = $query->execute();
		echo '
			<h1>Успешно</h1>
			<p>
				Данные вашего аккаунта успешно изменены. Перелогиньтесь на сервисе.
			</p>
		';
	}
} else {
	echo '
		<h1>Неуспешно</h1>
		<p>
			Данные вашего аккаунта не изменены. Возможно, прошёл отведённый
			для подтверждения изменений срок. Внесите изменения ещё раз.
		</p>
	';
}
