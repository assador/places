<?php
declare(strict_types=1);

use Phinx\Migration\AbstractMigration;

final class SeedAccountSettings extends AbstractMigration
{
    public function up(): void
    {
        $groups = [
            [
                'id'          => 1,
                'parent'      => null,
                'name'        => 'ui',
                'srt'         => 10.0,
            ],
            [
                'id'          => 2,
                'parent'      => null,
                'name'        => 'privacy',
                'srt'         => 20.0,
            ],
            [
                'id'          => 11,
                'parent'      => 1,
                'name'        => 'maps',
                'srt'         => 10.0,
            ],
        ];
        $this->table('settings_users_groups')->insert($groups)->saveData();

        $settings = [
            [
                'id'          => 1,
                'groupid'     => 1,
                'type'        => 3, // string
                'baseval'     => 'ru',
                'name'        => 'ui.lang',
                'public'      => true,
                'srt'         => 10.0,
            ],
            [
                'id'          => 2,
                'groupid'     => 1,
                'type'        => 3, // string
                'baseval'     => 'brown',
                'name'        => 'ui.colortheme',
                'public'      => true,
                'srt'         => 20.0,
            ],
        ];
        $this->table('settings_users_voc')->insert($settings)->saveData();
    }

    public function down(): void
    {
        $this->execute("DELETE FROM settings_users_voc");
        $this->execute("DELETE FROM settings_users_groups");
    }
}
