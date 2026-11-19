<?php

declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class RemoveSettingsFKs extends AbstractMigration
{
	public function up(): void
    {
        $this->execute(
            'ALTER TABLE `settings_groups`
             DROP FOREIGN KEY `fk_settings_groups_parent`'
        );

        $this->execute(
            'ALTER TABLE `settings_users_voc`
             DROP FOREIGN KEY `fk_settings_users_voc_groupid`'
        );
    }

    public function down(): void
    {
        $this->execute(
            'ALTER TABLE `settings_users_voc`
             ADD CONSTRAINT `fk_settings_users_voc_groupid`
             FOREIGN KEY (`groupid`)
             REFERENCES `settings_groups` (`id`)
             ON DELETE NO ACTION'
        );

        $this->execute(
            'ALTER TABLE `settings_groups`
             ADD CONSTRAINT `fk_settings_groups_parent`
             FOREIGN KEY (`parent`)
             REFERENCES `settings_groups` (`id`)
             ON DELETE NO ACTION'
        );
    }
}
