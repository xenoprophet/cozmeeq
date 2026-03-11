ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "password_hash" text;--> statement-breakpoint

UPDATE "users"
SET
  "email" = COALESCE("email", 'user-' || "id" || '@local.pulse'),
  "password_hash" = COALESCE("password_hash", '$2b$10$xw45md4YF7HF25QyViiVkOHObScqQMg6ulx8Nkkc.AhdQixuzM0yy');--> statement-breakpoint

ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "password_hash" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_email_idx" ON "users" USING btree ("email");
