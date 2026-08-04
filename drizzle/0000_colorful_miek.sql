CREATE TABLE `monitor_sync_state` (
	`id` text PRIMARY KEY NOT NULL,
	`snapshot_json` text NOT NULL,
	`last_attempt_at` text,
	`last_success_at` text,
	`last_error` text
);
