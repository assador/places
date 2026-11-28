<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {

	$enums = [];

	$stmt = $ctx->db->query("
		SELECT
			`id`,
			`type`,
			`name`,
			`description`,
			`srt`
		FROM `settings_enums`
	");

	while ($item = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$id = (int) $item["id"];

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

		$enums[$id] = [
			"id"          => $id,
			"type"        => (int) $item["type"],
			"srt"         => (float) $item["srt"],
		] + array_filter([
			"name"        => $name,
			"description" => $description,
		], fn($v) => $v !== null);
	}

	apiSuccess((object) $enums);
});
