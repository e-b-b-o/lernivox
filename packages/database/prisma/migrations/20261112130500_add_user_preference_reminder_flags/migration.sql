-- Persist schedule & spaced-repetition reminder flags on user_preferences
ALTER TABLE "user_preferences"
  ADD COLUMN IF NOT EXISTS "studyReminders" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "user_preferences"
  ADD COLUMN IF NOT EXISTS "reviewReminders" BOOLEAN NOT NULL DEFAULT true;

