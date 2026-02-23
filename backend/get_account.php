<?php
require_once __DIR__ . '/bootstrap.php';

$query = $ctx->db->prepare("
	SELECT `id`, `login`, `name`, `email`, `phone`, `homeplace`, `confirmed`
	FROM `users`
	WHERE `id` = :id
	LIMIT 1
");
$query->bindValue(":id", uuidToBin($_GET["id"]), PDO::PARAM_LOB);
$query->execute();
$result = $query->fetch(PDO::FETCH_ASSOC);
if (!$result) {
	die("Пользователь не найден.");
}
$result["id"] = binToUuid($result["id"]);
$result["homeplace"] = binToUuid($result["homeplace"]);
$result["testaccount"] = $result["id"] === $config["testaccountuuid"] ? true : false;

$query = $ctx->db->prepare("
	SELECT * FROM `usergroup`
	INNER JOIN `groups` ON `usergroup`.`group` = `groups`.`id`
	WHERE `user` = :id
");
$query->bindValue(":id", uuidToBin($_GET["id"]), PDO::PARAM_LOB);
$query->execute();
$groups = $query->fetchAll(PDO::FETCH_ASSOC);

$result["groups"] = [];
foreach	($groups as $key => $value) {
	$result["groups"][] = [
		"group"  => $value["group"],
		"parent" => $value["parent"],
	];
}
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
