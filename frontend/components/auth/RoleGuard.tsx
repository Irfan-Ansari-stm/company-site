'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth';

interface RoleGuardProps {
  children: React.ReactNode;
  role?: string | string[];
  requireSuperAdmin?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children if the authenticated user has the specified role(s)
 * or if requireSuperAdmin is specified.
 */
export function RoleGuard({
  children,
  role,
  requireSuperAdmin = false,
  fallback = null,
}: RoleGuardProps) {
  const { user, isSuperAdmin, hasRole, hasHydrated } = useAuthStore();

  if (!hasHydrated || !user) return null;

  if (requireSuperAdmin) {
    return isSuperAdmin() ? <>{children}</> : <>{fallback}</>;
  }

  // Super admin satisfies any administrative role check
  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default RoleGuard;

