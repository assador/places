<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class AddSettingsEnums extends AbstractMigration
{
	public function up(): void
    {
        $this->execute("
            CREATE TABLE `settings_enums` (
                `id` SMALLINT UNSIGNED NOT NULL AUTO_INCREMENT,
                `type` TINYINT UNSIGNED NOT NULL,
                `name` VARCHAR(255) DEFAULT NULL,
                `description` VARCHAR(2044) DEFAULT NULL,
                `srt` DOUBLE NOT NULL DEFAULT 10,
                PRIMARY KEY (`id`)
            ) ENGINE=InnoDB
        ");

        $this->execute("
            INSERT INTO `settings_enums` (`id`, `type`)
            VALUES
                (1, 3),
                (2, 3),
                (3, 3)
        ");

        $this->execute("
            ALTER TABLE `settings_users_voc`
                ADD COLUMN `enumid`
                    SMALLINT UNSIGNED DEFAULT NULL AFTER `baseval`,
                ADD KEY `enumid` (`enumid`)
        ");

        $this->execute("
            ALTER TABLE `settings_users_voc`
                ADD CONSTRAINT `fk_settings_users_voc_enumid`
                    FOREIGN KEY (`enumid`)
                    REFERENCES `settings_enums` (`id`)
                    ON DELETE SET NULL
        ");

        $this->execute("
            ALTER TABLE `settings_options`
                ADD CONSTRAINT `fk_settings_options_enumid`
                    FOREIGN KEY (`enumid`)
                    REFERENCES `settings_enums` (`id`)
                    ON DELETE CASCADE
        ");
    }

    public function down(): void
    {
        $this->execute("
            ALTER TABLE `settings_options`
                DROP FOREIGN KEY `fk_settings_options_enumid`
        ");

        $this->execute("
            ALTER TABLE `settings_users_voc`
                DROP FOREIGN KEY `fk_settings_users_voc_enumid`,
                DROP INDEX `enumid`,
                DROP COLUMN `enumid`
        ");

        $this->execute("
            DROP TABLE `settings_enums`
        ");
    }
}
