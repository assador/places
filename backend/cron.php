<?php
require_once __DIR__ . '/bootstrap.php';

// Disable FK checks during cleaning.
$ctx->db->exec("SET FOREIGN_KEY_CHECKS = 0");

// Clean out orphan points.
// Remove points that are not referenced by any place.
$ctx->db->exec("
	DELETE FROM points
	WHERE id NOT IN (
		SELECT pointid FROM places
	)
");

// Clean out unconfirmed users.
$ctx->db->exec("
	DELETE FROM users
	WHERE confirmed = 0
		AND confirmbefore < NOW()
");

$ctx->db->exec("SET FOREIGN_KEY_CHECKS = 1");
