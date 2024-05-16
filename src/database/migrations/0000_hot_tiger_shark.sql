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
	FOREIGN KEY (`pin_id`) REFERENCES `pin`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pin` (
	`id` text PRIMARY KEY NOT NULL,
	`discord_id` text NOT NULL,
	`message_id` text NOT NULL,
	`pinned_at` integer DEFAULT (unixepoch()) NOT NULL,
	`pin_channel_id` text,
	`pinned_by` text NOT NULL,
	`author_id` text NOT NULL,
	`channel_id` text NOT NULL,
	`content` text NOT NULL,
	`guild_id` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`guild_id`) REFERENCES `guild`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `pin_voter` (
	`pin_id` text NOT NULL,
	`user_id` text NOT NULL,
	`vote` integer NOT NULL,
	PRIMARY KEY(`pin_id`, `user_id`),
	FOREIGN KEY (`pin_id`) REFERENCES `pin`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `guild_discord_id_unique` ON `guild` (`discord_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pin_discord_id_unique` ON `pin` (`discord_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `pin_message_id_unique` ON `pin` (`message_id`);