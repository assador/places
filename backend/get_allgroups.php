<?php
require_once __DIR__ . '/bootstrap.php';

$_POST = json_decode(
    file_get_contents("php://input"),
    true,
    512,
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
if (passwordHashCheck($ctx, $_POST["user"]["id"], $_POST["user"]["password"])) {
    $query = $ctx->db->query("SELECT * FROM `groups`");
    $result = $query->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} else {
    echo false;
}
