<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$query = $ctx->db->prepare("
	SELECT * FROM `userschange`
	WHERE `token` = :token
");
$query->bindValue(':token', $_GET["token"]);
$query->execute();
$user = $query->fetch(PDO::FETCH_ASSOC);

if (count($user) > 0) {
	$query = $ctx->db->prepare("
		UPDATE `users` SET
		`login` = :login,
		`password` = :password,
		`name` = :name,
		`email` = :email,
		`phone` = :phone
		WHERE `id` = :id
	");
	$query->bindValue(':login', $user['login']);
	$query->bindValue(':password', $user['password']);
	$query->bindValue(':name', $user['name']);
	$query->bindValue(':email', $user['email']);
	$query->bindValue(':phone', $user['phone']);
	$query->bindValue(':id', $user['id']);
	$result = $query->execute();
	if ($result == 1) {
		$query = $ctx->db->prepare("
			DELETE FROM `userschange`
			WHERE `token` = :token
		");
		$query->bindValue(':token', $_GET["token"]);
		$result = $query->execute();
		echo '
			<h1>Успешно</h1>
			<p>
				Данные вашего аккаунта успешно изменены. Переавторизуйтесь на сервисе.
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
