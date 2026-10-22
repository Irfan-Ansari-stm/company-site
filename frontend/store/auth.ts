import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  email: string;
  display_name: string;
  first_name: string;
  last_name: string;
  role: string;
  isSuperAdmin?: boolean;
  avatar_url?: string;
  is_active: boolean;
  is_verified: boolean;
  two_factor_enabled: boolean;
  permissions: string[];
  roles: string[];
}

export interface DashboardModuleConfig {
  key: string;
  name: string;
  description?: string;
  icon?: string;
  is_client_available?: boolean;
  is_client_enabled?: boolean;
  widgets?: Array<{ key: string; name: string; enabled: boolean }>;
  actions?: string[];
  sort_order?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;
  clientModules: DashboardModuleConfig[];
  isClientPreview: boolean;

  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setClientModules: (modules: DashboardModuleConfig[]) => void;
  setClientPreview: (preview: boolean) => void;
  logout: () => void;

  isSuperAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
  hasAnyPermission: (permissions: string[]) => boolean;
  hasAllPermissions: (permissions: string[]) => boolean;
  hasRole: (role: string | string[]) => boolean;
  canAccessModule: (moduleKey: string) => boolean;
  canAccessWidget: (moduleKey: string, widgetKey: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,
      clientModules: [],
      isClientPreview: false,

      setAuth: (user, accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          } catch (_) {}
        }
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      setTokens: (accessToken, refreshToken) => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', refreshToken);
          } catch (_) {}
        }
        set({ accessToken, refreshToken });
      },

      setUser: (user) => set({ user }),

      setHasHydrated: (hasHydrated) => set({ hasHydrated }),

      setClientModules: (modules) => set({ clientModules: modules }),

      setClientPreview: (preview) => set({ isClientPreview: preview }),

      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
          } catch (_) {}
        }
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false, isClientPreview: false });
      },

      isSuperAdmin: () => {
        const { user, isClientPreview } = get();
        if (isClientPreview) return false;
        return user?.role === 'super_admin';
      },

      hasPermission: (permission: string) => {
        const { user, isClientPreview } = get();
        if (!user) return false;

        // If in Super Admin client-preview mode, simulate client permissions
        if (isClientPreview) {
          const clientAllowedPerms = [
            'dashboard.view',
            'dashboard.stats.view',
            'ticket.read',
            'ticket.reply',
            'invoice.read',
            'client.read',
            'project.read'
          ];
          return clientAllowedPerms.includes(permission);
        }

        // Sole Super Admin has universal bypass across the platform
        if (user.role === 'super_admin') return true;

        // Deny-by-default: check user assigned permissions
        return user.permissions?.includes(permission) ?? false;
      },

      hasAnyPermission: (permissions: string[]) => {
        const { hasPermission } = get();
        if (!permissions.length) return false;
        return permissions.some((perm) => hasPermission(perm));
      },

      hasAllPermissions: (permissions: string[]) => {
        const { hasPermission } = get();
        if (!permissions.length) return true;
        return permissions.every((perm) => hasPermission(perm));
      },

      hasRole: (role: string | string[]) => {
        const { user, isClientPreview } = get();
        if (!user) return false;
        if (isClientPreview) return role === 'client' || (Array.isArray(role) && role.includes('client'));
        const roles = Array.isArray(role) ? role : [role];
        return roles.includes(user.role);
      },

      canAccessModule: (moduleKey: string) => {
        const { user, clientModules, isClientPreview, isSuperAdmin, hasPermission } = get();
        if (!user) return false;
        if (isSuperAdmin()) return true;

        // In client mode or client preview mode, check module enabled in client configuration
        if (user.role === 'client' || isClientPreview) {
          const mod = clientModules.find((m) => m.key === moduleKey);
          return mod?.is_client_enabled ?? false;
        }

        // For other staff/manager roles, check if they have module permission
        return hasPermission(`${moduleKey}.read`) || hasPermission(`${moduleKey}.view`) || hasPermission(`${moduleKey}.manage`);
      },

      canAccessWidget: (moduleKey: string, widgetKey: string) => {
        const { user, clientModules, isClientPreview, isSuperAdmin } = get();
        if (!user) return false;
        if (isSuperAdmin()) return true;

        const mod = clientModules.find((m) => m.key === moduleKey);
        if (!mod || !mod.is_client_enabled) return false;

        const widget = mod.widgets?.find((w) => w.key === widgetKey);
        return widget ? widget.enabled : true;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
        clientModules: state.clientModules,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (state.accessToken && typeof window !== 'undefined') {
            try { localStorage.setItem('accessToken', state.accessToken); } catch (_) {}
          }
          if (state.refreshToken && typeof window !== 'undefined') {
            try { localStorage.setItem('refreshToken', state.refreshToken); } catch (_) {}
          }
          if (state.accessToken) {
            useAuthStore.setState({ isAuthenticated: true });
          }
          state.setHasHydrated(true);
        } else {
          if (typeof window !== 'undefined') {
            const token = localStorage.getItem('accessToken');
            if (token) {
              useAuthStore.setState({ isAuthenticated: true, accessToken: token });
            }
          }
          useAuthStore.getState().setHasHydrated(true);
        }
      },
    }
  )
);
