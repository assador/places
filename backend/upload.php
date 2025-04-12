<?php
include "config.php";
include "newpdo.php";
include "common.php";

if(testAccountCheck($conn, $testaccountid, $_POST["userid"])) {
	exit;
} else {
	$files = [];
	$fault = [];
	/*
	 * 1: Something’s wrong
	 * 3: Invalid MIME type
	 * 4: File size exceeded
	 */
	$finfo = finfo_open(FILEINFO_MIME_TYPE);
	function push_file($key, $size, $mime) {
		global $files, $mimes;
		$files[] = array(
			"id"           => $key,
			"file"         => $key . "." . $mimes[$mime],
			"size"         => $size,
			"type"         => $mime,
		);
	}
	$query = $conn->query("
		SELECT `id`
		FROM `groups`
		WHERE `id`
		IN (
			SELECT `group`
			FROM `usergroup`
			WHERE `user` = '" . $_POST["userid"] . "'
		)
		AND `system` = 1
	");
	$result = $query->fetchAll(PDO::FETCH_ASSOC);
	$found = false;
	foreach($result as $row) {
		switch($row["id"]) {
			case "beginners" :
			case "ordinary" :
			case "trusted" :
			case "superusers" :
				$acceptsize = $rights["photosize"][$row["id"]];
				$found = true;
				break;
		}
		if($found) {
			break;
		}
	}
	unset($row);
	foreach($_FILES as $key => $file) {
		if($file["error"] == UPLOAD_ERR_OK) {
			$size = filesize($file["tmp_name"]);
			$mime = $file["type"];
			if(!array_key_exists($mime, $mimes)) {
				if(!in_array(3, $fault)) {$fault[] = 3;}
				continue;
			}
			if($size > $uploadsize) {
				if(!in_array(4, $fault)) {$fault[] = 4;}
				continue;
			}
			if($mime == "image/svg+xml") {
				if($acceptsize >= 0 && $size > $acceptsize) {
					if(!in_array(4, $fault)) {$fault[] = 4;}
					continue;
				} else {
					if(
						move_uploaded_file(
							$file["tmp_name"],
							".." . $dirs["uploads"]["images"]["big"] . $key . "." . $mimes[$mime]
						)
					) {
						copy(
							$dirs["uploads"]["images"]["big"] . $key . "." . $mimes[$mime],
							".." . $dirs["uploads"]["images"]["small"] . $key . "." . $mimes[$mime]
						);
						push_file($key, $size, $mime);
					}
				}
			} else {
				$imagick = new Imagick($file["tmp_name"]);
				if(
					$imagick->getImageWidth() > $images["big"]["width"] ||
					$imagick->getImageHeight() > $images["big"]["height"]
				) {
					$imagick->resizeImage(
						$images["big"]["width"],
						$images["big"]["height"],
						Imagick::FILTER_LANCZOS, 1, true
					);
					$size = strlen($imagick->getImageBlob());
					if($acceptsize >= 0 && $size > $acceptsize) {
						if(!in_array(4, $fault)) {$fault[] = 4;}
						continue;
					} else {
						$imagick->writeImage(".." . $dirs["uploads"]["images"]["big"] . $key . "." . $mimes[$mime]);
						push_file($key, $size, $mime);
					}
				} else {
					move_uploaded_file(
						$file["tmp_name"],
						".." . $dirs["uploads"]["images"]["big"] . $key . "." . $mimes[$mime]
					);
					push_file($key, $size, $mime);
				}
				$imagick->resizeImage(
					$images["small"]["width"],
					$images["small"]["height"],
					Imagick::FILTER_LANCZOS, 1, true
				);
				$imagick->writeImage(".." . $dirs["uploads"]["images"]["small"] . $key . "." . $mimes[$mime]);
				$imagick->destroy();
			}
		} else {
			$fault[] = 1;
		}
	}
	unset($file);
	finfo_close($finfo);
	echo json_encode([$fault, $files], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	exit;
}
