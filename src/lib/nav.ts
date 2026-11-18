import type { Role } from './types';

export type NavIcon =
  | 'home'
  | 'plus'
  | 'list'
  | 'bell'
  | 'user'
  | 'inbox'
  | 'map'
  | 'case'
  | 'history'
  | 'scan'
  | 'stethoscope'
  | 'file'
  | 'calendar'
  | 'truck'
  | 'warehouse'
  | 'paw'
  | 'users'
  | 'building'
  | 'chart'
  | 'scroll'
  | 'shield';

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  match?: string[]; // extra path prefixes that should highlight this item
}

export type Section = 'community' | 'operations' | 'veterinary' | 'gaushala' | 'admin' | 'shared';

const SCAN: NavItem = { href: '/operations/scan', label: 'Scan a tag', icon: 'scan' };
const PROFILE: NavItem = { href: '/community/profile', label: 'My profile', icon: 'user' };
const NEW: NavItem = { href: '/community/report/new', label: 'New sighting', icon: 'plus' };

export const NAV: Record<Exclude<Section, 'shared'>, NavItem[]> = {
  community: [
    { href: '/community/dashboard', label: 'Overview', icon: 'home' },
    NEW,
    { href: '/community/reports', label: 'My reports', icon: 'list', match: ['/community/reports'] },
    { href: '/community/notifications', label: 'Notifications', icon: 'bell' },
    { href: '/community/profile', label: 'My profile', icon: 'user' },
  ],
  operations: [
    { href: '/operations/dashboard', label: 'Overview', icon: 'home' },
    { href: '/operations/inbox', label: 'Incoming reports', icon: 'inbox' },
    { href: '/operations/map', label: 'Sighting map', icon: 'map' },
    { href: '/operations/cases', label: 'Assigned cases', icon: 'case', match: ['/operations/cases'] },
    { href: '/operations/history', label: 'Case history', icon: 'history' },
    SCAN,
    NEW,
    PROFILE,
  ],
  veterinary: [
    { href: '/veterinary/dashboard', label: 'Overview', icon: 'home' },
    { href: '/veterinary/cases', label: 'Assigned examinations', icon: 'stethoscope' },
    { href: '/veterinary/medical-records', label: 'Medical records', icon: 'file' },
    { href: '/veterinary/follow-ups', label: 'Follow-ups', icon: 'calendar' },
    SCAN,
    NEW,
    PROFILE,
  ],
  gaushala: [
    { href: '/gaushala/dashboard', label: 'Shelter overview', icon: 'warehouse' },
    { href: '/gaushala/assignments', label: 'Rescue assignments', icon: 'truck' },
    { href: '/gaushala/intake', label: 'Animal intake', icon: 'plus' },
    { href: '/gaushala/animals', label: 'Shelter records', icon: 'paw' },
    SCAN,
    NEW,
    PROFILE,
  ],
  admin: [
    { href: '/admin/dashboard', label: 'System overview', icon: 'home' },
    { href: '/admin/users', label: 'User management', icon: 'users' },
    { href: '/admin/organizations', label: 'Organisations', icon: 'building' },
    { href: '/admin/animals', label: 'Animal database', icon: 'paw', match: ['/animal/'] },
    { href: '/admin/cases', label: 'Reports & cases', icon: 'case', match: ['/operations/cases/'] },
    { href: '/admin/analytics', label: 'Analytics', icon: 'chart' },
    { href: '/admin/audit-logs', label: 'Audit logs', icon: 'scroll' },
    PROFILE,
  ],
};

export const ROLE_SECTION: Record<Role, Exclude<Section, 'shared'>> = {
  community: 'community',
  operations: 'operations',
  vet: 'veterinary',
  gaushala: 'gaushala',
  admin: 'admin',
};

export const SECTION_LABEL: Record<Exclude<Section, 'shared'>, string> = {
  community: 'Community',
  operations: 'Operations',
  veterinary: 'Veterinary',
  gaushala: 'Gaushala',
  admin: 'Administration',
};

export const SECTION_HOME: Record<Exclude<Section, 'shared'>, string> = {
  community: '/community/dashboard',
  operations: '/operations/dashboard',
  veterinary: '/veterinary/dashboard',
  gaushala: '/gaushala/dashboard',
  admin: '/admin/dashboard',
};
