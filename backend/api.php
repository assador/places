<?php
declare(strict_types=1);
error_reporting(E_ALL);
ini_set("display_errors", "0");

header("Content-Type: application/json; charset=utf-8");

class ApiException extends Exception {
	public function __construct(
		int $status,
		string $error,
	) {
		parent::__construct($error, $status);
	}
}

function apiError(int $status, string $error): never {
	http_response_code($status);
	echo json_encode([
		"ok" => false,
		"error" => $error,
	], JSON_UNESCAPED_UNICODE);
	exit;
}

function apiSuccess(
	mixed $data = null,
	int $flags = JSON_UNESCAPED_UNICODE,
): never {
	http_response_code(200);
	echo json_encode([
		"ok" => true,
		"data" => $data,
	], $flags);
	exit;
}

function apiRun(AppContext $ctx, callable $handler): never {
	try {
		$handler();
	}
	catch (ApiException $e) {
		if ($ctx->db->inTransaction()) {
			$ctx->db->rollBack();
		}
		apiError($e->getCode(), $e->getMessage());
	}
	catch (Throwable $e) {
		if ($ctx->db->inTransaction()) {
			$ctx->db->rollBack();
		}
		error_log((string) $e);
		apiError(500, "internal_error");
	}
	apiError(500, "no_response");
}
