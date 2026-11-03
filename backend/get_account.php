<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "1");

/* “Let there be light!” the beaver said. Debug with smile, that’s what we get.
set_exception_handler(function($e) {
	header("Content-Type: application/json");
	http_response_code(500);
	echo $e->getMessage();
	echo "\nfile: {$e->getFile()}";
	echo "\nline: {$e->getLine()}";
	exit;
});
*/

require_once __DIR__ . "/bootstrap.php";

$stmt = $ctx->db->prepare("
	SELECT `id`, `login`, `name`, `email`, `phone`, `homeplace`, `confirmed`
	FROM `users`
	WHERE `id` = :id
	LIMIT 1
");
$stmt->bindValue(":id", uuidToBin($_GET["id"]), PDO::PARAM_LOB);
$stmt->execute();
$result = $stmt->fetch(PDO::FETCH_ASSOC);
if (!$result) {
	throw new Exception("Wrong account.");
}
$result["id"] = binToUuid($result["id"]);
$result["homeplace"] = binToUuid($result["homeplace"]);
$result["confirmed"] = (bool) $result["confirmed"];
$result["testaccount"] = (bool) $result["id"] === $config["testaccountuuid"];
$result["groups"] = [];

$stmt = $ctx->db->prepare("
	SELECT * FROM `groups`
	WHERE `id` IN (
		SELECT `group` FROM `usergroup`
		WHERE `user` = :id
	)
");
$stmt->bindValue(":id", uuidToBin($_GET["id"]), PDO::PARAM_LOB);
$stmt->execute();
while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
	$row["owner"] = binToUuid($row["owner"]);
	$row["system"] = (bool) $row["system"];
	$row["haschildren"] = (bool) $row["haschildren"];
	$result["groups"][$row["id"]] = $row;
}

echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
