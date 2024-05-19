CREATE TABLE `guild` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`channel_id` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`max_downvotes` integer
);
--> statement-breakpoint
CREATE TABLE `pin_attachment` (
	`pin_id` text NOT NULL,
	`attachment_url` text NOT NULL,
	PRIMARY KEY(`attachment_url`, `pin_id`),
	FOREIGN KEY (`pin_id`) REFERENCES `pin`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pin` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text,
	`pinned_at` integer DEFAULT (unixepoch()) NOT NULL,
	`pin_channel_id` text,
	`pinned_by` text NOT NULL,
	`message_id` text NOT NULL,
	`author_id` text NOT NULL,
	`created_at` integer NOT NULL,
	`channel_id` text NOT NULL,
	`content` text NOT NULL,
	`guild_id` text NOT NULL,
	FOREIGN KEY (`pinned_by`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`author_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`guild_id`) REFERENCES `guild`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `pin_voter` (
	`pin_id` text NOT NULL,
	`user_id` text NOT NULL,
	`vote` integer NOT NULL,
	PRIMARY KEY(`pin_id`, `user_id`),
	FOREIGN KEY (`pin_id`) REFERENCES `pin`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guild_discord_id_unique` ON `guild` (`discord_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pin_discord_id_unique` ON `pin` (`discord_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pin_message_id_unique` ON `pin` (`message_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_discord_id_unique` ON `user` (`discord_id`);