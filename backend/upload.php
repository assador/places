<?php
include "config.php";
include "newpdo.php";
include "common.php";

if(testAccountCheck($conn, $testaccountid, $_POST["userid"])) {
	echo json_encode([[2], []]);
	exit;
} else {
	$files = [];
	$fault = [];
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
	foreach($_FILES as $key => $file) {
		if($file["error"] == UPLOAD_ERR_OK) {
			$size = filesize($file["tmp_name"]);
			$mime = finfo_file($finfo, $file["tmp_name"]);
			if(!array_key_exists($mime, $mimes)) {
				if(!in_array(3, $fault)) {$fault[] = 3;}
				continue;
			}
			if($size > $uploadsize) {
				if(!in_array(4, $fault)) {$fault[] = 4;}
				continue;
			}
			if($mime == "image/svg+xml") {
				if($size > $acceptsize) {
					if(!in_array(4, $fault)) {$fault[] = 4;}
					continue;
				} else {
					if(
						move_uploaded_file(
							$file["tmp_name"],
							$dirs["uploads"]["images"]["big"] . $key . "." . $mimes[$mime]
						)
					) {
						copy(
							$dirs["uploads"]["images"]["big"] . $key . "." . $mimes[$mime],
							$dirs["uploads"]["images"]["small"] . $key . "." . $mimes[$mime]
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
					if($size > $acceptsize) {
						if(!in_array(4, $fault)) {$fault[] = 4;}
						continue;
					} else {
						$imagick->writeImage($dirs["uploads"]["images"]["big"] . $key . "." . $mimes[$mime]);
						push_file($key, $size, $mime);
					}
				} else {
					move_uploaded_file(
						$file["tmp_name"],
						$dirs["uploads"]["images"]["big"] . $key . "." . $mimes[$mime]
					);
					push_file($key, $size, $mime);
				}
				$imagick->resizeImage(
					$images["small"]["width"],
					$images["small"]["height"],
					Imagick::FILTER_LANCZOS, 1, true
				);
				$imagick->writeImage($dirs["uploads"]["images"]["small"] . $key . "." . $mimes[$mime]);
				$imagick->destroy();
			}
		} else {
			$fault[] = 1;
		}
	}
	finfo_close($finfo);
	echo json_encode([$fault, $files]);
	exit;
}
