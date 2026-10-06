CREATE TABLE `invoice_files` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`uploader` text NOT NULL,
	`filename` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`blob_key` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoice_files_blob_key_unique` ON `invoice_files` (`blob_key`);