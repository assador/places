<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set('display_errors', '1');

/* “Let there be light!” the beaver said. Debug with smile, that’s what we get.
set_exception_handler(function($e) {
	header('Content-Type: application/json');
	http_response_code(500);
	echo $e->getMessage();
	echo "\nfile: {$e->getFile()}";
	echo "\nline: {$e->getLine()}";
	exit;
});
*/

require_once __DIR__ . '/bootstrap.php';

if (testAccountCheck($ctx, $config['testaccountuuid'], $_POST['userid'])) {
	exit;
}

$files = [];
$faults = [];
/*
	* 1: Something’s wrong
	* 3: Invalid MIME type
	* 4: File size exceeded
*/
$finfo = finfo_open(FILEINFO_MIME_TYPE);
function push_file($key, $size, $mime) {
	global $files, $config;
	$files[] = [
		'id'   => $key,
		'file' => $key . '.' . $config['mimes'][$mime],
		'size' => $size,
		'type' => $mime,
	];
}

// SEC $acceptsize based on user groups

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
	':userid' => uuidToBin($_POST['userid']),
]);
$result = $query->fetchAll(PDO::FETCH_COLUMN);

$userLimits = array_intersect_key(
	$config['rights']['photosize'], 
	array_flip($result)
);
if (empty($userLimits)) {
	$acceptsize = 0;
} elseif (in_array(-1, $userLimits)) {
	$acceptsize = -1;
} else {
	$acceptsize = max($userLimits);
}

// SEC Each file

foreach ($_FILES as $key => $file) {
	if($file['error'] === UPLOAD_ERR_OK) {
		$size = filesize($file['tmp_name']);
		$mime = finfo_file($finfo, $file['tmp_name']);
		if(!array_key_exists($mime, $config['mimes'])) {
			if(!in_array(3, $faults)) {$faults[] = 3;}
			continue;
		}
		if($size > $config['uploadsize']) {
			if(!in_array(4, $faults)) {$faults[] = 4;}
			continue;
		}
		$pathBig = 
			$config['dirs']['uploads']['images']['big'] .
			$key . '.' . $config['mimes'][$mime]
		;
		$pathSmall = 
			$config['dirs']['uploads']['images']['small'] .
			$key . '.' . $config['mimes'][$mime]
		;
		try {
			$imagick = null;

			if($mime === 'image/svg+xml') {
				if($acceptsize >= 0 && $size > $acceptsize) {
					if(!in_array(4, $faults)) {$faults[] = 4;}
					continue;
				} else {
					if(
						move_uploaded_file($file['tmp_name'], $pathBig) &&
						copy($pathBig, $pathSmall)
					) {
						push_file($key, $size, $mime);
					} else {
						throw new Exception('Failed to write big image');
					}
				}
			} else {
				$imagick = new Imagick($file['tmp_name']);
				if(
					$imagick->getImageWidth() > $config['images']['big']['width'] ||
					$imagick->getImageHeight() > $config['images']['big']['height']
				) {
					$imagick->resizeImage(
						$config['images']['big']['width'],
						$config['images']['big']['height'],
						Imagick::FILTER_LANCZOS, 1, true
					);
					$size = strlen($imagick->getImageBlob());
					if($acceptsize >= 0 && $size > $acceptsize) {
						if(!in_array(4, $faults)) {$faults[] = 4;}
						continue;
					} else {
						if (!$imagick->writeImage($pathBig)) {
							throw new Exception('Failed to write resized big image');
						}
					}
				} else {
					if (!move_uploaded_file($file['tmp_name'], $pathBig)) {
						throw new Exception('Failed to write big image');
					}
				}
				$imagick->resizeImage(
					$config['images']['small']['width'],
					$config['images']['small']['height'],
					Imagick::FILTER_LANCZOS, 1, true
				);
				if (!$imagick->writeImage($pathSmall)) {
					throw new Exception('Failed to write resized small image');
				}
				push_file($key, $size, $mime);
				$imagick->destroy();
			}

			$ctx->db->beginTransaction();
			$sql = "
				INSERT INTO images (
					id,
					file,
					type,
					size,
					lastmodified,
					committed
				)
				VALUES (
					:id,
					:file,
					:type,
					:size,
					:lastmodified,
					0
				)
			";
			$stmt = $ctx->db->prepare($sql);
			$stmt->execute([
				':id'           => uuidToBin($key),
				':file'         => $key . '.' . $config['mimes'][$mime],
				':type'         => $mime,
				':size'         => $size,
				':lastmodified' => (int)(microtime(true) * 1000),
			]);
			$ctx->db->commit();

		} catch (Throwable $e) {
			error_log($e->getMessage());
			if ($ctx->db->inTransaction()) {
				$ctx->db->rollBack();
			}
			if (isset($imagick)) {
				$imagick->destroy();
			}
			if (is_file($pathBig)) unlink($pathBig);
			if (is_file($pathSmall)) unlink($pathSmall);
			if (!in_array(1, $faults)) $faults[] = 1;
		}
	} else {
		$faults[] = 1;
	}
}
echo json_encode([ $faults, $files ], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
exit;
