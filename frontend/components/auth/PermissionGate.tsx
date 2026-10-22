'use client';

import React from 'react';
import { useAuthStore } from '@/store/auth';

interface PermissionGateProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  fallback?: React.ReactNode;
}

/**
 * Conditionally renders children if the authenticated user possesses
 * the specified permission(s). Super Admin automatically bypasses all checks.
 */
export function PermissionGate({
  children,
  permission,
  permissions = [],
  requireAll = false,
  fallback = null,
}: PermissionGateProps) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, isSuperAdmin, hasHydrated } = useAuthStore();

  if (!hasHydrated) return null;

  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  const checkList = permission ? [permission, ...permissions] : permissions;

  if (!checkList.length) {
    return <>{children}</>;
  }

  const hasAccess = requireAll
    ? hasAllPermissions(checkList)
    : hasAnyPermission(checkList);

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

export default PermissionGate;

