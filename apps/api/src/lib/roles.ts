export const ADMIN_ROLES = ['ADMIN', 'SCHOOL_ADMIN', 'SUPER_ADMIN'] as const;

export function isAdminRole(role?: string | null): boolean {
  return !!role && ADMIN_ROLES.includes(role as (typeof ADMIN_ROLES)[number]);
}

export function normalizeRole(role?: string | null): string | undefined {
  if (!role) return undefined;
  if (role === 'ADMIN') return 'SCHOOL_ADMIN';
  return role;
}
