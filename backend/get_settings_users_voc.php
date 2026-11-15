<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {
	$result = [];

	$stmt = $ctx->db->query("SELECT * FROM `settings_users_voc`");
	$voc = $stmt->fetchAll(PDO::FETCH_ASSOC);

	$stmtOptions = $ctx->db->query("
		SELECT o.`settingid`, o.`value`, o.`srt`, o.`extra`
		FROM `settings_users_voc_options` o
		INNER JOIN `settings_users_voc` v ON v.`id` = o.`settingid`
		ORDER BY o.`settingid` ASC, o.`srt` ASC
	");
	$rawOptions = $stmtOptions->fetchAll(PDO::FETCH_ASSOC);

	$vocOptions = [];
	foreach ($rawOptions as $opt) {
		$vocOptions[(int) $opt["settingid"]][] = $opt;
	}

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
