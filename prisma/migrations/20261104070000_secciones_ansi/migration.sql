-- Migración: secciones ANSI (Gacelas/Lobatos, rama COMUNIDAD en Tropa)
-- 1) Nueva columna rama en ScoutProfile
ALTER TABLE "ScoutProfile" ADD COLUMN "rama" TEXT;

-- 2) Preservar quiénes eran COMUNIDAD antes de convertir el enum
UPDATE "ScoutProfile" SET "rama" = 'COMUNIDAD' WHERE "seccion" = 'COMUNIDAD';

-- 3) Nuevo enum con los valores ANSI
CREATE TYPE "Seccion_new" AS ENUM ('MANADA_GACELAS', 'MANADA_LOBATOS', 'TROPA', 'CLAN', 'JEFATURA');

-- 4) Conversión de columnas (Manada se reparte entre Gacelas y Lobatos de forma determinista)
ALTER TABLE "ScoutProfile" ALTER COLUMN "seccion" TYPE "Seccion_new"
  USING (
    CASE "seccion"::text
      WHEN 'MANADA' THEN CASE WHEN abs(hashtext("id"::text)) % 2 = 0 THEN 'MANADA_GACELAS' ELSE 'MANADA_LOBATOS' END
      WHEN 'COMUNIDAD' THEN 'TROPA'
      ELSE "seccion"::text
    END
  )::"Seccion_new";

ALTER TABLE "ProgresionScout" ALTER COLUMN "seccion" TYPE "Seccion_new"
  USING (
    CASE "seccion"::text
      WHEN 'MANADA' THEN CASE WHEN abs(hashtext("id"::text)) % 2 = 0 THEN 'MANADA_GACELAS' ELSE 'MANADA_LOBATOS' END
      WHEN 'COMUNIDAD' THEN 'TROPA'
      ELSE "seccion"::text
    END
  )::"Seccion_new";

ALTER TABLE "Insignia" ALTER COLUMN "seccion" TYPE "Seccion_new"
  USING (
    CASE "seccion"::text
      WHEN 'MANADA' THEN CASE WHEN abs(hashtext("id"::text)) % 2 = 0 THEN 'MANADA_GACELAS' ELSE 'MANADA_LOBATOS' END
      WHEN 'COMUNIDAD' THEN 'TROPA'
      ELSE "seccion"::text
    END
  )::"Seccion_new";

-- 5) Drop del enum viejo y renombre del nuevo
DROP TYPE "Seccion";
ALTER TYPE "Seccion_new" RENAME TO "Seccion";
