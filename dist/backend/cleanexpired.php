<?php
include "config.php";
include "newpdo.php";

$query = $conn->query("SELECT `id`, `confirmbefore` FROM `users` WHERE `confirmed` = 0");
$result = $query->fetchAll(PDO::FETCH_ASSOC);
clean($conn, $result, "users");
$query = $conn->query("SELECT `id`, `confirmbefore` FROM `users_change`");
$result = $query->fetchAll(PDO::FETCH_ASSOC);
clean($conn, $result, "users_change");

function clean($conn, $result, $table) {
	$nowDateTime = new DateTime("now");
	foreach($result as $user) {
		$regDateTime = DateTime::createFromFormat("Y-m-d H:i:s", $user["confirmbefore"]);
		if($regDateTime < $nowDateTime) {
			$query = $conn->query("DELETE FROM `" . $table . "` WHERE `id` = '" . $user["id"] . "'");
			$query->execute();
		}
	}
}
