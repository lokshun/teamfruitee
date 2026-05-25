-- CreateEnum
CREATE TYPE "PackagingType" AS ENUM ('CAISSE', 'COLIS', 'CARTON', 'BIDON');

-- CreateEnum
CREATE TYPE "MeasureUnit" AS ENUM ('KG', 'LITER');

-- Ajout des nouvelles colonnes (nullable pour la migration des données)
ALTER TABLE "products" ADD COLUMN "packagingType" "PackagingType";
ALTER TABLE "products" ADD COLUMN "measureUnit" "MeasureUnit";
ALTER TABLE "products" ADD COLUMN "unitsPerPackage" INTEGER;

-- Migration des données : conversion depuis l'ancien unitType
UPDATE "products" SET
  "packagingType" = CASE
    WHEN "unitType" = 'CRATE' THEN 'CAISSE'::"PackagingType"
    WHEN "unitType" = 'UNIT'  THEN 'COLIS'::"PackagingType"
    ELSE NULL
  END,
  "measureUnit" = CASE
    WHEN "unitType" = 'LITER' THEN 'LITER'::"MeasureUnit"
    ELSE 'KG'::"MeasureUnit"
  END;

-- measureUnit devient NOT NULL avec défaut KG
ALTER TABLE "products" ALTER COLUMN "measureUnit" SET NOT NULL;
ALTER TABLE "products" ALTER COLUMN "measureUnit" SET DEFAULT 'KG';

-- Suppression de l'ancienne colonne et de l'ancien enum
ALTER TABLE "products" DROP COLUMN "unitType";
DROP TYPE "UnitType";
