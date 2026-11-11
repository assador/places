<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {
	$stmt = $ctx->db->query("SELECT * FROM `settings_groups`");
	apiSuccess($stmt->fetchAll(PDO::FETCH_ASSOC));
});
