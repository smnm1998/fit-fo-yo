-- CreateTable
CREATE TABLE "FoodNutrition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "caloriesPer100g" INTEGER NOT NULL,
    "gramsPerServing" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FoodNutrition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FoodNutrition_name_key" ON "FoodNutrition"("name");
