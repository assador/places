<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx, $config) {
	$userid = $_POST["userid"] ?? null;
	$sessionid = $_POST["sessionid"] ?? null;

	$binUserId = uuidToBin($userid);
	$binSessionId = uuidToBin($sessionid);

	if (!isValidSession($ctx, $binUserId, $binSessionId)) {
		throw new ApiException(401, "invalid_session");
	}
	if ($userid === $config["testaccountuuid"]) {
		throw new ApiException(403, "test_account");
	}

	$files = [];
	$faults = [];
	$writtenFiles = [];

	$finfo = finfo_open(FILEINFO_MIME_TYPE);
	if ($finfo === false) {
		throw new RuntimeException("Failed to initialize file info");
	}

	try {

// SEC $acceptsize based on user groups

		$stmt = $ctx->db->prepare("
			SELECT `id`
			FROM `groups`
			WHERE `id` IN (
				SELECT `group`
				FROM `usergroup`
				WHERE `user` = :userid
			)
				AND `system` = 1
		");
		$stmt->execute([
			":userid" => $binUserId,
		]);

		$groupIds = $stmt->fetchAll(PDO::FETCH_COLUMN);

		$userLimits = array_intersect_key(
			$config["rights"]["photosize"],
			array_flip($groupIds)
		);

		if (empty($userLimits)) {
			$acceptsize = 0;
		} elseif (in_array(-1, $userLimits, true)) {
			$acceptsize = -1;
		} else {
			$acceptsize = max($userLimits);
		}

		$ctx->db->beginTransaction();

// SEC Each file

		foreach ($_FILES as $key => $file) {
			if ($file["error"] !== UPLOAD_ERR_OK) continue;

			$pathBig = null;
			$pathSmall = null;
			$imagick = null;
			$wasResized = false;

			try {
				$size = filesize($file["tmp_name"]);
				$mime = finfo_file($finfo, $file["tmp_name"]);

				if ($size === false || $mime === false) {
					throw new RuntimeException("Failed to inspect uploaded file");
				}
				if (!array_key_exists($mime, $config["mimes"])) {
					if (!in_array(3, $faults, true)) $faults[] = 3;
					continue;
				}
				if ($size > $config["uploadsize"]) {
					if (!in_array(4, $faults, true)) $faults[] = 4;
					continue;
				}

				$extension = $config["mimes"][$mime];

				$pathBig =
					$config["dirs"]["uploads"]["images"]["big"] .
					$key . "." . $extension
				;
				$pathSmall =
					$config["dirs"]["uploads"]["images"]["small"] .
					$key . "." . $extension
				;

// SEC SVG

				if ($mime === "image/svg+xml") {
					if ($acceptsize >= 0 && $size > $acceptsize) {
						if (!in_array(4, $faults, true)) $faults[] = 4;
						continue;
					}
					if (!move_uploaded_file($file["tmp_name"], $pathBig)) {
						throw new RuntimeException("Failed to write big image");
					}

					$writtenFiles[] = $pathBig;

					if (!copy($pathBig, $pathSmall)) {
						throw new RuntimeException("Failed to write small image");
					}

					$writtenFiles[] = $pathSmall;
				}

// SEC Raster image

				else {
					$imagick = new Imagick($file["tmp_name"]);
					
					if (
						$imagick->getImageWidth() > $config["images"]["big"]["width"] ||
						$imagick->getImageHeight() > $config["images"]["big"]["height"]
					) {
						$imagick->resizeImage(
							$config["images"]["big"]["width"],
							$config["images"]["big"]["height"],
							Imagick::FILTER_LANCZOS,
							1,
							true
						);
						$size = strlen($imagick->getImageBlob());
						$wasResized = true;
					}
					
					if ($acceptsize >= 0 && $size > $acceptsize) {
						if (!in_array(4, $faults, true)) $faults[] = 4;
						continue;
					}
					if ($wasResized) {
						if (!$imagick->writeImage($pathBig)) {
							throw new RuntimeException("Failed to write resized big image");
						}
					} else {
						if (!move_uploaded_file($file["tmp_name"], $pathBig)) {
							throw new RuntimeException("Failed to write big image");
						}
					}
					
					$writtenFiles[] = $pathBig;
					
					$imagick->resizeImage(
						$config["images"]["small"]["width"],
						$config["images"]["small"]["height"],
						Imagick::FILTER_LANCZOS,
						1,
						true
					);
					
					if (!$imagick->writeImage($pathSmall)) {
						throw new RuntimeException("Failed to write small image");
					}
					
					$writtenFiles[] = $pathSmall;
				}

// SEC Image database record

				$stmt = $ctx->db->prepare("
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
				");
				$stmt->execute([
					":id" => uuidToBin($key),
					":file" => $key . "." . $extension,
					":type" => $mime,
					":size" => $size,
					":lastmodified" => (int)(microtime(true) * 1000),
				]);
				$files[] = [
					"id" => $key,
					"file" => $key . "." . $extension,
					"size" => $size,
					"type" => $mime,
				];
			} finally {
				if ($imagick !== null) {
					$imagick->destroy();
				}
			}
		}

		$ctx->db->commit();
	}
	catch (Throwable $e) {
		if ($ctx->db->inTransaction()) {
			$ctx->db->rollBack();
		}
		foreach ($writtenFiles as $path) {
			if (is_file($path)) unlink($path);
		}
		throw $e;
	}
	finally {
		finfo_close($finfo);
	}

	apiSuccess(
		[$faults, $files],
		JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK
	);
});
