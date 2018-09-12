CREATE TABLE `users` (
	`id` VARCHAR (32) NOT NULL,
	`login` VARCHAR (100) NOT NULL,
	`password` VARCHAR (255) NOT NULL,
	`name` VARCHAR (100),
	`email` VARCHAR (100) NOT NULL,
	`phone` VARCHAR (20),
	`confirmed` BOOLEAN NOT NULL DEFAULT '0',
	`confirmbefore` DATETIME NOT NULL,
	`token` VARCHAR (32) NOT NULL,
	PRIMARY KEY (`id`),
	CONSTRAINT `U_users` UNIQUE (`id`, `login`, `email`, `token`)
);
CREATE TABLE `users_change` (
	`id` VARCHAR (32) NOT NULL,
	`login` VARCHAR (100) NOT NULL,
	`password` VARCHAR (255) NOT NULL,
	`name` VARCHAR (100),
	`email` VARCHAR (100) NOT NULL,
	`phone` VARCHAR (20),
	`confirmed` BOOLEAN NOT NULL DEFAULT 0,
	`confirmbefore` DATETIME NOT NULL,
	`token` VARCHAR (32) NOT NULL,
	PRIMARY KEY (`id`),
	CONSTRAINT `U_users_change` UNIQUE (`id`, `login`, `email`, `token`)
); 
CREATE TABLE `places` (
	`id` VARCHAR (32) NOT NULL,
	`name` VARCHAR (500) NOT NULL,
	`description` VARCHAR (2044),
	`latitude` DOUBLE NOT NULL,
	`longitude` DOUBLE NOT NULL,
	`srt` DOUBLE NOT NULL,
	`userid` VARCHAR (32) NOT NULL,
	PRIMARY KEY (`id`),
	CONSTRAINT `U_places` UNIQUE (`id`)
); 
CREATE TABLE `images` (
	`id` VARCHAR (32) NOT NULL,
	`file` VARCHAR (40) NOT NULL,
	`size` INT UNSIGNED NOT NULL,
	`type` VARCHAR (32) NOT NULL,
	`lastmodified` INT UNSIGNED NOT NULL,
	`srt` DOUBLE NOT NULL,
	`placeid` VARCHAR (32) NOT NULL,
	PRIMARY KEY (`id`),
	CONSTRAINT `U_images` UNIQUE (`id`, `file`)
); 
ALTER TABLE `places` ADD FOREIGN KEY (`userid`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
ALTER TABLE `images` ADD FOREIGN KEY (`placeid`) REFERENCES `places`(`id`) ON DELETE RESTRICT ON UPDATE RESTRICT;
