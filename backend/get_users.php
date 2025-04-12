<?php
include "config.php";
include "newpdo.php";
include "common.php";

$_POST = json_decode(
    file_get_contents("php://input"),
    true,
    512,
    JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES
);
if ($_POST["users"]) {
    $in = "('" . implode("','", $_POST["users"]) . "')";
    $query = $conn->query("SELECT `id`, `login`, `name` FROM `users` WHERE `id` IN " . $in);
    $result = $query->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} else if (
    $_POST["user"] &&
    passwordHashCheck($conn, $_POST["user"]["id"], $_POST["user"]["password"])
) {
    $query = $conn->query("SELECT * FROM `users`");
    $result = $query->fetchAll(PDO::FETCH_ASSOC);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
} else {
    echo false;
}
