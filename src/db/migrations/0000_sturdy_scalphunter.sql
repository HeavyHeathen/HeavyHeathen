CREATE TABLE `availability_cache` (
	`tmdb_id` integer NOT NULL,
	`region` text NOT NULL,
	`providers` text NOT NULL,
	`fetched_at` integer NOT NULL,
	PRIMARY KEY(`tmdb_id`, `region`)
);
--> statement-breakpoint
CREATE TABLE `download_requests` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer NOT NULL,
	`requested_by` integer NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`radarr_id` integer,
	`error` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`tmdb_id`) REFERENCES `movies`(`tmdb_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`requested_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `dl_one_per_movie` ON `download_requests` (`tmdb_id`);--> statement-breakpoint
CREATE TABLE `members` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`avatar` text DEFAULT '🎬' NOT NULL,
	`pin_hash` text,
	`is_admin` integer DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `members_name_unique` ON `members` (`name`);--> statement-breakpoint
CREATE TABLE `movies` (
	`tmdb_id` integer PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`year` integer,
	`poster_path` text,
	`runtime` integer,
	`genres` text DEFAULT '[]' NOT NULL,
	`overview` text DEFAULT '' NOT NULL,
	`cached_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `rotation_picks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`member_id` integer NOT NULL,
	`tmdb_id` integer NOT NULL,
	`status` text DEFAULT 'planned' NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`tmdb_id`) REFERENCES `movies`(`tmdb_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `rotation_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`order` text DEFAULT '[]' NOT NULL,
	`cursor` integer DEFAULT 0 NOT NULL,
	`owed` text DEFAULT '[]' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `settings` (
	`key` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `trailer_cache` (
	`tmdb_id` integer PRIMARY KEY NOT NULL,
	`youtube_key` text,
	`fetched_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `watch_events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tmdb_id` integer NOT NULL,
	`watched_on` text NOT NULL,
	`picked_by` integer,
	`attendees` text DEFAULT '[]' NOT NULL,
	`ratings` text DEFAULT '{}' NOT NULL,
	`source` text DEFAULT 'manual' NOT NULL,
	FOREIGN KEY (`tmdb_id`) REFERENCES `movies`(`tmdb_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`picked_by`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `wishlist_items` (
	`member_id` integer NOT NULL,
	`tmdb_id` integer NOT NULL,
	`position` integer NOT NULL,
	`note` text,
	`added_at` integer NOT NULL,
	PRIMARY KEY(`member_id`, `tmdb_id`),
	FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`tmdb_id`) REFERENCES `movies`(`tmdb_id`) ON UPDATE no action ON DELETE no action
);
