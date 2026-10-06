CREATE TABLE `sync_status` (
	`id` text PRIMARY KEY NOT NULL,
	`last_success` text DEFAULT '' NOT NULL,
	`last_error` text DEFAULT '' NOT NULL,
	`line_count` integer DEFAULT 0 NOT NULL,
	`last_attempt` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
ALTER TABLE `accounts` ADD `password_hash` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `accounts` ADD `permissions` text DEFAULT '{}' NOT NULL;