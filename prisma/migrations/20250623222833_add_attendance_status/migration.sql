-- AlterEnum
ALTER TYPE "TurnStatus" ADD VALUE 'ATTENDANCE';

-- AlterTable
ALTER TABLE "Turn" ADD COLUMN     "fecha_creacion" TEXT;
