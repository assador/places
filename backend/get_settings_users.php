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

	$settings = [];

	$stmt = $ctx->db->prepare("
		SELECT
			u.`settingid`,
			u.`value`,
			v.`type`
		FROM `settings_users` AS u
		INNER JOIN `settings_users_voc` AS v
			ON v.`id` = u.`settingid`
		WHERE
			u.`userid` = :userid
			AND v.`public` = 1
	");
	$stmt->bindValue(":userid", $binUserId, PDO::PARAM_LOB);
	$stmt->execute();

	while ($item = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$id = (int) $item["settingid"];
		$type = (int) $item["type"];
		$settings[$id] = [
			"settingid" => $id,
			"value"     => castSettingValue($item["value"], $type),
		];
	}

	apiSuccess((object) $settings);
});
