/*
  Warnings:

  - Added the required column `foodCd` to the `FoodNutrition` table without a default value. This is not possible if the table is not empty.
  - Added the required column `foodNm` to the `FoodNutrition` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "FoodLookupMissReason" AS ENUM ('NOT_FOUND', 'AMBIGUOUS');

-- 근거 없는 기존 값(LLM 초안 · 딥 리서치) 제거. 이후엔 식약처 조회 결과로만 채운다
DELETE FROM "FoodNutrition";

-- AlterTable
ALTER TABLE "FoodNutrition" ADD COLUMN     "foodCd" TEXT NOT NULL,
ADD COLUMN     "foodNm" TEXT NOT NULL,
ADD COLUMN     "referenceDate" TEXT,
ALTER COLUMN "gramsPerServing" DROP NOT NULL;

-- CreateTable
CREATE TABLE "FoodLookupMiss" (
    "name" TEXT NOT NULL,
    "reason" "FoodLookupMissReason" NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 1,
    "checkedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodLookupMiss_pkey" PRIMARY KEY ("name")
);
