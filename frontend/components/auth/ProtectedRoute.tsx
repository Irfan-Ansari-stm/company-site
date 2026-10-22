'use client';

import React from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { Button, PageLoader } from '@/components/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  permission?: string;
  permissions?: string[];
  requireAll?: boolean;
  role?: string | string[];
  requireSuperAdmin?: boolean;
  moduleKey?: string;
}

export function ProtectedRoute({
  children,
  permission,
  permissions = [],
  requireAll = false,
  role,
  requireSuperAdmin = false,
  moduleKey,
}: ProtectedRouteProps) {
  const {
    user,
    isAuthenticated,
    hasHydrated,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    canAccessModule,
  } = useAuthStore();

  if (!hasHydrated) {
    return <PageLoader />;
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Required</h2>
        <p className="text-slate-500 max-w-md mb-6">
          You must be signed in to view this protected resource.
        </p>
        <Link href="/auth/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  // Sole Super Admin has blanket access across all features
  if (isSuperAdmin()) {
    return <>{children}</>;
  }

  // Check Super Admin requirement
  if (requireSuperAdmin && !isSuperAdmin()) {
    return <AccessDeniedScreen reason="This section is strictly restricted to the Super Admin." />;
  }

  // Check Role requirement
  if (role && !hasRole(role)) {
    return <AccessDeniedScreen reason={`Your account role (${user.role}) is not authorized for this section.`} />;
  }

  // Check Module access requirement
  if (moduleKey && !canAccessModule(moduleKey)) {
    return <AccessDeniedScreen reason={`The '${moduleKey}' module is currently disabled or restricted for your role.`} />;
  }

  // Check Permissions
  const checkList = permission ? [permission, ...permissions] : permissions;
  if (checkList.length > 0) {
    const authorized = requireAll
      ? hasAllPermissions(checkList)
      : hasAnyPermission(checkList);

    if (!authorized) {
      return (
        <AccessDeniedScreen
          reason="You do not possess the required permission privileges to view this section."
          requiredPermissions={checkList}
        />
      );
    }
  }

  return <>{children}</>;
}

function AccessDeniedScreen({
  reason,
  requiredPermissions,
}: {
  reason: string;
  requiredPermissions?: string[];
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-2xl border border-slate-200/80 shadow-sm m-4">
      <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-5 shadow-inner">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied</h2>
      <p className="text-slate-600 max-w-lg mb-4 text-sm leading-relaxed">{reason}</p>

      {requiredPermissions && requiredPermissions.length > 0 && (
        <div className="mb-6 p-3 bg-slate-50 border border-slate-200 rounded-lg text-left max-w-md w-full">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Required Permission(s):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {requiredPermissions.map((p) => (
              <span
                key={p}
                className="px-2 py-0.5 bg-slate-200 text-slate-800 rounded font-mono text-xs font-medium"
              >
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <Link href="/dashboard">
          <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>
            Return to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default ProtectedRoute;

