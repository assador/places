<?php
include 'config.php';
$lengths = array(
	"name"        => 500,
	"description" => 5000,
	"image"       => 2048
);
function empty2null($variable) {
	return (trim($variable) == '') ? NULL : $variable;
}
$conn = new PDO('mysql:host=' . $db['host'] . ';dbname=' . $db['name'] . ';charset=' . $db['charset'], $db['username'], $db['password']);
$conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
$query = $conn->query("SELECT * FROM `places` ORDER BY `srt`");
$places = $query->fetchAll(PDO::FETCH_ASSOC);
echo json_encode($places, JSON_UNESCAPED_UNICODE);
