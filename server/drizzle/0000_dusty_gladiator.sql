CREATE TABLE `locations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`created_at` text NOT NULL,
	`condition` text,
	`observed_at` text,
	`source` text,
	`area` text,
	`valid_period_text` text,
	`temperature_c` real,
	`humidity_percent` real,
	`rainfall_mm` real,
	`wind_speed_knots` real,
	`wind_direction_degrees` real,
	`forecast_low_c` real,
	`forecast_high_c` real,
	`uv_index` real,
	`psi_twenty_four_hourly` real,
	`pm25_one_hourly` real,
	`air_quality_region` text,
	`forecast_periods` text NOT NULL,
	`daily_forecast` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `locations_latitude_longitude_unique` ON `locations` (`latitude`,`longitude`);