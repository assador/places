<?php

function testAccountCheck($conn, $testaccountid, $id) {
	$query = $conn->query("SELECT `id` FROM `users` WHERE `id` = '" . $id . "'");
	$result = $query->fetchAll(PDO::FETCH_ASSOC);
	return (count($result) > 0 && $result[0]["id"] == $testaccountid ? true : false);
}
function passwordHashCheck($conn, $id, $password) {
	$query = $conn->query("SELECT `password` FROM `users` WHERE `id` = '" . $id . "'");
	$result = $query->fetch(PDO::FETCH_ASSOC);
	return (count($result) > 0 && $result["password"] == $password ? true : false);
}
function generateRandomString($length = 32) {
	$characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
	$charactersLength = strlen($characters);
	$randomString = '';
	for ($i = 0; $i < $length; $i++) {
		$randomString .= $characters[rand(0, $charactersLength - 1)];
	}
	return $randomString;
}
function get_all_with_waypoint_id($conn, $id) {
	$all_with_waypoint_id = [];
	$query = $conn->query("
		SELECT `p`.`id`, `p`.`userid`
		FROM `places` `p`
		WHERE `p`.`waypoint` = '" . $id . "'
	");
	$get_all_with_waypoint_id = $query->fetchAll(PDO::FETCH_ASSOC);
	foreach($get_all_with_waypoint_id as $value) {
		$all_with_waypoint_id[] = array(
			"type"   => 'place',
			"id"     => $value["id"],
			"userid" => $value["userid"]
		);
	}
	return $all_with_waypoint_id;
}
