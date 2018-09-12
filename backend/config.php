<?php
$db = array(
	"name"      => "db_places",
	"username"  => "dbu_places",
	"password"  => "dbuBTx083!Jsx",
	"host"      => "localhost",
	"port"      => "3306",
	"driver"    => "mysql",
	"collation" => "utf8mb4_general_ci",
	"charset"   => "utf8",
);
$lengths = array(
	"name"        => 500,
	"description" => 5000,
	"url"         => 2048
);
$basepath = "/var/www/places/";
$dirs = array(
	"common" => $basepath,
	"upload" => array(
		"images" => array(
			"big" => $basepath . "uploads/images/big/",
			"small" => $basepath . "uploads/images/small/",
		),
	),
);
function empty2null($variable) {
	return (trim($variable) == "") ? NULL : $variable;
}
