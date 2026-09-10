<?php

$appConfig = require __DIR__ . '/config.php';
$db = $appConfig['db'] ?? [];
$host = ($db['host'] === 'localhost') ? '127.0.0.1' : ($db['host'] ?? '127.0.0.1');

return [
	'paths' => [
		'migrations' => '%%PHINX_CONFIG_DIR%%/db/migrations',
		'seeds'      => '%%PHINX_CONFIG_DIR%%/db/seeds',
	],
	'environments' => [
		'default_migration_table' => 'phinxlog',
		'default_environment'     => 'development',
		'development' => [
			'adapter'   => $db['driver']    ?? 'mysql',
			'host'      => $host,
			'name'      => $db['name']      ?? '',
			'user'      => $db['username']  ?? '',
			'pass'      => $db['password']  ?? '',
			'port'      => $db['port']      ?? '3306',
			'charset'   => $db['charset']   ?? 'utf8mb4',
			'collation' => $db['collation'] ?? 'utf8mb4_unicode_ci',
		],
		'production' => [
			'adapter'     => $db['driver']      ?? 'mysql',
			'host'        => $host,
			'name'        => $db['name']        ?? '',
			'user'        => $db['username']    ?? '',
			'pass'        => $db['password']    ?? '',
			'port'        => $db['port']        ?? '3306',
			'charset'     => $db['charset']     ?? 'utf8mb4',
			'collation'   => $db['collation']   ?? 'utf8mb4_unicode_ci',
			'unix_socket' => $db['unix_socket'] ?? '/var/lib/mysql/mysql.sock',
		],
	],
	'version_order' => 'creation',
];
