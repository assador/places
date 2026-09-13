<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "1");

require_once __DIR__ . "/bootstrap.php";

$userId = uuidToBin($_GET["id"] ?? "");

function castSettingValue(?string $value, int $type)
	: null|bool|float|int|string
{
	if ($value === null) return null;
	return match ($type) {
		0 => null,
		1 => trim($value, "0\x00") !== '',
		2 => is_numeric($value) ? $value + 0 : 0,
		3 => $value,
		default => null,
	};
}

$settings = [
	"user" => [],
	"vocs" => [
		"user" => [],
	],
];

$stmt = $ctx->db->query("
	SELECT `id`, `type`, `baseval`, `name`, `description`
	FROM `settings_users_voc`
	WHERE `public` = TRUE
");
$voc = $stmt->fetchAll(PDO::FETCH_ASSOC);

$stmtUser = $ctx->db->prepare("
	SELECT `settingid`, `value`
	FROM `settings_users`
	WHERE `userid` = :userid
");
$stmtUser->bindValue(":userid", $userId, PDO::PARAM_LOB);
$stmtUser->execute();
$userValues = $stmtUser->fetchAll(PDO::FETCH_KEY_PAIR);

foreach ($voc as $item) {
	$id = (int)$item["id"];
	$type = (int)$item["type"];
	$baseval = castSettingValue($item["baseval"], $type);
	$settings["vocs"]["user"][$id] = [
		"type" => $type,
		"baseval" => $baseval,
	] + array_filter([
		"name" => $item["name"] ?? null,
		"description" => $item["description"] ?? null,
	]);

	$settings["user"][$id] = array_key_exists($id, $userValues)
		? castSettingValue($userValues[$id], $type)
		: $baseval
	;
}
echo json_encode(
	$settings,
	JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
