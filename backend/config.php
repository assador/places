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
	"url"         => 2048,
);
$mimes = array(
	"image/gif"     => "gif",
	"image/jpeg"    => "jpg",
	"image/png"     => "png",
	"image/svg+xml" => "svg",
);
$uploadsize = 12582912;
$acceptsize = 4194304;
$images = array(
	"big" => array(
		"width"  => 1600,
		"height" => 1600,
	),
	"small" => array(
		"width"  => 220,
		"height" => 220,
	),
);
$host = "http://places.scrofa-tridens.ru";
$from = "service@places.scrofa-tridens.ru";
$basepath = "/var/www/places/";
$dirs = array(
	"common" => $basepath,
	"uploads" => array(
		"images" => array(
			"big" => $basepath . "uploads/images/big/",
			"small" => $basepath . "uploads/images/small/",
			"orphaned_big" => $basepath . "uploads/images/big/orphaned/",
			"orphaned_small" => $basepath . "uploads/images/small/orphaned/",
		),
	),
);
$testaccountid = "WTFjfa3NGGW8CyeS6CXuvK62TIWPaltF";
function empty2null($variable) {
	return (trim($variable) == "") ? NULL : $variable;
}
