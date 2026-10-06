CREATE TABLE `invoice_payments` (
	`id` text PRIMARY KEY NOT NULL,
	`invoice_id` text NOT NULL,
	`amount_cents` integer NOT NULL,
	`date` text NOT NULL,
	`method` text NOT NULL,
	`reference` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	`by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `stock_moves` (
	`id` text PRIMARY KEY NOT NULL,
	`site_id` text NOT NULL,
	`item_key` text NOT NULL,
	`name` text NOT NULL,
	`spec` text DEFAULT '' NOT NULL,
	`unit` text NOT NULL,
	`qty` real NOT NULL,
	`kind` text NOT NULL,
	`date` text NOT NULL,
	`note` text NOT NULL,
	`created` text NOT NULL,
	`by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `supplier_invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`supplier_id` text NOT NULL,
	`number` text NOT NULL,
	`date` text NOT NULL,
	`due` text DEFAULT '' NOT NULL,
	`total_cents` integer NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created` text NOT NULL,
	`by` text NOT NULL
);
--> statement-breakpoint
ALTER TABLE `invoice_files` ADD `invoice_id` text DEFAULT '' NOT NULL;