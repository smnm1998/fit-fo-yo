import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

export function GET() {
  if (!API_URL) {
    console.error('[BFF] API_URL 환경변수가 비어있습니다.');
    return NextResponse.json({ message: '서버 설정 오류입니다.' }, { status: 500 });
  }
  return NextResponse.redirect(`${API_URL}/auth/google`);
}
