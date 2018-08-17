<?php
include "config.php";
include "newpdo.php";

$data = json_decode($_POST["data"], true);

$images = array();
foreach($data as $dval) {
	$pimg = $dval["images"];
	foreach($pimg as $ival) {
		$images[] = $ival;
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
			`places_id`
		) VALUES (
			:id            ,
			:file          ,
			:size          ,
			:type          ,
			:lastmodified  ,
			:srt           ,
			:places_id
		)
	");
	$stmt->bindParam( ":id"           , $id           );
	$stmt->bindParam( ":file"         , $file         );
	$stmt->bindParam( ":size"         , $size         );
	$stmt->bindParam( ":type"         , $type         );
	$stmt->bindParam( ":lastmodified" , $lastmodified );
	$stmt->bindParam( ":srt"          , $srt          );
	$stmt->bindParam( ":places_id"    , $places_id    );
	foreach($images as $row) {
		$id           = $row[ "id"           ];
		$file         = $row[ "file"         ];
		$size         = $row[ "size"         ];
		$type         = $row[ "type"         ];
		$lastmodified = $row[ "lastmodified" ];
		$srt          = $row[ "srt"          ];
		$places_id    = $row[ "places_id"    ];
		$stmt->execute();
	}
}

if($_POST["todo"] == "places") {
	$delete = $conn->prepare("DELETE FROM `places` WHERE `id` = :id");
	$append = $conn->prepare("
		INSERT INTO `places` (
			`id`          ,
			`name`        ,
			`description` ,
			`latitude`    ,
			`longitude`   ,
			`srt`         ,
			`users_id`
		) VALUES (
			:id           ,
			:name         ,
			:description  ,
			:latitude     ,
			:longitude    ,
			:srt          ,
			:users_id
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
			`users_id`    = :users_id
		WHERE `id` = :id
	");
	foreach($data as $row) {
		if($row["deleted"] == true) {
			$delete->bindParam( ":id"          , $row[ "id"          ]);
			try{$delete->execute();} catch(Exception $e) {}
		} else if($row["added"] == true) {
			$append->bindParam( ":id"          , $row[ "id"          ]);
			$append->bindParam( ":name"        , $row[ "name"        ]);
			$append->bindParam( ":description" , $row[ "description" ]);
			$append->bindParam( ":latitude"    , $row[ "latitude"    ]);
			$append->bindParam( ":longitude"   , $row[ "longitude"   ]);
			$append->bindParam( ":srt"         , $row[ "srt"         ]);
			$append->bindParam( ":users_id"    , $_POST["id"]);
			try{$append->execute();} catch(Exception $e) {}
		}
		if($row["updated"] == true) {
			$update->bindParam( ":id"          , $row[ "id"          ]);
			$update->bindParam( ":name"        , $row[ "name"        ]);
			$update->bindParam( ":description" , $row[ "description" ]);
			$update->bindParam( ":latitude"    , $row[ "latitude"    ]);
			$update->bindParam( ":longitude"   , $row[ "longitude"   ]);
			$update->bindParam( ":srt"         , $row[ "srt"         ]);
			$update->bindParam( ":users_id"    , $_POST["id"]);
			try{$update->execute();} catch(Exception $e) {}
		}
	}




#	updateImages($conn, $stmt, $images);
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
