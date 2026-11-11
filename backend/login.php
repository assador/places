<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

require_once __DIR__ . "/bootstrap.php";

apiRun($ctx, function () use ($ctx) {
	$raw = file_get_contents("php://input");
	$data = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

	$query = $ctx->db->prepare("
		SELECT `id`, `password` FROM `users`
		WHERE `login` = :login
			AND `confirmed` = 1
		LIMIT 1
	");
	$query->execute([ ":login" => $data["authLogin"] ]);
	$result = $query->fetch(PDO::FETCH_ASSOC);
	
	if (!$result || !password_verify($data["authPassword"], $result["password"]))  {
		throw new ApiException(401, "invalid_credentials");
	}
	unset($result["password"]);
	$result["session"] = createSession($ctx, $result["id"]);
	$result["id"] = binToUuid($result["id"]);

	apiSuccess($result);
});
