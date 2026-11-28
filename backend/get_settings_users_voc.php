<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {

	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
	$binUserId = uuidToBin($data["userid"]);
	$binSessionId = uuidToBin($data["sessionid"]);

	if (!isValidSession($ctx, $binUserId, $binSessionId)) {
		throw new ApiException(401, "invalid_session");
	}

	$stmt = $ctx->db->prepare("
		SELECT 1
		FROM `groups` g
		INNER JOIN `usergroup` ug
			ON g.`id` = ug.`group`
		WHERE
			ug.`user` = :userid
			AND ug.`enabled` = 1
			AND g.`parent` = 'management'
		LIMIT 1
	");
	$stmt->bindValue(":userid", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();
	$inManagement = (bool) $stmt->fetchColumn();

	$voc = [];

	$stmt = $ctx->db->query("
		SELECT
			`id`,
			`groupid`,
			`type`,
			`baseval`,
			`enumid`,
			`name`,
			`description`,
			`public`,
			`srt`
		FROM `settings_users_voc`
	");

	while ($item = $stmt->fetch(PDO::FETCH_ASSOC)) {
		if (!(bool) $item["public"] && !$inManagement) continue;

		$id = (int) $item["id"];
		$type = (int) $item["type"];
		$baseval = castSettingValue($item["baseval"], $type);
		$groupid = $item["groupid"] !== null ? (int) $item["groupid"] : null;
		$enumid = $item["enumid"] !== null ? (int) $item["enumid"] : null;

		$name = $item["name"] !== null
			? trim((string) $item["name"])
			: null
		;
		$name = $name !== "" ? $name : null;

		$description = $item["description"] !== null
			? trim((string) $item["description"])
			: null
		;
		$description = $description !== "" ? $description : null;

		$voc[$id] = [
			"id"      => $id,
			"groupid" => $groupid,
			"type"    => $type,
			"baseval" => $baseval,
			"public"  => (bool) $item["public"],
			"srt"     => (float) $item["srt"],
		] + array_filter([
			"enumid"      => $enumid,
			"name"        => $name,
			"description" => $description,
		], fn($v) => $v !== null);
	}

	apiSuccess((object) $voc);
});
