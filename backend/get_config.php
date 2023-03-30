<?php
include "config.php";
include "newpdo.php";
include "common.php";

$query = $conn->query("
	SELECT `id`
	FROM `groups`
	WHERE `id`
	IN (
		SELECT `group`
		FROM `usergroup`
		WHERE `user` = '" . $_GET["userid"] . "'
	)
	AND `parent` = 'visiting'
");
$group = $query->fetch(PDO::FETCH_ASSOC)["id"];
$config = array(
	"from"       => $from,
	"lengths"    => $lengths,
	"mimes"      => $mimes,
	"uploadsize" => $uploadsize,
);
foreach ($rights as $key => $value) {
	$config["rights"][$key] = $rights[$key][$group];
}
echo json_encode($config, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
exit;
