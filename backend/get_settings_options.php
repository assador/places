<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {

	$options = [];

	$stmt = $ctx->db->query("
		SELECT
			o.`id`,
			o.`enumid`,
			o.`value`,
			e.`type`,
			o.`srt`,
			o.`enabled`,
			o.`extra`
		FROM `settings_options` o
		JOIN `settings_enums` e ON e.`id` = o.`enumid`
	");

	while ($item = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$id = (int) $item["id"];
		$value = castSettingValue($item["value"], (int) $item["type"]);

		$options[$id] = [
			"id"      => $id,
			"enumid"  => (int) $item["enumid"],
			"value"   => $value,
			"srt"     => (float) $item["srt"],
			"enabled" => (bool) $item["enabled"],
		] + array_filter([
			/*
			// For future reference, if it’s a binary image:
			"extra" => "data:image/png;base64," . base64_encode($item["extra"])
			;
   			// or SVG: "data:image/svg+xml;base64,..."
      		*/
			"extra"   => $item["extra"],
		], fn($v) => $v !== null);
	}

	apiSuccess((object) $options);
});
