import { ImageResponse } from 'next/og';

export const alt = 'FitFoYo — AI 식단·운동 기록 캘린더';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 28,
        background: '#1a1a1a',
        color: '#ededed',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          fontSize: 26,
          letterSpacing: 6,
          color: '#9a9a9a',
        }}
      >
        <span style={{ width: 14, height: 14, borderRadius: 999, background: '#10b981' }} />
        AI HEALTH CALENDAR
      </div>

      <div style={{ display: 'flex', fontSize: 150, fontWeight: 800, letterSpacing: -5 }}>
        FitFoYo
      </div>

      <div
        style={{
          display: 'flex',
          fontSize: 34,
          color: '#9a9a9a',
          maxWidth: 840,
          textAlign: 'center',
        }}
      >
        Log meals &amp; workouts in plain words — AI handles the calories.
      </div>
    </div>,
    { ...size },
  );
}
