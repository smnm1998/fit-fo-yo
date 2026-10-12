import { PrismaClient } from '@prisma/client';
import { CURATED_FOODS } from './data/curated-foods';

const prisma = new PrismaClient();

/**
 * ai.service 의 normalizeFoodName 과 반드시 동일 로직 유지
 * 자연어 처리 중 발생하는 공백, 대소문자 차이를 완벽하게 압착하여 검색 정확도를 극대화함.
 */
const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');

async function main() {
  let count = 0;
  // 중복 삽입 및 데이터 무결성 보장을 위해 Set 자료구조로 정규화된 이름 필터링 진행
  const processedNames = new Set<string>();

  for (const food of CURATED_FOODS) {
    for (const raw of food.names) {
      const name = normalize(raw);

      // 빈 문자열이거나 이미 처리된 이름인 경우 스킵 (중복 방지 및 무결성 확보)
      if (!name || processedNames.has(name)) continue;

      processedNames.add(name);

      // Prisma의 upsert 기능을 통해 기존 데이터 존재 시 업데이트, 없을 시 새로 생성
      await prisma.foodNutrition.upsert({
        where: { name },
        create: {
          name,
          caloriesPer100g: food.caloriesPer100g,
          gramsPerServing: food.gramsPerServing,
        },
        update: { caloriesPer100g: food.caloriesPer100g, gramsPerServing: food.gramsPerServing },
      });
      count++;
    }
  }
  console.log(
    `✅ FoodNutrition seed 완료: 정규화된 고유 음식명 ${count}개 행이 성공적으로 삽입 또는 업데이트되었습니다.`,
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => void prisma.$disconnect());
