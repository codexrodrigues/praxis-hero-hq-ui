import type { PraxisNavGroup } from '@praxisui/core';
import { HERO_PAGE_GROUPS, type HeroNavItem } from './page-definitions';

export type NavItem = HeroNavItem;

export interface NavGroup extends PraxisNavGroup {
  readonly label: string;
  readonly domainKey: typeof HERO_PAGE_GROUPS[number]['domainKey'];
  readonly items: NavItem[];
}

export const HERO_NAVIGATION: NavGroup[] = HERO_PAGE_GROUPS.map((group) => ({
  label: group.label,
  domainKey: group.domainKey,
  items: group.items.map(({ page: _page, ...item }) => ({
    ...item,
    ...(item.clearance ? { badge: item.clearance, badgeTone: 'warning' as const } : {}),
  })),
}));

export const ALL_NAV_ITEMS: readonly NavItem[] = HERO_NAVIGATION.flatMap((group) => group.items);
