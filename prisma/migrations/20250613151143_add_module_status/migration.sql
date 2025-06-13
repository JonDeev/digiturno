-- CreateEnum
CREATE TYPE "ModuleStatus" AS ENUM ('AVAILABLE', 'OCCUPIED');

-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "status" "ModuleStatus" NOT NULL DEFAULT 'AVAILABLE';
