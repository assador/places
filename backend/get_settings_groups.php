<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {

	$groups = [];

	$stmt = $ctx->db->query("
		SELECT
			`id`,
			`parent`,
			`name`,
			`description`,
			`srt`
		FROM `settings_groups`
	");

	while ($item = $stmt->fetch(PDO::FETCH_ASSOC)) {
		$id = (int) $item["id"];
		$parent = $item["parent"] !== null ? (int) $item["parent"] : null;

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

		$groups[$id] = [
			"id"          => $id,
			"parent"      => $parent,
			"srt"         => (float) $item["srt"],
		] + array_filter([
			"name"        => $name,
			"description" => $description,
		], fn($v) => $v !== null);
	}

	apiSuccess((object) $groups);
});
