DROP TABLE IF EXISTS users;
CREATE TABLE `users` (
	`id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`role` text NOT NULL DEFAULT ('user'),
	`language` text NOT NULL DEFAULT ('en'),
	`theme` text NOT NULL DEFAULT ('dark'),
	`avatar_url` text,
	`last_active_at` timestamp,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);

CREATE TABLE `ayahs` (
	`number` int NOT NULL,
	`surah_number` int NOT NULL,
	`number_in_surah` int NOT NULL,
	`arabic` text NOT NULL,
	`translation_en` text NOT NULL,
	`translation_ur` text,
	`tafsir_en` text,
	`tafsir_ur` text,
	`tafsir_ar` text,
	`juz_number` int NOT NULL,
	`page_number` int NOT NULL,
	`search_vector_en` text,
	CONSTRAINT `ayahs_number` PRIMARY KEY(`number`)
);

CREATE TABLE `surahs` (
	`number` int NOT NULL,
	`name_arabic` text NOT NULL,
	`name_transliteration` text NOT NULL,
	`name_english` text NOT NULL,
	`total_ayahs` int NOT NULL,
	`revelation_type` text NOT NULL,
	`juz_start` int NOT NULL,
	CONSTRAINT `surahs_number` PRIMARY KEY(`number`)
);

CREATE TABLE `hadith_books` (
	`id` varchar(36) NOT NULL,
	`collection_id` text NOT NULL,
	`book_number` int NOT NULL,
	`name_arabic` text NOT NULL,
	`name_english` text NOT NULL,
	`total_hadiths` int NOT NULL DEFAULT 0,
	CONSTRAINT `hadith_books_id` PRIMARY KEY(`id`)
);

CREATE TABLE `hadith_collections` (
	`id` text NOT NULL,
	`name` text NOT NULL,
	`name_arabic` text NOT NULL,
	`author` text NOT NULL,
	`total_hadiths` int NOT NULL DEFAULT 0,
	`description` text,
	CONSTRAINT `hadith_collections_id` PRIMARY KEY(`id`)
);

CREATE TABLE `hadiths` (
	`id` varchar(36) NOT NULL,
	`collection_id` text NOT NULL,
	`book_number` int NOT NULL,
	`hadith_number` int NOT NULL,
	`arabic` text NOT NULL,
	`english` text NOT NULL,
	`urdu` text,
	`narrator` text,
	`grade` text,
	`reference` text NOT NULL,
	CONSTRAINT `hadiths_id` PRIMARY KEY(`id`)
);

CREATE TABLE `book_categories` (
	`id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`name_arabic` text,
	`sort_order` int NOT NULL DEFAULT 0,
	CONSTRAINT `book_categories_id` PRIMARY KEY(`id`)
);

CREATE TABLE `book_chapters` (
	`id` varchar(36) NOT NULL,
	`book_id` varchar(36) NOT NULL,
	`chapter_number` int NOT NULL,
	`title` text NOT NULL,
	`title_arabic` text,
	`content` text NOT NULL,
	`content_arabic` text,
	CONSTRAINT `book_chapters_id` PRIMARY KEY(`id`)
);

CREATE TABLE `books` (
	`id` varchar(36) NOT NULL,
	`title` text NOT NULL,
	`title_arabic` text,
	`author` text NOT NULL,
	`author_arabic` text,
	`category_id` varchar(36) NOT NULL,
	`language` text NOT NULL DEFAULT ('en'),
	`description` text,
	`cover_url` text,
	`total_chapters` int NOT NULL DEFAULT 0,
	`is_public` boolean NOT NULL DEFAULT true,
	`published_year` int,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `books_id` PRIMARY KEY(`id`)
);

CREATE TABLE `enrollments` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`path_id` varchar(36) NOT NULL,
	`started_at` timestamp NOT NULL DEFAULT (now()),
	`completed_at` timestamp,
	`progress_percent` decimal(5,2) NOT NULL DEFAULT '0',
	CONSTRAINT `enrollments_id` PRIMARY KEY(`id`)
);

CREATE TABLE `learning_paths` (
	`id` varchar(36) NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`level` text NOT NULL,
	`topic` text NOT NULL,
	`total_lessons` int NOT NULL DEFAULT 0,
	`estimated_hours` decimal(5,1) NOT NULL,
	`cover_url` text,
	`enrolled_count` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `learning_paths_id` PRIMARY KEY(`id`)
);

CREATE TABLE `lesson_progress` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`lesson_id` varchar(36) NOT NULL,
	`path_id` varchar(36) NOT NULL,
	`completed_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `lesson_progress_id` PRIMARY KEY(`id`)
);

CREATE TABLE `lessons` (
	`id` varchar(36) NOT NULL,
	`path_id` varchar(36) NOT NULL,
	`lesson_number` int NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`estimated_minutes` int NOT NULL DEFAULT 30,
	`references` text NOT NULL DEFAULT ('[]'),
	CONSTRAINT `lessons_id` PRIMARY KEY(`id`)
);

CREATE TABLE `activity_log` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`type` text NOT NULL,
	`source_id` text,
	`description` text NOT NULL,
	`duration_minutes` int NOT NULL DEFAULT 0,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activity_log_id` PRIMARY KEY(`id`)
);

CREATE TABLE `bookmarks` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`folder_id` varchar(36),
	`source_type` text NOT NULL,
	`source_id` text NOT NULL,
	`label` text NOT NULL,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bookmarks_id` PRIMARY KEY(`id`)
);

CREATE TABLE `folders` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`name` text NOT NULL,
	`color` text,
	`icon` text,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `folders_id` PRIMARY KEY(`id`)
);

CREATE TABLE `notes` (
	`id` varchar(36) NOT NULL,
	`user_id` varchar(36) NOT NULL,
	`folder_id` varchar(36),
	`title` text NOT NULL,
	`content` text NOT NULL,
	`source_type` text,
	`source_id` text,
	`source_label` text,
	`tags` text NOT NULL DEFAULT ('[]'),
	`created_at` timestamp NOT NULL DEFAULT (now()),
	`updated_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notes_id` PRIMARY KEY(`id`)
);

ALTER TABLE `ayahs` ADD CONSTRAINT `ayahs_surah_number_surahs_number_fk` FOREIGN KEY (`surah_number`) REFERENCES `surahs`(`number`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `hadith_books` ADD CONSTRAINT `hadith_books_collection_id_hadith_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `hadith_collections`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `hadiths` ADD CONSTRAINT `hadiths_collection_id_hadith_collections_id_fk` FOREIGN KEY (`collection_id`) REFERENCES `hadith_collections`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `book_chapters` ADD CONSTRAINT `book_chapters_book_id_books_id_fk` FOREIGN KEY (`book_id`) REFERENCES `books`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `books` ADD CONSTRAINT `books_category_id_book_categories_id_fk` FOREIGN KEY (`category_id`) REFERENCES `book_categories`(`id`) ON DELETE no action ON UPDATE no action;
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `enrollments` ADD CONSTRAINT `enrollments_path_id_learning_paths_id_fk` FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_lesson_id_lessons_id_fk` FOREIGN KEY (`lesson_id`) REFERENCES `lessons`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `lesson_progress` ADD CONSTRAINT `lesson_progress_path_id_learning_paths_id_fk` FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `lessons` ADD CONSTRAINT `lessons_path_id_learning_paths_id_fk` FOREIGN KEY (`path_id`) REFERENCES `learning_paths`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `activity_log` ADD CONSTRAINT `activity_log_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `bookmarks` ADD CONSTRAINT `bookmarks_folder_id_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE set null ON UPDATE no action;
ALTER TABLE `folders` ADD CONSTRAINT `folders_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `notes` ADD CONSTRAINT `notes_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
ALTER TABLE `notes` ADD CONSTRAINT `notes_folder_id_folders_id_fk` FOREIGN KEY (`folder_id`) REFERENCES `folders`(`id`) ON DELETE set null ON UPDATE no action;
CREATE INDEX `ayahs_surah_idx` ON `ayahs` (`surah_number`);
CREATE INDEX `ayahs_juz_idx` ON `ayahs` (`juz_number`);
CREATE INDEX `hadith_books_collection_idx` ON `hadith_books` (`collection_id`);
CREATE INDEX `hadiths_collection_book_idx` ON `hadiths` (`collection_id`,`book_number`);
CREATE INDEX `chapters_book_idx` ON `book_chapters` (`book_id`);
CREATE INDEX `books_category_idx` ON `books` (`category_id`);
CREATE INDEX `enrollments_user_idx` ON `enrollments` (`user_id`);
CREATE INDEX `lesson_progress_user_idx` ON `lesson_progress` (`user_id`,`path_id`);
CREATE INDEX `lessons_path_idx` ON `lessons` (`path_id`);
CREATE INDEX `activity_user_idx` ON `activity_log` (`user_id`);
CREATE INDEX `activity_date_idx` ON `activity_log` (`created_at`);
CREATE INDEX `bookmarks_user_idx` ON `bookmarks` (`user_id`);
CREATE INDEX `folders_user_idx` ON `folders` (`user_id`);
CREATE INDEX `notes_user_idx` ON `notes` (`user_id`);
CREATE INDEX `notes_folder_idx` ON `notes` (`folder_id`);
