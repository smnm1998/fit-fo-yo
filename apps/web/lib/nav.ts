import { BarChart3, CalendarDays, FileText, Target, Users, type LucideIcon } from 'lucide-react';

export type NavItem = { href: string; label: string; Icon: LucideIcon };

/** 데스크탑 사이드바 & 모바일 드롭다운 메뉴 공용 */
export const NAV: NavItem[] = [
  { href: '/dashboard', label: '캘린더', Icon: CalendarDays },
  { href: '/stats', label: '통계', Icon: BarChart3 },
];

export const SOON: { label: string; Icon: LucideIcon }[] = [
  { label: '목표 관리', Icon: Target },
  { label: '리포트', Icon: FileText },
  { label: '커뮤니티', Icon: Users },
];
