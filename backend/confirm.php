<?php
require_once __DIR__ . '/bootstrap.php';

$token = $_GET["token"] ?? null;
if (!$token) {
	die('Токен не передан.');
}

try {
	$ctx->db->beginTransaction();
	$update = $ctx->db->prepare("
		UPDATE `users`
		SET `confirmed` = 1
		WHERE `token` = :token
			AND `confirmed` = 0
	");
	$update->execute([
		":token" => $token,
	]);
	if ($update->rowCount() > 0) {
		$select = $ctx->db->prepare("
			SELECT `id` FROM `users` WHERE `token` = :token LIMIT 1
		");
		$select->execute([
			":token" => $token,
		]);
		$user = $select->fetch(PDO::FETCH_ASSOC);

		$insert = $ctx->db->prepare("
			INSERT INTO `usergroup` (`user`, `group`, `enabled`)
			VALUES (:userid, 'beginners', 1)
		");
		$insert->execute([
			":userid" => $user["id"],
		]);

		$ctx->db->commit();
		echo '
			<h1>Успешно</h1>
			<p>
				Ваша регистрация успешно подтвержена. Теперь вы можете
				<a href="/auth">авторизоваться</a> на сервисе под своим логином.
			</p>
		';
	} else {
		$ctx->db->rollBack();
		echo '
			<h1>Неуспешно</h1>
			<p>
				Токен недействителен.
				Возможно, прошёл отведённый срок подтверждения регистрации,
				или аккаунт уже активирован.
			</p>
		';
	}
} catch (Exception $e) {
	$ctx->db->rollBack();
	error_log($e->getMessage());
}
