<?php
include "config.php";
include "newpdo.php";
include "common.php";

$_POST = json_decode(file_get_contents("php://input"), true);
$response = [];
/*
 * 1: Something’s wrong
 * 2: Test account
 */
if(testAccountCheck($conn, $testaccountid, $_POST["id"])) {
	echo json_encode([2], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	exit;
} else {
	$delete = $conn->prepare("DELETE FROM `waypoints` WHERE `id` = :id");
	$append = $conn->prepare("
		INSERT INTO `waypoints` (
			`id`                 ,
			`latitude`           ,
			`longitude`          ,
			`time`               ,
			`common`
		) VALUES (
			:id                 ,
			:latitude           ,
			:longitude          ,
			:time               ,
			:common
		)
	");
	$update = $conn->prepare("
		UPDATE `waypoints` SET
			`id`                 = :id                 ,
			`latitude`           = :latitude           ,
			`longitude`          = :longitude          ,
			`time`               = :time               ,
			`common`             = :common
		WHERE `id` = :id
	");
	if(is_array($_POST["data"])) {
		foreach($_POST["data"] as $row) {
			$common = 0;
			$query = $conn->query("
				SELECT *
				FROM `waypoints` `w`
				WHERE `w`.`id` = '" . $row["id"] . "'
				LIMIT 1
			");
			$query->execute();
			$waypoint = $query->fetch(PDO::FETCH_ASSOC);
			if(
				$row["deleted"] == true &&
				$waypoint &&
				!$waypoint["common"]
			) {
				$delete->bindParam( ":id", $row["id"]);
				try {
					$delete->execute();
				} catch(Exception $e) {
					error_log($e);
					continue;
				}
			} elseif($row["added"] == true) {
				$query = $conn->query("
					SELECT *
					FROM `waypoints` `w`
					WHERE
						`w`.`latitude`
							" . ($row["latitude"] ? ("= " . $row["latitude"]) : "IS NULL") . "
						AND
						`w`.`longitude`
							" . ($row["longitude"] ? ("= " . $row["longitude"]) : "IS NULL") . "
					LIMIT 1
				");
				$query->execute();
				$same_waypoint = $query->fetch(PDO::FETCH_ASSOC);
				if(!$same_waypoint) {
					$append->bindParam( ":id"                 , $row[ "id"                 ]);
					$append->bindParam( ":latitude"           , $row[ "latitude"           ]);
					$append->bindParam( ":longitude"          , $row[ "longitude"          ]);
					$append->bindParam( ":time"               , $row[ "time"               ]);
					$append->bindParam( ":common"             , $common                     );
					try {
						$append->execute();
					} catch(Exception $e) {
						error_log($e);
						continue;
					}
				} else {
					$common = 1;
					$update->bindParam( ":id"                 , $same_waypoint[ "id"                 ]);
					$update->bindParam( ":latitude"           , $same_waypoint[ "latitude"           ]);
					$update->bindParam( ":longitude"          , $same_waypoint[ "longitude"          ]);
					$update->bindParam( ":time"               , $same_waypoint[ "time"               ]);
					$update->bindParam( ":common"             , $common                               );
					try {
						$update->execute();
						$same_waypoint[ "type"    ] = 'waypoint' ;
						$same_waypoint[ "added"   ] = true       ;
						$same_waypoint[ "deleted" ] = false      ;
						$same_waypoint[ "updated" ] = false      ;
						$same_waypoint[ "show"    ] = true       ;
						$response[] = array(
							"what"       => 'waypoint_exists',
							"waypoint"   => $same_waypoint,
							"waypointof" => $row["from"]
						);
					} catch(Exception $e) {
						error_log($e);
						continue;
					}
				}
			} elseif(
				$row["updated"] == true &&
				$waypoint &&
				!$waypoint["common"]
			) {
				$update->bindParam( ":id"                 , $row[ "id"                 ]);
				$update->bindParam( ":latitude"           , $row[ "latitude"           ]);
				$update->bindParam( ":longitude"          , $row[ "longitude"          ]);
				$update->bindParam( ":time"               , $row[ "time"               ]);
				$update->bindParam( ":common"             , $common                     );
				try {
					$update->execute();
				} catch(Exception $e) {
					error_log($e);
					continue;
				}
			} elseif(
				$row["updated"] == true &&
				$waypoint &&
				$waypoint["common"]
			) {
				$new_waypoint = array(
					"id"                 => generateRandomString(32)    ,
					"latitude"           => $row[ "latitude"           ],
					"longitude"          => $row[ "longitude"          ],
					"time"               => gmdate("Y-m-d\TH:i:s")      ,
					"common"             => $common                     ,
					"type"               => 'waypoint'                  ,
					"added"              => true                        ,
					"deleted"            => false                       ,
					"updated"            => false                       ,
					"show"               => true
				);
				$append->bindParam( ":id"                 , $new_waypoint[ "id"                 ]);
				$append->bindParam( ":latitude"           , $new_waypoint[ "latitude"           ]);
				$append->bindParam( ":longitude"          , $new_waypoint[ "longitude"          ]);
				$append->bindParam( ":time"               , $new_waypoint[ "time"               ]);
				$append->bindParam( ":common"             , $new_waypoint[ "common"             ]);
				try {
					$append->execute();
					$response[] = array(
						"what"       => 'new_waypoint',
						"waypoint"   => $new_waypoint,
						"waypointof" => $row["from"]
					);
				} catch(Exception $e) {
					error_log($e);
					continue;
				}
			}
			$common = 0;
		}
	}
	echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	exit;
}
