<?php
require_once __DIR__ . '/bootstrap.php';

$query = $ctx->db->prepare("
	SELECT * FROM users
	WHERE id = :id
");
$query->bindValue(":id", uuidToBin($_GET["id"]), PDO::PARAM_LOB);
$query->execute();
$result = $query->fetch(PDO::FETCH_ASSOC);
if (!$result) {
	echo 0;
	exit;
}
$result["id"] = binToUuid($result["id"]);
$result["homeplace"] = binToUuid($result["homeplace"]);
$result["testaccount"] = $result["id"] === $testaccountuuid ? true : false;

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
	$result["groups"][] = array(
		"group"  => $value["group"],
		"parent" => $value["parent"]
	);
}
echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
