<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSettingsUsersTables extends AbstractMigration
{
	public function up(): void
	{
		$this->execute("
			CREATE TABLE settings_users_groups (
				id SMALLINT UNSIGNED PRIMARY KEY,
				parent SMALLINT UNSIGNED DEFAULT NULL,
				name VARCHAR(255) NOT NULL,
				description VARCHAR(2044) DEFAULT '',
				srt DOUBLE DEFAULT 0,
				INDEX (parent),
				FOREIGN KEY (parent) REFERENCES settings_users_groups(id) ON DELETE RESTRICT
			) ENGINE=InnoDB;
		");

		$this->execute("
			CREATE TABLE settings_users_voc (
				id SMALLINT UNSIGNED PRIMARY KEY,
				groupid SMALLINT UNSIGNED DEFAULT NULL,
				type TINYINT UNSIGNED NOT NULL,
				baseval VARBINARY(255) NOT NULL,
				name VARCHAR(255) NOT NULL,
				description VARCHAR(2044) DEFAULT '',
				public BOOLEAN DEFAULT TRUE,
				srt DOUBLE DEFAULT 0,
				INDEX (groupid),
				FOREIGN KEY (groupid) REFERENCES settings_users_groups(id) ON DELETE RESTRICT
			) ENGINE=InnoDB;
		");

		$this->execute("
			CREATE TABLE settings_users (
				userid BINARY(16) NOT NULL,
				settingid SMALLINT UNSIGNED NOT NULL,
				value VARBINARY(255) NOT NULL,
				updated BIGINT(20) UNSIGNED DEFAULT NULL,
				PRIMARY KEY (userid, settingid),
				FOREIGN KEY (settingid) REFERENCES settings_users_voc(id) ON DELETE CASCADE
			) ENGINE=InnoDB;
		");
	}

	public function down(): void
	{
		$this->execute("SET FOREIGN_KEY_CHECKS = 0;");

		$this->table("settings_users")->drop()->save();
		$this->table("settings_users_voc")->drop()->save();
		$this->table("settings_users_groups")->drop()->save();

		$this->execute("SET FOREIGN_KEY_CHECKS = 1;");
	}
}
