import { NextResponse } from 'next/server';

const API_URL = process.env.API_URL;

export function GET() {
  return NextResponse.redirect(`${API_URL}/auth/google`);
}
