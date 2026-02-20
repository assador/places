<?php
$config = require_once __DIR__ . "/config.php";
require_once __DIR__ . "/context.php";
require_once __DIR__ . "/newpdo.php";
require_once __DIR__ . "/common.php";

$ctx = new AppContext();
$ctx->db = $conn;
$ctx->db->exec("SET time_zone = '+00:00'");
