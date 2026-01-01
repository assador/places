<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

$userId = uuidToBin($_GET["useruuid"]);

$query = $ctx->db->prepare("
	SELECT `id`
	FROM `groups`
	WHERE `id`
	IN (
		SELECT `group`
		FROM `usergroup`
		WHERE `user` = :user
	)
	AND `parent` = 'visiting'
");
$query->bindValue(':user', $userId, PDO::PARAM_LOB);
$query->execute();
$group = $query->fetch(PDO::FETCH_ASSOC);
$groupId = $group['id'] ?? null;

$config = array(
	"mail"       => $mail,
	"lengths"    => $lengths,
	"mimes"      => $mimes,
	"uploadsize" => $uploadsize,
);
foreach ($rights as $key => $value) {
	$config["rights"][$key] = $groupId !== null
		? ($rights[$key][$groupId] ?? 0)
		: 0 // It looks like the account is not a member of any group at all.
	;
}

echo json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);

exit;
