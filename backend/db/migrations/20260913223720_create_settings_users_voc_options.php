<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class CreateSettingsUsersVocOptions extends AbstractMigration
{
    public function up(): void
    {
        $this->execute("
            CREATE TABLE settings_users_voc_options (
                settingid SMALLINT UNSIGNED NOT NULL,
                value VARBINARY(255) NOT NULL,
                srt DOUBLE DEFAULT 10,
                INDEX (settingid),
                CONSTRAINT fk_settings_users_voc_options_settingid
                    FOREIGN KEY (settingid) REFERENCES settings_users_voc(id)
                    ON DELETE CASCADE
            ) ENGINE=InnoDB;
        ");
    }

    public function down(): void
    {
        $this->execute("DROP TABLE IF EXISTS settings_users_voc_options;");
    }
}
