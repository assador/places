<?php

function testAccountCheck($conn, $testaccountid, $id) {
	$query = $conn->query("SELECT `id` FROM `users` WHERE `id` = '" . $id . "'");
	$result = $query->fetchAll(PDO::FETCH_ASSOC);
	return (count($result) > 0 && $result[0]["id"] == $testaccountid ? true : false);
}
