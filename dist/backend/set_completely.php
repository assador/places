<?php
include "config.php";
include "newpdo.php";
include "common.php";

if(testAccountCheck($conn, $testaccountid, $_POST["id"])) {
	echo 2; exit;
} else {
	$data = json_decode($_POST["data"], true);
	$query = $conn->query("
		SELECT * FROM `images` AS `i` WHERE `i`.`placeid` IN (
			SELECT `p`.`id` FROM `places` AS `p` WHERE `p`.`userid` = '" . $_POST["id"] . "'
		)
	");
	$images_db = $query->fetchAll(PDO::FETCH_ASSOC);
	$images = array();
	foreach($data["places"] as $dval) {
		$pimg = $dval["images"];
		foreach($pimg as $ival) {
			$images[] = $ival;
		}
	}
	$deleteimages = $conn->prepare("
		DELETE FROM `images` WHERE `placeid` IN (
			SELECT `id` FROM `places` WHERE `userid` = :userid
		)
	");
	$deleteplaces = $conn->prepare("
		DELETE FROM `places` WHERE `userid` = :userid
	");
	$deletefolders = $conn->prepare("
		DELETE FROM `folders` WHERE `userid` = :userid
	");
	$appendimage = $conn->prepare("
		INSERT INTO `images` (
			`id`           ,
			`file`         ,
			`size`         ,
			`type`         ,
			`lastmodified` ,
			`srt`          ,
			`placeid`
		) VALUES (
			:id            ,
			:file          ,
			:size          ,
			:type          ,
			:lastmodified  ,
			:srt           ,
			:placeid
		)
	");
	$appendplace = $conn->prepare("
		INSERT INTO `places` (
			`id`                 ,
			`folderid`           ,
			`name`               ,
			`description`        ,
			`latitude`           ,
			`longitude`          ,
			`altitudecapability` ,
			`time`               ,
			`srt`                ,
			`common`             ,
			`userid`
		) VALUES (
			:id                 ,
			:folderid           ,
			:name               ,
			:description        ,
			:latitude           ,
			:longitude          ,
			:altitudecapability ,
			:time               ,
			:srt                ,
			:common             ,
			:userid
		)
	");
	$appendfolder = $conn->prepare("
		INSERT INTO `folders` (
			`id`          ,
			`parent`      ,
			`name`        ,
			`description` ,
			`srt`         ,
			`userid`
		) VALUES (
			:id           ,
			:parent       ,
			:name         ,
			:description  ,
			:srt          ,
			:userid
		)
	");
	foreach($images as $row) {
		$found = false;
		foreach($images_db as $row_db) {
			if($row_db["id"] == $row["id"]) {
				$found = true;
				break;
			}
		}
		if(!$found) {
			try {
				rename(
					$dirs["uploads"]["images"]["orphaned_small"] . $row["file"],
					$dirs["uploads"]["images"]["small"]          . $row["file"]
				);
				rename(
					$dirs["uploads"]["images"]["orphaned_big"] . $row["file"],
					$dirs["uploads"]["images"]["big"]          . $row["file"]
				);
			} catch(Exception $e) {
				continue;
			}
		}
	}
	foreach($images_db as $row_db) {
		$found = false;
		foreach($images as $row) {
			if($row["id"] == $row_db["id"]) {
				$found = true;
				break;
			}
		}
		if(!$found) {
			try {
				rename(
					$dirs["uploads"]["images"]["small"]          . $row_db["file"],
					$dirs["uploads"]["images"]["orphaned_small"] . $row_db["file"]
				);
				rename(
					$dirs["uploads"]["images"]["big"]          . $row_db["file"],
					$dirs["uploads"]["images"]["orphaned_big"] . $row_db["file"]
				);
			} catch(Exception $e) {
				continue;
			}
		}
	}
	$deleteimages->bindParam(":userid", $_POST["id"]);
	$deleteplaces->bindParam(":userid", $_POST["id"]);
	$deletefolders->bindParam(":userid", $_POST["id"]);
	try {$deleteimages->execute();} catch(Exception $e) {}
	try {$deleteplaces->execute();} catch(Exception $e) {}
	try {$deletefolders->execute();} catch(Exception $e) {}
	foreach($data["folders"] as $row) {
		$appendfolder->bindParam( ":id"          , $row[ "id"          ]);
		$appendfolder->bindParam( ":parent"      , $row[ "parent"      ]);
		$appendfolder->bindParam( ":name"        , $row[ "name"        ]);
		$appendfolder->bindParam( ":description" , $row[ "description" ]);
		$appendfolder->bindParam( ":srt"         , $row[ "srt"         ]);
		$appendfolder->bindParam( ":userid"      , $_POST["id"]);
		try {$appendfolder->execute();} catch(Exception $e) {}
	}
	foreach($data["places"] as $row) {
		$appendplace->bindParam( ":id"                 , $row[ "id"                 ]);
		$appendplace->bindParam( ":folderid"           , $row[ "folderid"           ]);
		$appendplace->bindParam( ":name"               , $row[ "name"               ]);
		$appendplace->bindParam( ":description"        , $row[ "description"        ]);
		$appendplace->bindParam( ":latitude"           , $row[ "latitude"           ]);
		$appendplace->bindParam( ":longitude"          , $row[ "longitude"          ]);
		$appendplace->bindParam( ":altitudecapability" , $row[ "altitudecapability" ]);
		$appendplace->bindParam( ":time"               , $row[ "time"               ]);
		$appendplace->bindParam( ":srt"                , $row[ "srt"                ]);
		$appendplace->bindParam( ":common"             , $row[ "common"             ]);
		$appendplace->bindParam( ":userid"             , $_POST["id"]);
		try {$appendplace->execute();} catch(Exception $e) {}
	}
	foreach($images as $row) {
		$appendimage->bindParam( ":id"           , $row[ "id"           ]);
		$appendimage->bindParam( ":file"         , $row[ "file"         ]);
		$appendimage->bindParam( ":size"         , $row[ "size"         ]);
		$appendimage->bindParam( ":type"         , $row[ "type"         ]);
		$appendimage->bindParam( ":lastmodified" , $row[ "lastmodified" ]);
		$appendimage->bindParam( ":srt"          , $row[ "srt"          ]);
		$appendimage->bindParam( ":placeid"      , $row[ "placeid"      ]);
		try {$appendimage->execute();} catch(Exception $e) {}
	}
	echo 1; exit;
}
