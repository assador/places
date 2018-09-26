<?php
include "config.php";
include "newpdo.php";

$data = json_decode($_POST["data"], true);

$images = array();
if($_POST["todo"] == "places") {
	foreach($data as $dval) {
		$pimg = $dval["images"];
		foreach($pimg as $ival) {
			$images[] = $ival;
		}
	}
}

function updateImages(&$conn, &$stmt, $images) {
	$stmt = $conn->prepare("
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
	$stmt->bindParam( ":id"           , $id           );
	$stmt->bindParam( ":file"         , $file         );
	$stmt->bindParam( ":size"         , $size         );
	$stmt->bindParam( ":type"         , $type         );
	$stmt->bindParam( ":lastmodified" , $lastmodified );
	$stmt->bindParam( ":srt"          , $srt          );
	$stmt->bindParam( ":placeid"      , $placeid      );
	foreach($images as $row) {
		$id           = $row[ "id"           ];
		$file         = $row[ "file"         ];
		$size         = $row[ "size"         ];
		$type         = $row[ "type"         ];
		$lastmodified = $row[ "lastmodified" ];
		$srt          = $row[ "srt"          ];
		$placeid      = $row[ "placeid"      ];
		$stmt->execute();
	}
}

if($_POST["todo"] == "places") {
	$delete = $conn->prepare("DELETE FROM `places` WHERE `id` = :id AND `userid` = :userid");
	$append = $conn->prepare("
		INSERT INTO `places` (
			`id`          ,
			`name`        ,
			`description` ,
			`latitude`    ,
			`longitude`   ,
			`srt`         ,
			`common`      ,
			`userid`
		) VALUES (
			:id           ,
			:name         ,
			:description  ,
			:latitude     ,
			:longitude    ,
			:srt          ,
			:common       ,
			:userid
		)
	");
	$update = $conn->prepare("
		UPDATE `places` SET
			`id`          = :id          ,
			`name`        = :name        ,
			`description` = :description ,
			`latitude`    = :latitude    ,
			`longitude`   = :longitude   ,
			`srt`         = :srt         ,
			`common`      = :common      ,
			`userid`      = :userid
		WHERE `id` = :id
	");
	$updateimage = $conn->prepare("
		UPDATE `images` SET
			`id`           = :id           ,
			`file`         = :file         ,
			`size`         = :size         ,
			`type`         = :type         ,
			`lastmodified` = :lastmodified ,
			`srt`          = :srt          ,
			`placeid`      = :placeid
		WHERE `id` = :id
	");
	foreach($data as $row) {
		if($row["deleted"] == true) {
			$delete->bindParam( ":id"          , $row[ "id"          ]);
			$delete->bindParam( ":userid"      , $_POST["id"]);
			try{$delete->execute();} catch(Exception $e) {}
		} else if($row["added"] == true) {
			$append->bindParam( ":id"          , $row[ "id"          ]);
			$append->bindParam( ":name"        , $row[ "name"        ]);
			$append->bindParam( ":description" , $row[ "description" ]);
			$append->bindParam( ":latitude"    , $row[ "latitude"    ]);
			$append->bindParam( ":longitude"   , $row[ "longitude"   ]);
			$append->bindParam( ":srt"         , $row[ "srt"         ]);
			$append->bindParam( ":common"      , $row[ "common"      ]);
			$append->bindParam( ":userid"      , $_POST["id"]);
			try{$append->execute();} catch(Exception $e) {}
		}
		if($row["updated"] == true) {
			$update->bindParam( ":id"          , $row[ "id"          ]);
			$update->bindParam( ":name"        , $row[ "name"        ]);
			$update->bindParam( ":description" , $row[ "description" ]);
			$update->bindParam( ":latitude"    , $row[ "latitude"    ]);
			$update->bindParam( ":longitude"   , $row[ "longitude"   ]);
			$update->bindParam( ":srt"         , $row[ "srt"         ]);
			$update->bindParam( ":common"      , $row[ "common"      ]);
			$update->bindParam( ":userid"      , $_POST["id"]);
			try{$update->execute();} catch(Exception $e) {}
		}
		foreach($row["images"] as $image) {
			if($image["updated"] == true) {
				$updateimage->bindParam( ":id"           , $image["id"           ]);
				$updateimage->bindParam( ":file"         , $image["file"         ]);
				$updateimage->bindParam( ":size"         , $image["size"         ]);
				$updateimage->bindParam( ":type"         , $image["type"         ]);
				$updateimage->bindParam( ":lastmodified" , $image["lastmodified" ]);
				$updateimage->bindParam( ":srt"          , $image["srt"          ]);
				$updateimage->bindParam( ":placeid"      , $image["placeid"      ]);
				try{$updateimage->execute();} catch(Exception $e) {}
			}
		}
	}
} elseif($_POST["todo"] == "images_upload") {
	updateImages($conn, $stmt, $data);
} elseif($_POST["todo"] == "images_delete") {
	$stmt = $conn->prepare("
		DELETE FROM `images` WHERE `id` IN (:ids)
	");
	$stmt->bindParam(":ids" , $ids);
	$ids = "";
	foreach($data as $row) {
		$ids .= $row["id"] . ",";
	}
	$ids = rtrim($ids, ",");
	$stmt->execute();
}
