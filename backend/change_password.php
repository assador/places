<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$sessionId = $_GET["session"] ?? null;
if (!$sessionId) {
	die("Некорректная ссылка.");
}
$sessionIdBin = uuidToBin($sessionId) ?? null;
$session = getSession($ctx, $sessionIdBin, 1);
if ($session === null) {
	die("Ссылка устарела или уже была использована.");
}

$userIdBin = $session["userid"];
$login = $session["login"];
$name = $session["name"];
$password = generateRandomString(8);

$query = $ctx->db->prepare("
	UPDATE `users`
	SET `password` = :password
	WHERE `id` = :id
");
$query->bindValue(':id', $userIdBin, PDO::PARAM_LOB);
$query->bindValue(':password', password_hash($password, PASSWORD_DEFAULT));
$query->execute();

echo "
	<h1>Новый пароль создан</h1>
	<p>
		Здравствуйте" . ($name != "" && $name != null ? ', ' . $name : '') . "!
	<p>
		Создан новый пароль для вашего аккаунта
		в <a href=\"{$config['host']}\">Персональном ГеоОрганайзере «Места»</a>.
	</p>
	<p>
		Ваш логин: {$login}<br />
		Ваш новый пароль: {$password}
	</p>
	<p>
		При желении вы сможете изменить их в личном кабинете после авторизации.
	</p>
";
deleteSession($ctx, $sessionIdBin, $userIdBin);
