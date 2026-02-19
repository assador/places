<?php
require_once __DIR__ . '/bootstrap.php';

// Disable FK checks during cleaning.
$ctx->db->exec("SET FOREIGN_KEY_CHECKS = 0");

// Clean out orphan points.
// Remove points that are not referenced by any place or route.
$ctx->db->exec("
	DELETE pt
	FROM points pt
	LEFT JOIN places p ON pt.id = p.pointid
	LEFT JOIN pointroute pr ON pt.id = pr.pointid
	WHERE p.pointid IS NULL
		AND pr.pointid IS NULL
");

// Clean out unconfirmed users.
$ctx->db->exec("
	DELETE FROM users
	WHERE confirmed = 0
		AND confirmbefore < UTC_TIMESTAMP()
");

// Clean out expired sessions.
$ctx->db->exec("
	DELETE FROM sessions 
	WHERE expiresat < UTC_TIMESTAMP()
");

$ctx->db->exec("
 	DELETE s
	FROM sessions s
	LEFT JOIN users u ON s.userid = u.id
	WHERE u.id IS NULL
");

$ctx->db->exec("SET FOREIGN_KEY_CHECKS = 1");
