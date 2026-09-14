<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SeedSettingsUsersVocOptions extends AbstractMigration
{
	public function up(): void
	{
		$this->execute("
			ALTER TABLE settings_users_voc_options
			ADD COLUMN enabled TINYINT(1) NOT NULL DEFAULT 1,
			ADD COLUMN extra BLOB DEFAULT NULL,
			ADD UNIQUE KEY uq_settingid_value (settingid, value);
		");

		$options = [
			[
				'settingid' => 1,
				'value'     => 'en',
				'srt'       => 10.0,
			],
			[
				'settingid' => 1,
				'value'     => 'ru',
				'srt'       => 20.0,
			],
			[
				'settingid' => 2,
				'value'     => 'brown',
				'extra'     => 'colorthemeBrown',
				'srt'       => 10.0,
			],
			[
				'settingid' => 2,
				'value'     => 'blue',
				'extra'     => 'colorthemeBlue',
				'srt'       => 20.0,
			],
			[
				'settingid' => 2,
				'value'     => 'pink',
				'extra'     => 'colorthemePink',
				'srt'       => 30.0,
			],
			[
				'settingid' => 2,
				'value'     => 'green',
				'extra'     => 'colorthemeGreen',
				'srt'       => 40.0,
			],
			[
				'settingid' => 2,
				'value'     => 'pink-light',
				'extra'     => 'colorthemePinkLight',
				'srt'       => 50.0,
			],
			[
				'settingid' => 2,
				'value'     => 'blue-light',
				'extra'     => 'colorthemeBlueLight',
				'srt'       => 60.0,
			],
			[
				'settingid' => 2,
				'value'     => 'purple-light',
				'extra'     => 'colorthemePurpleLight',
				'srt'       => 70.0,
			],
			[
				'settingid' => 2,
				'value'     => 'green-light',
				'extra'     => 'colorthemeGreenLight',
				'srt'       => 80.0,
			],
		];
		$this->table('settings_users_voc_options')->insert($options)->saveData();
	}

	public function down(): void
	{
		$this->execute("TRUNCATE TABLE settings_users_voc_options;");

		$this->execute("
			ALTER TABLE settings_users_voc_options
			DROP INDEX uq_settingid_value;
		");

		$this->execute("
			ALTER TABLE settings_users_voc_options
			DROP COLUMN enabled,
			DROP COLUMN extra;
		");
	}
}
