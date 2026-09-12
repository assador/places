<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "1");

require_once __DIR__ . "/bootstrap.php";

$stmt = $ctx->db->query("
    SELECT `id`, `parent`, `srt` 
    FROM `settings_users_groups` 
");

echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
