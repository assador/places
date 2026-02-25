<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

return [
	"host" => "http://localhost:5173",
	"dirs" => [
		"uploads" => [
			"images" => [
				"big"            => __DIR__ . "/../uploads/images/big/",
				"small"          => __DIR__ . "/../uploads/images/small/",
				"orphaned_big"   => __DIR__ . "/../uploads/images/big/orphaned/",
				"orphaned_small" => __DIR__ . "/../uploads/images/small/orphaned/",
			],
		],
	],
	"db" => [
		"name"      => "db_places",
		"username"  => "dbu_places",
		"password"  => "sql3rxb2sa",
		"host"      => "localhost",
		"port"      => "3306",
		"driver"    => "mysql",
		"collation" => "utf8mb4_unicode_ci",
		"charset"   => "utf8mb4",
	],
	"testaccountuuid" => "f201c875-8d80-11f0-9d45-01d62c5c4751",
	"mail" => [
		"from" => "noreply@places.earth",
		"name" => "Сервис «Места»",
		"logs" => __DIR__ . "/../log/mails",
		"smtp" => null,
	/* example:
		"smtp" => [
			"host"     => "smtp.example.com",
			"port"     => 587,
			"username" => "...",
			"password" => "...",
			"secure"   => "tls",
		],
	*/
	],
	"lengths" => [
		"name"        => 500,
		"description" => 5000,
		"url"         => 2048,
	],
	"mimes" => [
		"image/gif"     => "gif",
		"image/jpeg"    => "jpg",
		"image/png"     => "png",
		"image/svg+xml" => "svg",
	],
	"images" => [
		"big" => [
			"width"  => 1600,
			"height" => 1600,
		],
		"small" => [
			"width"  => 220,
			"height" => 220,
		],
	],
	"uploadsize" => 12582912,
	"rights" => [
		"pointscount" => [
			"publishers" => -1,
			"managers"   => -1,
			"admins"     => -1,
			"beginners"  => 100,
			"ordinary"   => 300,
			"trusted"    => 1000,
			"superusers" => -1,
		],
		"placescount" => [
			"publishers" => -1,
			"managers"   => -1,
			"admins"     => -1,
			"beginners"  => 100,
			"ordinary"   => 300,
			"trusted"    => 1000,
			"superusers" => -1,
		],
		"routescount" => [
			"publishers" => -1,
			"managers"   => -1,
			"admins"     => -1,
			"beginners"  => 100,
			"ordinary"   => 300,
			"trusted"    => 1000,
			"superusers" => -1,
		],
		"folderscount" => [
			"publishers" => -1,
			"managers"   => -1,
			"admins"     => -1,
			"beginners"  => 100,
			"ordinary"   => 300,
			"trusted"    => 1000,
			"superusers" => -1,
		],
		"photocount" => [
			"publishers" => -1,
			"managers"   => -1,
			"admins"     => -1,
			"beginners"  => 100,
			"ordinary"   => 300,
			"trusted"    => 1000,
			"superusers" => -1,
		],
		"photosize" => [
			"publishers" => -1,
			"managers"   => -1,
			"admins"     => -1,
			"beginners"  => 1048576,
			"ordinary"   => 2097152,
			"trusted"    => 4194304,
			"superusers" => -1,
		],
	],
];
