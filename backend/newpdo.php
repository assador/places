<?php
if(!isset($conn) || $conn == null) {
	$conn = new PDO('mysql:host=' . $db['host'] . ';dbname=' . $db['name'] . ';charset=' . $db['charset'], $db['username'], $db['password']);
	$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
}
