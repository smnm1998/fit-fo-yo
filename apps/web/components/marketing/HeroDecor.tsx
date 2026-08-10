'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';

// public 폴더의 3D dynamic-color 아이콘
const ICONS = [
  '/Fire.png',
  '/Green Salad.png',
  '/Red Apple.png',
  '/Glass Of Milk.png',
  '/Pill.png',
  '/Direct Hit.png',
  '/Hundred Points.png',
];

const SIZE = 22; // 아이콘 표시 크기(px)

export function HeroDecor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const badgeRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (window.matchMedia('(max-width: 767px)').matches) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const content =
      container.parentElement?.querySelector<HTMLElement>('[data-hero-content]') ?? null;
    const mouse = { x: -9999, y: -9999, inside: false };
    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    let w = container.clientWidth;
    let h = container.clientHeight;
    const particles = ICONS.map(() => ({
      x: rand(0, Math.max(1, w - SIZE)),
      y: rand(0, Math.max(1, h - SIZE)),
      vx: rand(-0.4, 0.4),
      vy: rand(-0.4, 0.4),
    }));

    const REPEL_R = 140;
    const REPEL_F = 0.8;
    const MIN = 0.12;
    const MAX = 2.6;
    let raf = 0;
    let started = false;

    const step = () => {
      const cr = container.getBoundingClientRect();
      let zone: { l: number; t: number; r: number; b: number } | null = null;
      if (content) {
        const er = content.getBoundingClientRect();
        const pad = 20;
        zone = {
          l: er.left - cr.left - pad,
          t: er.top - cr.top - pad,
          r: er.right - cr.left + pad,
          b: er.bottom - cr.top + pad,
        };
      }

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;

        // 섹션 바깥벽 반사
        if (p.x <= 0) {
          p.x = 0;
          p.vx = Math.abs(p.vx);
        } else if (p.x >= w - SIZE) {
          p.x = w - SIZE;
          p.vx = -Math.abs(p.vx);
        }
        if (p.y <= 0) {
          p.y = 0;
          p.vy = Math.abs(p.vy);
        } else if (p.y >= h - SIZE) {
          p.y = h - SIZE;
          p.vy = -Math.abs(p.vy);
        }

        // 커서 반발
        if (mouse.inside) {
          const dx = p.x + SIZE / 2 - mouse.x;
          const dy = p.y + SIZE / 2 - mouse.y;
          const dist = Math.hypot(dx, dy);
          if (dist < REPEL_R && dist > 0.01) {
            const force = ((REPEL_R - dist) / REPEL_R) * REPEL_F;
            p.vx += (dx / dist) * force;
            p.vy += (dy / dist) * force;
          }
        }

        // 콘텐츠 박스(글자·버튼) 충돌 = 벽
        if (zone && p.x < zone.r && p.x + SIZE > zone.l && p.y < zone.b && p.y + SIZE > zone.t) {
          const penL = p.x + SIZE - zone.l;
          const penR = zone.r - p.x;
          const penT = p.y + SIZE - zone.t;
          const penB = zone.b - p.y;
          const min = Math.min(penL, penR, penT, penB);
          if (min === penL) {
            p.x = zone.l - SIZE;
            p.vx = -Math.abs(p.vx);
          } else if (min === penR) {
            p.x = zone.r;
            p.vx = Math.abs(p.vx);
          } else if (min === penT) {
            p.y = zone.t - SIZE;
            p.vy = -Math.abs(p.vy);
          } else {
            p.y = zone.b;
            p.vy = Math.abs(p.vy);
          }
        }

        // 감쇠 + 최소/최대 속도
        p.vx *= 0.985;
        p.vy *= 0.985;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp < MIN) {
          const a = Math.random() * Math.PI * 2;
          p.vx += Math.cos(a) * 0.06;
          p.vy += Math.sin(a) * 0.06;
        } else if (sp > MAX) {
          p.vx = (p.vx / sp) * MAX;
          p.vy = (p.vy / sp) * MAX;
        }

        const el = badgeRefs.current[i];
        if (el) {
          el.style.transform = `translate(${p.x}px, ${p.y}px)`;
          if (!started) el.style.opacity = '1';
        }
      });
      started = true;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);

    const onMove = (e: MouseEvent) => {
      const r = container.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
    };
    const onResize = () => {
      w = container.clientWidth;
      h = container.clientHeight;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute left-1/2 top-0 h-72 w-[640px] -translate-x-1/2 rounded-full bg-emerald-400/10 blur-[120px] dark:bg-emerald-500/10" />
      {ICONS.map((src, i) => (
        <span
          key={src}
          ref={(el) => {
            badgeRefs.current[i] = el;
          }}
          className="absolute left-0 top-0 hidden opacity-0 md:block"
          style={{
            width: SIZE,
            height: SIZE,
            willChange: 'transform',
            transition: 'opacity 0.5s ease-out',
          }}
        >
          <Image
            src={src}
            alt=""
            width={SIZE}
            height={SIZE}
            className="h-full w-full drop-shadow-md"
          />
        </span>
      ))}
    </div>
  );
}
