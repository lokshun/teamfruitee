-- Split User.name into firstName + lastName
-- Rule: first word → firstName (or empty if single word), rest → lastName

ALTER TABLE "users" ADD COLUMN "firstName" TEXT NOT NULL DEFAULT '';
ALTER TABLE "users" ADD COLUMN "lastName" TEXT NOT NULL DEFAULT '';

UPDATE "users"
SET
  "firstName" = CASE
    WHEN position(' ' IN "name") > 0 THEN split_part("name", ' ', 1)
    ELSE ''
  END,
  "lastName" = CASE
    WHEN position(' ' IN "name") > 0 THEN substring("name" FROM position(' ' IN "name") + 1)
    ELSE "name"
  END;

-- Drop temporary DEFAULT for lastName (firstName keeps @default(""))
ALTER TABLE "users" ALTER COLUMN "lastName" DROP DEFAULT;

ALTER TABLE "users" DROP COLUMN "name";
