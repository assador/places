<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

function castSettingValue(?string $value, int $type): null|bool|float|int|string {
	if ($value === null) return null;
	return match ($type) {
		0 => null,
		1 => trim($value, "0\x00") !== '',
		2 => is_numeric($value) ? $value + 0 : 0,
		3 => $value,
		default => null,
	};
}

apiRun($ctx, function () use ($ctx) {
	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);
	$binUserId = uuidToBin($data["userid"]);
	$binSessionId = uuidToBin($data["sessionid"]);

	if (!isValidSession($ctx, $binUserId, $binSessionId)) {
		throw new ApiException(401, "invalid_session");
	}

	$result = [];

	$stmt = $ctx->db->query("
		SELECT `id`, `groupid`, `type`, `baseval`, `name`, `description`, `srt`
		FROM `settings_users_voc`
		WHERE `public` = TRUE
	");
	$voc = $stmt->fetchAll(PDO::FETCH_ASSOC);

	$stmtOptions = $ctx->db->query("
		SELECT o.`settingid`, o.`value`, o.`srt`, o.`extra`
		FROM `settings_users_voc_options` o
		INNER JOIN `settings_users_voc` v ON v.`id` = o.`settingid`
		WHERE o.`enabled` = TRUE 
			AND v.`public` = TRUE
		ORDER BY o.`settingid` ASC, o.`srt` ASC
	");
	$rawOptions = $stmtOptions->fetchAll(PDO::FETCH_ASSOC);

	$vocOptions = [];
	foreach ($rawOptions as $opt) {
		$vocOptions[(int) $opt["settingid"]][] = $opt;
	}

	$stmtUser = $ctx->db->prepare("
		SELECT `settingid`, `value`
		FROM `settings_users`
		WHERE `userid` = :userid
	");
	$stmtUser->bindValue(":userid", $binUserId, PDO::PARAM_LOB);
	$stmtUser->execute();
	$userValues = $stmtUser->fetchAll(PDO::FETCH_KEY_PAIR);

	foreach ($voc as $item) {
		$id = (int) $item["id"];
		$type = (int) $item["type"];
		$srt = (float) $item["srt"];
		$baseval = castSettingValue($item["baseval"], $type);

		$enumList = [];
		if (isset($vocOptions[$id])) {
			foreach ($vocOptions[$id] as $opt) {
				$enumItem = [
					"val" => castSettingValue($opt["value"], $type),
					"srt" => (float) $opt["srt"],
				];
				if ($opt["extra"] !== null) {
					/*
					// For future reference, if it’s a binary image:
					$enumItem["extra"] =
						"data:image/png;base64," . base64_encode($opt["extra"])
					;
	    			// or SVG: "data:image/svg+xml;base64,..."
	       			*/
					$enumItem["extra"] = $opt["extra"];
				}
				$enumList[] = $enumItem;
			}
		}
		$result[(string) $id] = [
			"valtype" => $type,
			"baseval" => $baseval,
			"folderid" => (string) $item["groupid"],
			"srt" => $srt,
			"val" => array_key_exists($id, $userValues)
				? castSettingValue($userValues[$id], $type)
				: $baseval
			,
		]
			+ ($enumList ? ["enum" => $enumList] : [])
			+ array_filter([
				"name" => $item["name"] ?? null,
				"description" => $item["description"] ?? null,
			])
		;
	}

	apiSuccess($result);
});
