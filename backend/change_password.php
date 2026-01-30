<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$sessionId = uuidToBin($_GET["session"]) ?? null;
$reason = (int)$_GET["reason"] ?? null;
if (!$sessionId) {
	echo 0;
	exit;
}
$session = validateSession($ctx, $sessionId, $reason);
if ($session === null) {
	echo 1;
	exit;
}
$query = $ctx->db->prepare("
	SELECT `id`, `login`, `name`
	FROM `users`
	WHERE `id` = :id
");
$query->bindValue(':id', $session["userid"], PDO::PARAM_LOB);
$query->execute();

$result = $query->fetch(PDO::FETCH_ASSOC);
if(!$result) {
	echo 2;
	exit;
}

$id = $result["id"];
$login = $result["login"];
$name = $result["name"];
$password = generateRandomString(8);

$query = $ctx->db->prepare("
	UPDATE `users`
	SET `password` = :password
	WHERE `id` = :id
");
$query->bindValue(':id', $id, PDO::PARAM_LOB);
$query->bindValue(':password', password_hash($password, PASSWORD_DEFAULT));
$query->execute();

echo "
	<h1>Новый пароль создан</h1>
	<p>
		Здравствуйте" . ($name != "" && $name != null ? ', ' . $name : '') . "!
	<p>
		Создан новый пароль для вашего аккаунта
		в <a href=\"{$host}\">Персональном ГеоОрганайзере «Места»</a>.
	</p>
	<p>
		Ваш логин: {$login}<br />
		Ваш новый пароль: {$password}
	</p>
	<p>
		При желении вы сможете изменить их в личном кабинете после авторизации.
	</p>
";
if ($reason === 1) {
	$query = $ctx->db->prepare("
		DELETE FROM `sessions`
		WHERE `id` = :id
	");
	$query->bindValue(':id', $sessionId, PDO::PARAM_LOB);
	$query->execute();
}
