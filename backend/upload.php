<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

require_once __DIR__ . '/bootstrap.php';

if (testAccountCheck($ctx, $config["testaccountuuid"], $_POST["userid"])) {
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
		global $files, $config;
		$files[] = array(
			"id"           => $key,
			"file"         => $key . "." . $config['mimes'][$mime],
			"size"         => $size,
			"type"         => $mime,
		);
	}
	$query = $ctx->db->prepare("
		SELECT `id`
		FROM `groups`
		WHERE `id`
		IN (
			SELECT `group`
			FROM `usergroup`
			WHERE `user` = :userid
		)
		AND `system` = 1
	");
	$query->execute([
		":userid" => $_POST["userid"],
	]);
	$result = $query->fetchAll(PDO::FETCH_ASSOC);
	$found = false;
	foreach($result as $row) {
		switch($row["id"]) {
			case "beginners" :
			case "ordinary" :
			case "trusted" :
			case "superusers" :
				$acceptsize = $config["rights"]["photosize"][$row["id"]];
				$found = true;
				break;
		}
		if($found) {
			break;
		}
	}
	unset($row);
	foreach ($_FILES as $key => $file) {
		if($file["error"] == UPLOAD_ERR_OK) {
			$size = filesize($file["tmp_name"]);
			$mime = $file["type"];
			if(!array_key_exists($mime, $config['mimes'])) {
				if(!in_array(3, $fault)) {$fault[] = 3;}
				continue;
			}
			if($size > $config['uploadsize']) {
				if(!in_array(4, $fault)) {$fault[] = 4;}
				continue;
			}
			if($mime === "image/svg+xml") {
				if($acceptsize >= 0 && $size > $acceptsize) {
					if(!in_array(4, $fault)) {$fault[] = 4;}
					continue;
				} else {
					if(
						move_uploaded_file(
							$file["tmp_name"],
							$_SERVER['DOCUMENT_ROOT'] . $config["dirs"]["uploads"]["images"]["big"] . $key . "." . $config['mimes'][$mime]
						)
					) {
						copy(
							$config["dirs"]["uploads"]["images"]["big"] . $key . "." . $config['mimes'][$mime],
							$_SERVER['DOCUMENT_ROOT'] . $config["dirs"]["uploads"]["images"]["small"] . $key . "." . $config['mimes'][$mime]
						);
						push_file($key, $size, $mime);
					}
				}
			} else {
				$imagick = new Imagick($file["tmp_name"]);
				if(
					$imagick->getImageWidth() > $config["images"]["big"]["width"] ||
					$imagick->getImageHeight() > $config["images"]["big"]["height"]
				) {
					$imagick->resizeImage(
						$config["images"]["big"]["width"],
						$config["images"]["big"]["height"],
						Imagick::FILTER_LANCZOS, 1, true
					);
					$size = strlen($imagick->getImageBlob());
					if($acceptsize >= 0 && $size > $acceptsize) {
						if(!in_array(4, $fault)) {$fault[] = 4;}
						continue;
					} else {
						$imagick->writeImage($_SERVER['DOCUMENT_ROOT'] . $config["dirs"]["uploads"]["images"]["big"] . $key . "." . $config['mimes'][$mime]);
						push_file($key, $size, $mime);
					}
				} else {
					move_uploaded_file(
						$file["tmp_name"],
						$_SERVER['DOCUMENT_ROOT'] . $config["dirs"]["uploads"]["images"]["big"] . $key . "." . $config['mimes'][$mime]
					);
					push_file($key, $size, $mime);
				}
				$imagick->resizeImage(
					$config["images"]["small"]["width"],
					$config["images"]["small"]["height"],
					Imagick::FILTER_LANCZOS, 1, true
				);
				$imagick->writeImage($_SERVER['DOCUMENT_ROOT'] . $config["dirs"]["uploads"]["images"]["small"] . $key . "." . $config['mimes'][$mime]);
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
