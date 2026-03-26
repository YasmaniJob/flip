-- Add indexes for optimized staff search
CREATE INDEX IF NOT EXISTS "idx_staff_phone" ON "staff" USING btree ("phone");
CREATE INDEX IF NOT EXISTS "idx_staff_area" ON "staff" USING btree ("area");
