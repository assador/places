<?php
$host = "http://places.scrofa-tridens.ru";
$from = "service@places.scrofa-tridens.ru";
$dirs = array(
	"uploads" => array(
		"images" => array(
			"big" =>            "../uploads/images/big/",
			"small" =>          "../uploads/images/small/",
			"orphaned_big" =>   "../uploads/images/big/orphaned/",
			"orphaned_small" => "../uploads/images/small/orphaned/",
		),
	),
);
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
$testaccountid = "WTFjfa3NGGW8CyeS6CXuvK62TIWPaltF";
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
$uploadsize = 12582912;
$rights = array(
	"placescounts" => array(
		"publishers" => -1,
		"managers"   => -1,
		"admins"     => -1,
		"beginners"  => 50,
		"ordinary"   => 300,
		"trusted"    => 1000,
		"superusers" => -1,
	),
	"folderscounts" => array(
		"publishers" => -1,
		"managers"   => -1,
		"admins"     => -1,
		"beginners"  => 30,
		"ordinary"   => 200,
		"trusted"    => 700,
		"superusers" => -1,
	),
	"photocounts" => array(
		"publishers" => -1,
		"managers"   => -1,
		"admins"     => -1,
		"beginners"  => 10,
		"ordinary"   => 50,
		"trusted"    => 500,
		"superusers" => -1,
	),
	"photosizes" => array(
		"publishers" => -1,
		"managers"   => -1,
		"admins"     => -1,
		"beginners"  => 1048576,
		"ordinary"   => 2097152,
		"trusted"    => 4194304,
		"superusers" => -1,
	),
);
function empty2null($variable) {
	return (trim($variable) == "") ? NULL : $variable;
}
