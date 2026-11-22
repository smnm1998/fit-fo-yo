'use client';

import { dayKeyKST } from '@/lib/date';
import type { RecordDto } from '@/lib/types';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent } from 'react';

const LONG_PRESS_MS = 150; // 드래그 최소 시작 시간
const MOVE_TOLERANCE_PX = 6; // 누르는 동안 이만큼 움직이면 의도가 아니라고 보고 취소
const GHOST_SCALE = 1.05; // 커서가 고스트 칩을 가리지 않도록 살짝 틀어서 그림

export type RecordDragState = {
  record: RecordDto;
  fromDay: string;
  overDay: string | null;
  ghostX: number;
  ghostY: number;
  width: number;
};

export type ChipDragBindings = {
  draggingId: string | null;
  onPointerDown: (e: ReactPointerEvent<HTMLElement>, record: RecordDto) => void;
  onClick: (e: ReactMouseEvent<HTMLElement>) => void;
};

function ghostTransform(x: number, y: number): string {
  return `translate(${x}px, ${y}px) scale(${GHOST_SCALE})`;
}

/**
 * 좌표 아래의 날짜 칸을 찾음
 * 달 밖 칸에는 속성이 없어 null
 */
function dayAt(x: number, y: number): string | null {
  const el = document.elementFromPoint(x, y);
  return el?.closest<HTMLElement>('[data-drop-day]')?.dataset.dropDay ?? null;
}

export function useRecordDrag(onDrop: (record: RecordDto, today: string) => void) {
  const [drag, setDrag] = useState<RecordDragState | null>(null);
  const ghostRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<() => void | null>(null);
  const suppressClickRef = useRef(false);

  const stop = useCallback(() => {
    cleanupRef.current?.();
    cleanupRef.current = null;
    setDrag(null);
  }, []);

  // 언마운트 시 window 리스너 & 타이머 정리
  useEffect(() => stop, [stop]);

  // 드래그 중에는 grabbing 커서 + 텍스트 선택 방지
  const isDragging = drag !== null;
  useEffect(() => {
    if (!isDragging) return;
    document.body.classList.add('cursor-grabbing', 'select-none');
    return () => document.body.classList.remove('cursor-grabbing', 'select-none');
  }, [isDragging]);

  function onPointerDown(e: ReactPointerEvent<HTMLElement>, record: RecordDto) {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;

    stop();
    suppressClickRef.current = false;

    const startX = e.clientX;
    const startY = e.clientY;
    const rect = e.currentTarget.getBoundingClientRect();
    const grabDX = startX - rect.left;
    const grabDY = startY - rect.top;
    const width = rect.width;
    const fromDay = dayKeyKST(record.recordedAt);
    let active = false;

    const timer = window.setTimeout(() => {
      active = true;
      suppressClickRef.current = true;
      setDrag({
        record,
        fromDay,
        overDay: fromDay,
        ghostX: startX - grabDX,
        ghostY: startY - grabDY,
        width,
      });
    }, LONG_PRESS_MS);

    const onMove = (ev: PointerEvent) => {
      if (!active) {
        if (Math.hypot(ev.clientX - startX, ev.clientY - startY) > MOVE_TOLERANCE_PX) stop();
        return;
      }

      if (ghostRef.current) {
        ghostRef.current.style.transform = ghostTransform(ev.clientX - grabDX, ev.clientY - grabDY);
      }
      const overDay = dayAt(ev.clientX, ev.clientY);
      setDrag((d) => (d && d.overDay !== overDay ? { ...d, overDay } : d));
    };

    const onUp = (ev: PointerEvent) => {
      if (active) {
        const day = dayAt(ev.clientX, ev.clientY);
        if (day && day !== fromDay) onDrop(record, day);
      }
      stop();
    };

    const onKeyDown = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') stop();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('keydown', onKeyDown);
    cleanupRef.current = () => {
      window.clearTimeout(timer);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('keydown', onKeyDown);
    };
  }

  /** 드래그로 끝난 누름 뒤에 따라오는 click은 팝오버를 열지 않게 차단 */
  function onClick(e: ReactMouseEvent<HTMLElement>) {
    if (!suppressClickRef.current) return;
    suppressClickRef.current = false;
    e.preventDefault();
  }

  const chip: ChipDragBindings = {
    draggingId: drag?.record.id ?? null,
    onPointerDown,
    onClick,
  };

  return {
    drag,
    ghostRef,
    ghostStyle: drag
      ? { transform: ghostTransform(drag.ghostX, drag.ghostY), width: drag.width }
      : undefined,
    chip,
  };
}
