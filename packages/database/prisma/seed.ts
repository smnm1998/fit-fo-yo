import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * ai.service 의 normalizeFoodName 과 반드시 동일 로직 유지
 * 자연어 처리 중 발생하는 공백, 대소문자 차이를 완벽하게 압착하여 검색 정확도를 극대화함.
 */
const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, '');

type Food = { names: string[]; caloriesPer100g: number; gramsPerServing: number };

// caloriesPer100g = 100g당 kcal, gramsPerServing = 1인분/1개 대표 그램수
// 공공데이터(식약처, 농진청) 및 외식 영양성분 자료집 기준 평균값 추출 모델
const FOODS: Food[] = [
  // ---------------------------------------------------------
  // 1. 밥류 (Rice, Porridge, Gimbap & Mixed Rice)
  // ---------------------------------------------------------
  {
    names: ['밥', '공기밥', '쌀밥', '흰밥', '흰쌀밥', '백미밥'],
    caloriesPer100g: 145,
    gramsPerServing: 210,
  },
  { names: ['현미밥', '순현미밥'], caloriesPer100g: 140, gramsPerServing: 210 },
  { names: ['잡곡밥', '잡곡공기밥'], caloriesPer100g: 145, gramsPerServing: 210 },
  { names: ['흑미밥'], caloriesPer100g: 145, gramsPerServing: 210 },
  { names: ['보리밥'], caloriesPer100g: 135, gramsPerServing: 210 },
  { names: ['곤약밥', '곤약즉석밥'], caloriesPer100g: 40, gramsPerServing: 150 },
  { names: ['비빔밥'], caloriesPer100g: 130, gramsPerServing: 500 },
  { names: ['돌솥비빔밥'], caloriesPer100g: 140, gramsPerServing: 550 },
  { names: ['육회비빔밥'], caloriesPer100g: 140, gramsPerServing: 450 },
  { names: ['볶음밥', '계란볶음밥'], caloriesPer100g: 180, gramsPerServing: 300 },
  { names: ['김치볶음밥', '김볶'], caloriesPer100g: 150, gramsPerServing: 350 },
  { names: ['새우볶음밥'], caloriesPer100g: 170, gramsPerServing: 300 },
  { names: ['짜장밥', '자장밥'], caloriesPer100g: 140, gramsPerServing: 400 },
  { names: ['카레라이스', '카레', '카레밥'], caloriesPer100g: 120, gramsPerServing: 400 },
  { names: ['하이라이스'], caloriesPer100g: 125, gramsPerServing: 400 },
  { names: ['오므라이스', '오무라이스'], caloriesPer100g: 160, gramsPerServing: 450 },
  { names: ['제육덮밥', '제육밥'], caloriesPer100g: 150, gramsPerServing: 450 },
  { names: ['오징어덮밥'], caloriesPer100g: 130, gramsPerServing: 450 },
  { names: ['불고기덮밥'], caloriesPer100g: 140, gramsPerServing: 450 },
  { names: ['회덮밥'], caloriesPer100g: 110, gramsPerServing: 450 },
  { names: ['잡채밥'], caloriesPer100g: 150, gramsPerServing: 450 },
  { names: ['김밥', '일반김밥', '야채김밥'], caloriesPer100g: 150, gramsPerServing: 230 },
  { names: ['참치김밥', '참김'], caloriesPer100g: 170, gramsPerServing: 250 },
  { names: ['치즈김밥'], caloriesPer100g: 165, gramsPerServing: 240 },
  { names: ['돈까스김밥', '돈가스김밥'], caloriesPer100g: 180, gramsPerServing: 250 },
  { names: ['꼬마김밥'], caloriesPer100g: 160, gramsPerServing: 150 },
  { names: ['삼각김밥', '삼김'], caloriesPer100g: 170, gramsPerServing: 100 },
  { names: ['주먹밥'], caloriesPer100g: 160, gramsPerServing: 150 },
  { names: ['충무김밥'], caloriesPer100g: 145, gramsPerServing: 200 },
  { names: ['유부초밥'], caloriesPer100g: 180, gramsPerServing: 200 },
  { names: ['떡국'], caloriesPer100g: 90, gramsPerServing: 800 },
  { names: ['만둣국', '만두국'], caloriesPer100g: 90, gramsPerServing: 600 },
  { names: ['떡만둣국', '떡만두국'], caloriesPer100g: 100, gramsPerServing: 700 },
  { names: ['누룽지탕'], caloriesPer100g: 60, gramsPerServing: 400 },
  { names: ['약식', '약밥'], caloriesPer100g: 240, gramsPerServing: 100 },
  { names: ['야채죽', '채소죽'], caloriesPer100g: 50, gramsPerServing: 400 },
  { names: ['소고기죽', '소고기버섯죽'], caloriesPer100g: 65, gramsPerServing: 400 },
  { names: ['전복죽'], caloriesPer100g: 70, gramsPerServing: 400 },
  { names: ['호박죽'], caloriesPer100g: 80, gramsPerServing: 400 },
  { names: ['팥죽', '단팥죽'], caloriesPer100g: 120, gramsPerServing: 400 },

  // ---------------------------------------------------------
  // 2. 면류 (Noodle Dishes & Pasta)
  // ---------------------------------------------------------
  { names: ['라면', '신라면', '진라면', '봉지라면'], caloriesPer100g: 417, gramsPerServing: 120 },
  { names: ['불닭볶음면', '불닭', '불닭볶음'], caloriesPer100g: 408, gramsPerServing: 130 },
  { names: ['짜파게티', '짜장라면'], caloriesPer100g: 429, gramsPerServing: 140 },
  { names: ['비빔면', '팔도비빔면'], caloriesPer100g: 415, gramsPerServing: 130 },
  { names: ['컵라면', '사발면'], caloriesPer100g: 430, gramsPerServing: 80 },
  { names: ['짜장면', '자장면'], caloriesPer100g: 135, gramsPerServing: 650 },
  { names: ['짬뽕'], caloriesPer100g: 70, gramsPerServing: 1000 },
  { names: ['울면'], caloriesPer100g: 60, gramsPerServing: 900 },
  { names: ['물냉면', '물냉'], caloriesPer100g: 100, gramsPerServing: 500 },
  { names: ['비빔냉면', '비냉'], caloriesPer100g: 125, gramsPerServing: 500 },
  { names: ['쫄면'], caloriesPer100g: 140, gramsPerServing: 450 },
  { names: ['칼국수'], caloriesPer100g: 75, gramsPerServing: 800 },
  { names: ['수제비'], caloriesPer100g: 80, gramsPerServing: 700 },
  { names: ['국수', '잔치국수'], caloriesPer100g: 100, gramsPerServing: 450 },
  { names: ['비빔국수'], caloriesPer100g: 130, gramsPerServing: 400 },
  { names: ['열무국수'], caloriesPer100g: 80, gramsPerServing: 500 },
  { names: ['콩국수'], caloriesPer100g: 105, gramsPerServing: 600 },
  { names: ['우동'], caloriesPer100g: 100, gramsPerServing: 400 },
  { names: ['볶음우동', '야끼우동'], caloriesPer100g: 150, gramsPerServing: 350 },
  { names: ['메밀국수', '소바', '메밀소바'], caloriesPer100g: 110, gramsPerServing: 400 },
  { names: ['쌀국수', '소고기쌀국수', '포'], caloriesPer100g: 65, gramsPerServing: 700 },
  {
    names: ['파스타', '스파게티', '토마토파스타', '토마토스파게티'],
    caloriesPer100g: 120,
    gramsPerServing: 350,
  },
  {
    names: ['크림파스타', '크림스파게티', '까르보나라'],
    caloriesPer100g: 170,
    gramsPerServing: 350,
  },
  { names: ['봉골레파스타', '봉골레'], caloriesPer100g: 140, gramsPerServing: 300 },
  { names: ['알리오올리오'], caloriesPer100g: 220, gramsPerServing: 250 },
  { names: ['마라탕'], caloriesPer100g: 120, gramsPerServing: 600 },
  { names: ['마라샹궈'], caloriesPer100g: 180, gramsPerServing: 500 },
  { names: ['팟타이'], caloriesPer100g: 170, gramsPerServing: 350 },

  // ---------------------------------------------------------
  // 3. 국·찌개·탕류 (Soups, Stews & Tangs)
  // ---------------------------------------------------------
  { names: ['김치찌개', '김치찌게'], caloriesPer100g: 55, gramsPerServing: 400 },
  { names: ['된장찌개', '된장찌게'], caloriesPer100g: 60, gramsPerServing: 400 },
  { names: ['부대찌개', '부대찌게'], caloriesPer100g: 90, gramsPerServing: 450 },
  { names: ['순두부찌개', '순두부찌게', '순두부'], caloriesPer100g: 45, gramsPerServing: 400 },
  { names: ['청국장찌개', '청국장'], caloriesPer100g: 75, gramsPerServing: 400 },
  { names: ['동태찌개', '동태탕'], caloriesPer100g: 50, gramsPerServing: 500 },
  { names: ['비지찌개', '비지찌게', '콩비지찌개'], caloriesPer100g: 80, gramsPerServing: 400 },
  { names: ['고추장찌개'], caloriesPer100g: 75, gramsPerServing: 400 },
  { names: ['미역국', '소고기미역국'], caloriesPer100g: 30, gramsPerServing: 350 },
  { names: ['소고기무국', '소고기뭇국'], caloriesPer100g: 35, gramsPerServing: 350 },
  { names: ['북어국', '북엇국', '황태국', '황탯국'], caloriesPer100g: 35, gramsPerServing: 350 },
  { names: ['콩나물국'], caloriesPer100g: 15, gramsPerServing: 350 },
  { names: ['시래기국', '우거지국'], caloriesPer100g: 25, gramsPerServing: 350 },
  { names: ['계란국', '달걀국'], caloriesPer100g: 25, gramsPerServing: 350 },
  { names: ['사골곰탕', '곰탕'], caloriesPer100g: 50, gramsPerServing: 500 },
  { names: ['설렁탕'], caloriesPer100g: 65, gramsPerServing: 500 },
  { names: ['갈비탕'], caloriesPer100g: 85, gramsPerServing: 600 },
  { names: ['육개장'], caloriesPer100g: 75, gramsPerServing: 500 },
  { names: ['삼계탕'], caloriesPer100g: 100, gramsPerServing: 1000 },
  { names: ['추어탕'], caloriesPer100g: 65, gramsPerServing: 500 },
  { names: ['감자탕'], caloriesPer100g: 105, gramsPerServing: 900 },
  { names: ['뼈해장국', '뼈다귀해장국'], caloriesPer100g: 80, gramsPerServing: 800 },
  { names: ['선지해장국', '선지국'], caloriesPer100g: 60, gramsPerServing: 800 },
  { names: ['내장탕'], caloriesPer100g: 75, gramsPerServing: 600 },
  { names: ['순대국', '순댓국'], caloriesPer100g: 75, gramsPerServing: 600 },
  { names: ['해물탕'], caloriesPer100g: 50, gramsPerServing: 700 },
  { names: ['알탕'], caloriesPer100g: 70, gramsPerServing: 500 },
  { names: ['꽃게탕'], caloriesPer100g: 55, gramsPerServing: 600 },
  { names: ['어묵탕', '오뎅탕'], caloriesPer100g: 60, gramsPerServing: 400 },

  // ---------------------------------------------------------
  // 4. 메인 고기류 및 구이 (Meat & Grilled Dishes)
  // ---------------------------------------------------------
  { names: ['삼겹살', '삼겹살구이'], caloriesPer100g: 300, gramsPerServing: 200 },
  { names: ['목살', '목살구이'], caloriesPer100g: 230, gramsPerServing: 200 },
  { names: ['돼지갈비', '돼지갈비구이'], caloriesPer100g: 240, gramsPerServing: 250 },
  { names: ['소갈비구이', '소갈비'], caloriesPer100g: 270, gramsPerServing: 250 },
  { names: ['불고기', '소불고기'], caloriesPer100g: 180, gramsPerServing: 250 },
  { names: ['돼지불고기', '돼지간장불고기'], caloriesPer100g: 190, gramsPerServing: 250 },
  { names: ['제육볶음', '제육', '돼지고기볶음'], caloriesPer100g: 200, gramsPerServing: 250 },
  { names: ['닭갈비'], caloriesPer100g: 170, gramsPerServing: 300 },
  { names: ['소곱창구이', '소곱창'], caloriesPer100g: 280, gramsPerServing: 200 },
  { names: ['돼지곱창볶음', '야채곱창', '돼지곱창'], caloriesPer100g: 220, gramsPerServing: 250 },
  { names: ['막창구이', '막창'], caloriesPer100g: 290, gramsPerServing: 200 },
  { names: ['대창구이', '대창'], caloriesPer100g: 400, gramsPerServing: 200 },
  { names: ['족발'], caloriesPer100g: 240, gramsPerServing: 300 },
  { names: ['보쌈', '수육', '돼지고기수육'], caloriesPer100g: 250, gramsPerServing: 300 },
  { names: ['오리구이'], caloriesPer100g: 220, gramsPerServing: 200 },
  { names: ['훈제오리'], caloriesPer100g: 290, gramsPerServing: 150 },
  { names: ['소고기등심구이', '소등심', '등심구이'], caloriesPer100g: 240, gramsPerServing: 150 },
  { names: ['소고기안심구이', '소안심', '안심구이'], caloriesPer100g: 190, gramsPerServing: 150 },
  { names: ['차돌박이구이', '차돌박이'], caloriesPer100g: 360, gramsPerServing: 150 },
  { names: ['육회'], caloriesPer100g: 130, gramsPerServing: 150 },
  { names: ['닭가슴살', '닭가슴'], caloriesPer100g: 165, gramsPerServing: 100 },
  { names: ['닭안심'], caloriesPer100g: 110, gramsPerServing: 100 },
  { names: ['닭다리구이', '닭다리바베큐'], caloriesPer100g: 180, gramsPerServing: 150 },

  // ---------------------------------------------------------
  // 5. 볶음·조림·찜류 및 해산물 조리 (Stir-fried, Braised & Steamed)
  // ---------------------------------------------------------
  { names: ['오징어볶음'], caloriesPer100g: 110, gramsPerServing: 200 },
  { names: ['낙지볶음'], caloriesPer100g: 100, gramsPerServing: 200 },
  { names: ['쭈꾸미볶음', '주꾸미볶음'], caloriesPer100g: 110, gramsPerServing: 200 },
  { names: ['소갈비찜'], caloriesPer100g: 190, gramsPerServing: 300 },
  { names: ['돼지갈비찜'], caloriesPer100g: 180, gramsPerServing: 300 },
  { names: ['매운갈비찜'], caloriesPer100g: 185, gramsPerServing: 300 },
  { names: ['안동찜닭', '찜닭'], caloriesPer100g: 140, gramsPerServing: 400 },
  { names: ['닭볶음탕', '닭도리탕'], caloriesPer100g: 120, gramsPerServing: 400 },
  { names: ['아구찜', '아귀찜'], caloriesPer100g: 80, gramsPerServing: 350 },
  { names: ['해물찜'], caloriesPer100g: 90, gramsPerServing: 350 },
  { names: ['코다리조림'], caloriesPer100g: 110, gramsPerServing: 250 },
  { names: ['갈치조림'], caloriesPer100g: 120, gramsPerServing: 200 },
  { names: ['고등어조림'], caloriesPer100g: 140, gramsPerServing: 200 },
  { names: ['두부조림'], caloriesPer100g: 100, gramsPerServing: 150 },
  { names: ['감자조림'], caloriesPer100g: 90, gramsPerServing: 100 },
  { names: ['우엉조림'], caloriesPer100g: 110, gramsPerServing: 50 },
  { names: ['연근조림'], caloriesPer100g: 100, gramsPerServing: 50 },
  { names: ['계란찜', '달걀찜'], caloriesPer100g: 80, gramsPerServing: 150 },

  // ---------------------------------------------------------
  // 6. 부침·튀김·전 및 까스류 (Pancakes, Fried & Cutlets)
  // ---------------------------------------------------------
  { names: ['김치전'], caloriesPer100g: 190, gramsPerServing: 150 },
  { names: ['해물파전', '파전'], caloriesPer100g: 180, gramsPerServing: 200 },
  { names: ['감자전'], caloriesPer100g: 140, gramsPerServing: 150 },
  { names: ['부추전'], caloriesPer100g: 150, gramsPerServing: 150 },
  { names: ['동태전', '생선전'], caloriesPer100g: 180, gramsPerServing: 150 },
  { names: ['육전'], caloriesPer100g: 210, gramsPerServing: 150 },
  { names: ['동그랑땡'], caloriesPer100g: 200, gramsPerServing: 150 },
  { names: ['호박전', '애호박전'], caloriesPer100g: 120, gramsPerServing: 120 },
  { names: ['돈까스', '돈가스', '포크커틀릿'], caloriesPer100g: 320, gramsPerServing: 200 },
  { names: ['치즈돈까스', '치즈돈가스'], caloriesPer100g: 350, gramsPerServing: 220 },
  { names: ['생선가스', '생선까스'], caloriesPer100g: 280, gramsPerServing: 150 },
  { names: ['치킨가스', '치킨까스'], caloriesPer100g: 290, gramsPerServing: 180 },
  { names: ['새우튀김'], caloriesPer100g: 280, gramsPerServing: 100 },
  { names: ['오징어튀김'], caloriesPer100g: 260, gramsPerServing: 100 },
  { names: ['김말이튀김', '김말이'], caloriesPer100g: 250, gramsPerServing: 80 },
  { names: ['고구마튀김'], caloriesPer100g: 240, gramsPerServing: 100 },
  { names: ['야채튀김'], caloriesPer100g: 300, gramsPerServing: 100 },
  { names: ['탕수육'], caloriesPer100g: 230, gramsPerServing: 250 },
  { names: ['깐풍기'], caloriesPer100g: 250, gramsPerServing: 250 },
  { names: ['크림새우'], caloriesPer100g: 280, gramsPerServing: 200 },
  { names: ['고추튀김'], caloriesPer100g: 200, gramsPerServing: 100 },

  // ---------------------------------------------------------
  // 7. 밑반찬·나물 및 무침류 (Side Dishes, Seasoned Salads)
  // ---------------------------------------------------------
  { names: ['계란말이', '달걀말이'], caloriesPer100g: 170, gramsPerServing: 120 },
  { names: ['어묵볶음', '오뎅볶음'], caloriesPer100g: 180, gramsPerServing: 100 },
  { names: ['멸치볶음'], caloriesPer100g: 320, gramsPerServing: 50 },
  { names: ['소고기장조림', '장조림'], caloriesPer100g: 120, gramsPerServing: 80 },
  { names: ['메추리알장조림'], caloriesPer100g: 115, gramsPerServing: 80 },
  { names: ['콩자반', '검은콩조림'], caloriesPer100g: 190, gramsPerServing: 50 },
  { names: ['무생채'], caloriesPer100g: 45, gramsPerServing: 70 },
  { names: ['시금치나물', '시금치무침'], caloriesPer100g: 60, gramsPerServing: 70 },
  { names: ['콩나물무침'], caloriesPer100g: 45, gramsPerServing: 70 },
  { names: ['고사리나물'], caloriesPer100g: 65, gramsPerServing: 70 },
  { names: ['도라지나물'], caloriesPer100g: 75, gramsPerServing: 70 },
  { names: ['애호박볶음'], caloriesPer100g: 65, gramsPerServing: 70 },
  { names: ['미역줄기볶음'], caloriesPer100g: 80, gramsPerServing: 70 },
  { names: ['가지볶음'], caloriesPer100g: 70, gramsPerServing: 70 },
  { names: ['감자채볶음'], caloriesPer100g: 110, gramsPerServing: 100 },
  { names: ['골뱅이무침', '골뱅이'], caloriesPer100g: 120, gramsPerServing: 250 },
  { names: ['도토리묵무침'], caloriesPer100g: 65, gramsPerServing: 200 },
  { names: ['두부구이'], caloriesPer100g: 120, gramsPerServing: 120 },
  { names: ['파무침', '파절이', '파무침파절이'], caloriesPer100g: 90, gramsPerServing: 50 },
  { names: ['양파절임', '양파장아찌'], caloriesPer100g: 45, gramsPerServing: 50 },
  { names: ['오이무침'], caloriesPer100g: 40, gramsPerServing: 80 },
  { names: ['잡채'], caloriesPer100g: 130, gramsPerServing: 150 },

  // ---------------------------------------------------------
  // 8. 김치 및 젓갈류 (Kimchi & Salted Seafood)
  // ---------------------------------------------------------
  { names: ['김치', '배추김치'], caloriesPer100g: 15, gramsPerServing: 50 },
  { names: ['깍두기'], caloriesPer100g: 25, gramsPerServing: 50 },
  { names: ['총각김치', '알타리김치', '알타리'], caloriesPer100g: 30, gramsPerServing: 50 },
  { names: ['열무김치'], caloriesPer100g: 20, gramsPerServing: 50 },
  { names: ['파김치'], caloriesPer100g: 40, gramsPerServing: 40 },
  { names: ['갓김치'], caloriesPer100g: 35, gramsPerServing: 40 },
  { names: ['백김치'], caloriesPer100g: 10, gramsPerServing: 50 },
  { names: ['동치미', '나박김치'], caloriesPer100g: 10, gramsPerServing: 150 },
  { names: ['오이소박이'], caloriesPer100g: 25, gramsPerServing: 60 },
  { names: ['명란젓'], caloriesPer100g: 120, gramsPerServing: 30 },
  { names: ['오징어젓', '오징어젓갈'], caloriesPer100g: 110, gramsPerServing: 30 },
  { names: ['낙지젓', '낙지젓갈'], caloriesPer100g: 110, gramsPerServing: 30 },
  { names: ['새우젓'], caloriesPer100g: 50, gramsPerServing: 10 },

  // ---------------------------------------------------------
  // 9. 분식·만두류 (Street Food & Dumplings)
  // ---------------------------------------------------------
  { names: ['떡볶이'], caloriesPer100g: 130, gramsPerServing: 250 },
  { names: ['치즈떡볶이'], caloriesPer100g: 160, gramsPerServing: 270 },
  { names: ['로제떡볶이'], caloriesPer100g: 180, gramsPerServing: 300 },
  { names: ['라볶이'], caloriesPer100g: 140, gramsPerServing: 300 },
  { names: ['순대', '찰순대'], caloriesPer100g: 200, gramsPerServing: 150 },
  { names: ['물어묵', '꼬치어묵', '어묵꼬치'], caloriesPer100g: 140, gramsPerServing: 100 },
  { names: ['만두', '고기만두', '교자만두', '찐만두'], caloriesPer100g: 200, gramsPerServing: 150 },
  { names: ['김치만두'], caloriesPer100g: 185, gramsPerServing: 150 },
  { names: ['군만두'], caloriesPer100g: 270, gramsPerServing: 150 },
  { names: ['물만두'], caloriesPer100g: 170, gramsPerServing: 120 },
  { names: ['왕만두'], caloriesPer100g: 190, gramsPerServing: 100 },
  { names: ['닭강정'], caloriesPer100g: 290, gramsPerServing: 200 },
  { names: ['소떡소떡'], caloriesPer100g: 270, gramsPerServing: 100 },
  { names: ['핫도그'], caloriesPer100g: 280, gramsPerServing: 100 },
  { names: ['치즈핫도그'], caloriesPer100g: 310, gramsPerServing: 110 },
  { names: ['순대볶음'], caloriesPer100g: 160, gramsPerServing: 250 },

  // ---------------------------------------------------------
  // 10. 치킨·피자·버거 및 양식 패스트푸드 (Fast Food)
  // ---------------------------------------------------------
  { names: ['후라이드치킨', '치킨', '후라이드'], caloriesPer100g: 260, gramsPerServing: 200 },
  { names: ['양념치킨', '양념'], caloriesPer100g: 290, gramsPerServing: 200 },
  { names: ['간장치킨'], caloriesPer100g: 280, gramsPerServing: 200 },
  { names: ['구운치킨', '오븐구이치킨'], caloriesPer100g: 190, gramsPerServing: 200 },
  { names: ['허니버터치킨'], caloriesPer100g: 310, gramsPerServing: 200 },
  { names: ['파닭'], caloriesPer100g: 260, gramsPerServing: 220 },
  { names: ['치즈피자'], caloriesPer100g: 250, gramsPerServing: 100 },
  { names: ['페퍼로니피자'], caloriesPer100g: 280, gramsPerServing: 100 },
  { names: ['피자', '콤비네이션피자'], caloriesPer100g: 260, gramsPerServing: 110 },
  { names: ['고구마피자'], caloriesPer100g: 240, gramsPerServing: 120 },
  { names: ['포테이토피자'], caloriesPer100g: 250, gramsPerServing: 120 },
  { names: ['불고기피자'], caloriesPer100g: 250, gramsPerServing: 110 },
  { names: ['햄버거', '불고기버거', '버거'], caloriesPer100g: 240, gramsPerServing: 180 },
  { names: ['치즈버거'], caloriesPer100g: 260, gramsPerServing: 180 },
  { names: ['치킨버거'], caloriesPer100g: 270, gramsPerServing: 200 },
  { names: ['새우버거'], caloriesPer100g: 250, gramsPerServing: 180 },
  { names: ['감자튀김', '후렌치후라이', '감튀'], caloriesPer100g: 310, gramsPerServing: 115 },
  { names: ['치즈스틱'], caloriesPer100g: 330, gramsPerServing: 50 },
  { names: ['어니언링'], caloriesPer100g: 290, gramsPerServing: 80 },

  // ---------------------------------------------------------
  // 11. 일식 및 아시안·회 (Japanese, Asian & Raw Fish)
  // ---------------------------------------------------------
  { names: ['모듬초밥', '초밥', '스시'], caloriesPer100g: 150, gramsPerServing: 250 },
  { names: ['연어초밥'], caloriesPer100g: 160, gramsPerServing: 250 },
  { names: ['광어초밥'], caloriesPer100g: 140, gramsPerServing: 250 },
  { names: ['가츠동', '돈까스덮밥'], caloriesPer100g: 160, gramsPerServing: 450 },
  { names: ['규동', '소고기덮밥'], caloriesPer100g: 150, gramsPerServing: 450 },
  { names: ['사케동', '연어덮밥'], caloriesPer100g: 140, gramsPerServing: 400 },
  { names: ['타코야끼', '타코야키'], caloriesPer100g: 150, gramsPerServing: 150 },
  { names: ['오코노미야끼', '오코노미야키'], caloriesPer100g: 160, gramsPerServing: 300 },
  { names: ['일본라멘', '돈코츠라멘', '소유라멘'], caloriesPer100g: 130, gramsPerServing: 500 },
  { names: ['광어회'], caloriesPer100g: 110, gramsPerServing: 150 },
  { names: ['우럭회'], caloriesPer100g: 100, gramsPerServing: 150 },
  { names: ['연어회'], caloriesPer100g: 160, gramsPerServing: 150 },
  { names: ['참치회'], caloriesPer100g: 130, gramsPerServing: 150 },
  { names: ['생굴', '굴'], caloriesPer100g: 60, gramsPerServing: 100 },
  { names: ['가리비구이'], caloriesPer100g: 80, gramsPerServing: 150 },
  { names: ['대하소금구이', '대하구이', '새우구이'], caloriesPer100g: 100, gramsPerServing: 150 },
  { names: ['문어숙회'], caloriesPer100g: 75, gramsPerServing: 150 },
  { names: ['오징어숙회'], caloriesPer100g: 85, gramsPerServing: 150 },
  { names: ['전복회'], caloriesPer100g: 70, gramsPerServing: 100 },

  // ---------------------------------------------------------
  // 12. 음료 및 주류 (Beverages & Alcohol)
  // ---------------------------------------------------------
  {
    names: ['아메리카노', '아아', '아메', '아이스아메리카노', '따아'],
    caloriesPer100g: 3,
    gramsPerServing: 355,
  },
  { names: ['카페라떼', '라떼', '라테', '아이스라떼'], caloriesPer100g: 45, gramsPerServing: 355 },
  { names: ['바닐라라떼', '바닐라라테', '아바라'], caloriesPer100g: 65, gramsPerServing: 355 },
  { names: ['카라멜마끼아또', '마끼아또', '마키아토'], caloriesPer100g: 70, gramsPerServing: 355 },
  { names: ['카페모카', '모카'], caloriesPer100g: 80, gramsPerServing: 355 },
  { names: ['에스프레소'], caloriesPer100g: 5, gramsPerServing: 30 },
  { names: ['콜드브루'], caloriesPer100g: 3, gramsPerServing: 355 },
  { names: ['아이스티', '복숭아아이스티'], caloriesPer100g: 35, gramsPerServing: 355 },
  { names: ['녹차라떼', '말차라떼'], caloriesPer100g: 70, gramsPerServing: 355 },
  { names: ['초코라떼', '핫초코', '아이스초코'], caloriesPer100g: 85, gramsPerServing: 355 },
  { names: ['밀크티'], caloriesPer100g: 60, gramsPerServing: 355 },
  { names: ['자몽에이드'], caloriesPer100g: 45, gramsPerServing: 355 },
  { names: ['레몬에이드'], caloriesPer100g: 50, gramsPerServing: 355 },
  { names: ['콜라', '코카콜라', '펩시'], caloriesPer100g: 45, gramsPerServing: 355 },
  {
    names: ['제로콜라', '콜라제로', '펩시제로', '제로콜라라임'],
    caloriesPer100g: 0,
    gramsPerServing: 355,
  },
  { names: ['사이다', '칠성사이다', '스프라이트'], caloriesPer100g: 43, gramsPerServing: 355 },
  { names: ['제로사이다', '사이다제로'], caloriesPer100g: 0, gramsPerServing: 355 },
  { names: ['환타', '미린다'], caloriesPer100g: 48, gramsPerServing: 355 },
  { names: ['식혜'], caloriesPer100g: 65, gramsPerServing: 250 },
  { names: ['수정과'], caloriesPer100g: 60, gramsPerServing: 250 },
  { names: ['보리차'], caloriesPer100g: 0, gramsPerServing: 500 },
  { names: ['생수', '물'], caloriesPer100g: 0, gramsPerServing: 500 },
  { names: ['오렌지주스', '오렌지쥬스'], caloriesPer100g: 45, gramsPerServing: 200 },
  { names: ['사과주스', '사과쥬스'], caloriesPer100g: 48, gramsPerServing: 200 },
  { names: ['소주', '참이슬', '처음처럼', '새로'], caloriesPer100g: 115, gramsPerServing: 360 },
  {
    names: ['맥주', '캔맥주', '카스', '테라', '생맥주'],
    caloriesPer100g: 43,
    gramsPerServing: 500,
  },
  { names: ['무알콜맥주'], caloriesPer100g: 15, gramsPerServing: 355 },
  { names: ['막걸리', '탁주', '동동주'], caloriesPer100g: 55, gramsPerServing: 750 },
  { names: ['와인', '레드와인'], caloriesPer100g: 80, gramsPerServing: 150 },
  { names: ['화이트와인'], caloriesPer100g: 75, gramsPerServing: 150 },
  { names: ['청하', '정종', '사케'], caloriesPer100g: 95, gramsPerServing: 300 },

  // ---------------------------------------------------------
  // 13. 빵·과자 및 디저트류 (Breads, Cookies & Desserts)
  // ---------------------------------------------------------
  { names: ['식빵'], caloriesPer100g: 280, gramsPerServing: 35 },
  { names: ['바게트'], caloriesPer100g: 290, gramsPerServing: 100 },
  { names: ['모닝빵', '모닝롤'], caloriesPer100g: 310, gramsPerServing: 30 },
  { names: ['크로와상', '크로와상빵'], caloriesPer100g: 430, gramsPerServing: 50 },
  { names: ['베이글', '플레인베이글'], caloriesPer100g: 280, gramsPerServing: 100 },
  { names: ['단팥빵'], caloriesPer100g: 280, gramsPerServing: 100 },
  { names: ['소보로빵', '소보루빵'], caloriesPer100g: 340, gramsPerServing: 90 },
  { names: ['크림빵', '생크림빵'], caloriesPer100g: 320, gramsPerServing: 90 },
  { names: ['슈크림빵'], caloriesPer100g: 290, gramsPerServing: 80 },
  { names: ['피자빵', '소시지빵', '낙엽브레드'], caloriesPer100g: 310, gramsPerServing: 120 },
  { names: ['카스텔라', '카스테라'], caloriesPer100g: 320, gramsPerServing: 100 },
  { names: ['샌드위치', '클럽샌드위치'], caloriesPer100g: 220, gramsPerServing: 180 },
  { names: ['토스트', '햄치즈토스트'], caloriesPer100g: 280, gramsPerServing: 150 },
  { names: ['마카롱'], caloriesPer100g: 430, gramsPerServing: 25 },
  { names: ['초코쿠키', '쿠키'], caloriesPer100g: 450, gramsPerServing: 30 },
  { names: ['생크림케이크', '조각케이크'], caloriesPer100g: 310, gramsPerServing: 100 },
  { names: ['치즈케이크'], caloriesPer100g: 350, gramsPerServing: 80 },
  { names: ['초코케이크'], caloriesPer100g: 370, gramsPerServing: 100 },
  { names: ['브라우니'], caloriesPer100g: 450, gramsPerServing: 60 },
  { names: ['와플'], caloriesPer100g: 290, gramsPerServing: 100 },
  { names: ['츄러스'], caloriesPer100g: 360, gramsPerServing: 50 },
  { names: ['스콘'], caloriesPer100g: 390, gramsPerServing: 70 },
  { names: ['도넛', '도너츠', '크리스피도넛'], caloriesPer100g: 380, gramsPerServing: 60 },
  { names: ['붕어빵', '잉어빵', '팥붕어빵'], caloriesPer100g: 220, gramsPerServing: 50 },
  { names: ['슈크림붕어빵', '슈붕'], caloriesPer100g: 230, gramsPerServing: 50 },
  { names: ['호떡', '꿀호떡'], caloriesPer100g: 320, gramsPerServing: 100 },
  { names: ['군고구마', '찐고구마'], caloriesPer100g: 130, gramsPerServing: 150 },
  { names: ['군밤', '찐밤'], caloriesPer100g: 160, gramsPerServing: 100 },
  { names: ['감자칩', '포테이토칩'], caloriesPer100g: 530, gramsPerServing: 60 },
  { names: ['초코파이'], caloriesPer100g: 470, gramsPerServing: 35 },
  { names: ['새우깡'], caloriesPer100g: 500, gramsPerServing: 90 },
  { names: ['빼빼로'], caloriesPer100g: 480, gramsPerServing: 50 },
  { names: ['팝콘'], caloriesPer100g: 480, gramsPerServing: 50 },

  // ---------------------------------------------------------
  // 14. 과일·채소 및 견과류 (Fruits, Vegetables & Nuts)
  // ---------------------------------------------------------
  { names: ['사과'], caloriesPer100g: 52, gramsPerServing: 240 },
  { names: ['바나나'], caloriesPer100g: 90, gramsPerServing: 120 },
  { names: ['배'], caloriesPer100g: 48, gramsPerServing: 300 },
  { names: ['단감', '감'], caloriesPer100g: 55, gramsPerServing: 200 },
  { names: ['귤', '밀감', '감귤'], caloriesPer100g: 40, gramsPerServing: 100 },
  { names: ['오렌지'], caloriesPer100g: 45, gramsPerServing: 200 },
  { names: ['포도', '캠벨포도'], caloriesPer100g: 60, gramsPerServing: 200 },
  { names: ['샤인머스캣', '샤인머스켓'], caloriesPer100g: 65, gramsPerServing: 200 },
  { names: ['딸기'], caloriesPer100g: 35, gramsPerServing: 150 },
  { names: ['수박'], caloriesPer100g: 30, gramsPerServing: 250 },
  { names: ['참외'], caloriesPer100g: 35, gramsPerServing: 250 },
  { names: ['복숭아', '백도', '황도'], caloriesPer100g: 40, gramsPerServing: 200 },
  { names: ['자두'], caloriesPer100g: 40, gramsPerServing: 80 },
  { names: ['토마토'], caloriesPer100g: 20, gramsPerServing: 200 },
  { names: ['방울토마토', '방토'], caloriesPer100g: 18, gramsPerServing: 150 },
  { names: ['아보카도'], caloriesPer100g: 160, gramsPerServing: 150 },
  { names: ['아몬드'], caloriesPer100g: 580, gramsPerServing: 30 },
  { names: ['호두'], caloriesPer100g: 650, gramsPerServing: 30 },
  { names: ['캐슈넛', '캐슈너트'], caloriesPer100g: 570, gramsPerServing: 30 },
  { names: ['땅콩'], caloriesPer100g: 560, gramsPerServing: 30 },
  { names: ['하루견과', '믹스넛'], caloriesPer100g: 550, gramsPerServing: 20 },
  { names: ['고구마'], caloriesPer100g: 130, gramsPerServing: 150 },
  { names: ['감자', '찐감자'], caloriesPer100g: 75, gramsPerServing: 150 },
  { names: ['옥수수', '찐옥수수'], caloriesPer100g: 130, gramsPerServing: 150 },
  { names: ['단호박', '찐단호박'], caloriesPer100g: 70, gramsPerServing: 150 },
  { names: ['샐러드', '채소샐러드', '야채샐러드'], caloriesPer100g: 40, gramsPerServing: 200 },
  { names: ['닭가슴살샐러드'], caloriesPer100g: 75, gramsPerServing: 250 },
  { names: ['리코타치즈샐러드'], caloriesPer100g: 110, gramsPerServing: 250 },

  // ---------------------------------------------------------
  // 15. 유제품·계란 및 기타 (Dairy, Eggs & Others)
  // ---------------------------------------------------------
  { names: ['우유', '흰우유'], caloriesPer100g: 60, gramsPerServing: 200 },
  { names: ['저지방우유'], caloriesPer100g: 40, gramsPerServing: 200 },
  { names: ['두유'], caloriesPer100g: 55, gramsPerServing: 190 },
  {
    names: ['요거트', '요구르트', '떠먹는요거트', '요플레'],
    caloriesPer100g: 70,
    gramsPerServing: 100,
  },
  { names: ['그릭요거트'], caloriesPer100g: 95, gramsPerServing: 100 },
  { names: ['액상요구르트', '야쿠르트'], caloriesPer100g: 65, gramsPerServing: 65 },
  { names: ['체다치즈', '슬라이스치즈'], caloriesPer100g: 350, gramsPerServing: 20 },
  { names: ['모짜렐라치즈', '피자치즈'], caloriesPer100g: 300, gramsPerServing: 100 },
  { names: ['스트링치즈'], caloriesPer100g: 310, gramsPerServing: 20 },
  { names: ['버터'], caloriesPer100g: 720, gramsPerServing: 10 },
  {
    names: ['계란후라이', '계란프라이', '달걀후라이', '달걀프라이'],
    caloriesPer100g: 180,
    gramsPerServing: 50,
  },
  { names: ['삶은계란', '삶은달걀'], caloriesPer100g: 145, gramsPerServing: 50 },
  { names: ['구운계란', '맥반석계란'], caloriesPer100g: 150, gramsPerServing: 50 },
  { names: ['두부', '생두부'], caloriesPer100g: 80, gramsPerServing: 150 },
  { names: ['유부'], caloriesPer100g: 350, gramsPerServing: 50 },
  { names: ['곤약'], caloriesPer100g: 10, gramsPerServing: 100 },
  { names: ['도토리묵'], caloriesPer100g: 45, gramsPerServing: 100 },
  { names: ['꿀'], caloriesPer100g: 300, gramsPerServing: 10 },
  { names: ['딸기잼', '잼'], caloriesPer100g: 250, gramsPerServing: 20 },
];

async function main() {
  let count = 0;
  // 중복 삽입 및 데이터 무결성 보장을 위해 Set 자료구조로 정규화된 이름 필터링 진행
  const processedNames = new Set<string>();

  for (const food of FOODS) {
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
