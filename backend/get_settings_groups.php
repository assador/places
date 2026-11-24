<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {
	$groups = [];
	$stmt = $ctx->db->query("SELECT * FROM `settings_groups`");
	foreach ($stmt->fetchAll(PDO::FETCH_ASSOC) as $group) {
		$item = [
			"id"     => (string) $group["id"],
			"srt"    => (float) $group["srt"],
			"parent" =>
				$group["parent"] !== null ? (string) $group["parent"] : null
			,
		];
		if (!empty($group["name"])) {
			$item["name"] = (string) $group["name"];
		}
		if (!empty($group["description"])) {
			$item["description"] = (string) $group["description"];
		}
		$groups[] = $item;
	}
	apiSuccess($groups);
});
