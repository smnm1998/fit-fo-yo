export type ApiUser = {
  id: string;
  email?: string | null;
  nickname?: string | null;
  isGuest: boolean;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type DietItem = {
  id: string;
  name: string;
  mealType?: string | null;
  quantity?: number | null;
  unit?: string | null;
  calories?: number | null;
  carbs?: number | null;
  protein?: number | null;
  fat?: number | null;
  estimated: boolean;
};

export type ExerciseItem = {
  id: string;
  name: string;
  durationMinutes?: number | null;
  intensity?: string | null;
  caloriesBurned?: number | null;
  estimated: boolean;
};

export type RecordDto = {
  id: string;
  type: 'DIET' | 'EXERCISE';
  rawInput: string;
  recordedAt: string;
  createdAt: string;
  dietItems: DietItem[];
  exerciseItems: ExerciseItem[];
};

export type RecommendationFocus = 'diet' | 'exercise' | 'balanced';

export type DailySummary = {
  totalCalories: number;
  carbs: number;
  protein: number;
  fat: number;
  exerciseMinutes: number;
  caloriesBurned: number;
  dietCount: number;
  exerciseCount: number;
};

export type RecommendationPayload = {
  message: string;
  focus: RecommendationFocus;
  summary: DailySummary;
};

export type RecommendationDto = {
  id: string;
  forDate: string;
  payload: RecommendationPayload;
};
