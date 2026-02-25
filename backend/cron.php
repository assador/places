<?php
require_once __DIR__ . '/bootstrap.php';

$now = (int)(microtime(true) * 1000);

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
$ctx->db->prepare("
	DELETE FROM users
	WHERE confirmed = 0
		AND confirmbefore < :now
")->execute([ ':now' => $now ]);

// Clean out expired sessions.
$ctx->db->prepare("
	DELETE FROM sessions 
	WHERE expiresat < :now
")->execute([ ':now' => $now ]);

// Clean out orphan sessions.
$ctx->db->exec("
 	DELETE s
	FROM sessions s
	LEFT JOIN users u ON s.userid = u.id
	WHERE u.id IS NULL
");

// Clean out uncommitted images.
$stmt = $ctx->db->prepare("
	SELECT id, file FROM images
	WHERE committed = 0
		AND lastmodified < :dayago
");
$stmt->execute([ ':dayago' => $now - 86400000 ]);
$orphanImages = $stmt->fetchAll();
foreach ($orphanImages as $img) {
	$pathBig =  $config['dirs']['uploads']['images']['big'] . $img['file'];
	$pathSmall = $config['dirs']['uploads']['images']['small'] . $img['file'];
	if (is_file($pathBig)) unlink($pathBig);
	if (is_file($pathSmall)) unlink($pathSmall);
	$ctx->db->prepare("
		DELETE FROM images
		WHERE id = :id
	")->execute([ ':id' => $img['id'] ]);
}

$ctx->db->exec("SET FOREIGN_KEY_CHECKS = 1");
