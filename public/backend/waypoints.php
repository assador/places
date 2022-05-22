<?php
include "config.php";
include "newpdo.php";
include "common.php";

$waypoint = $conn->prepare("
	INSERT INTO `waypoints` (
		`id`                 ,
		`latitude`           ,
		`longitude`          ,
		`altitudecapability` ,
		`time`               ,
		`common`
	) VALUES (
		:id                 ,
		:latitude           ,
		:longitude          ,
		:altitudecapability ,
		:time               ,
		0
	)
");
$placeswaypoint = $conn->prepare("
	UPDATE `places` SET `waypoint` = :waypoint WHERE `id` = :id
");
$query = $conn->prepare("
	CREATE TABLE `waypoints` (
		`id` VARCHAR (32) NOT NULL,
		`latitude` DOUBLE NOT NULL,
		`longitude` DOUBLE NOT NULL,
		`altitudecapability` DOUBLE DEFAULT NULL,
		`time` VARCHAR (24) NOT NULL DEFAULT '',
		`common` BOOLEAN NOT NULL DEFAULT 0,
		PRIMARY KEY (`id`),
		CONSTRAINT `U_waypoints` UNIQUE (`id`)
	)
");
$query->execute();
$query = $conn->prepare("
	ALTER TABLE `places` ADD COLUMN `waypoint` VARCHAR (32) NOT NULL AFTER `id`
");
$query->execute();
$query = $conn->query("
	SELECT *
	FROM places
");
$places = $query->fetchAll(PDO::FETCH_ASSOC);
$new = '';
foreach ($places as $row) {
	$new = generateRandomString(32);
	$placeswaypoint->bindParam( ":id"       , $row[ "id" ]);
	$placeswaypoint->bindParam( ":waypoint" , $new        );
	$placeswaypoint->execute();
	$waypoint->bindParam( ":id"                 , $new                        );
	$waypoint->bindParam( ":latitude"           , $row[ "latitude"           ]);
	$waypoint->bindParam( ":longitude"          , $row[ "longitude"          ]);
	$waypoint->bindParam( ":altitudecapability" , $row[ "altitudecapability" ]);
	$waypoint->bindParam( ":time"               , $row[ "time"               ]);
	$waypoint->execute();
}
$query = $conn->prepare("
	ALTER TABLE `places`
	DROP COLUMN `latitude`,
	DROP COLUMN `longitude`,
	DROP COLUMN `altitudecapability`
");
$query->execute();
exit;
