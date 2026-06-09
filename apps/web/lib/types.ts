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
