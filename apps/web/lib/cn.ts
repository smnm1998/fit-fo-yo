import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** 조건부 클래스 결합 + Tailwind 충돌 병합 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
