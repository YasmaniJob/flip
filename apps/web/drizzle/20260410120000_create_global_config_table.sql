-- Create global_config table for platform-wide settings
CREATE TABLE IF NOT EXISTS "global_config" (
	"id" text PRIMARY KEY NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"updated_by" text,
	"updated_at" timestamp DEFAULT now(),
	"created_at" timestamp DEFAULT now()
);

-- Create unique index on key
CREATE UNIQUE INDEX IF NOT EXISTS "idx_global_config_key" ON "global_config" ("key");

-- Insert default trial_days configuration
INSERT INTO "global_config" ("id", "key", "value", "updated_by", "created_at", "updated_at")
VALUES (
	gen_random_uuid()::text,
	'trial_days',
	'{"trialDays":15}',
	'system',
	now(),
	now()
)
ON CONFLICT ("key") DO NOTHING;
