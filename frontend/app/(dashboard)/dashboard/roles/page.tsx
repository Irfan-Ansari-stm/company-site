'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Badge, Modal, Input, Textarea
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { formatDate, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Shield, Plus, Edit2, Trash2, Key, CheckSquare, Square,
  Search, AlertTriangle, Lock, Users, ArrowRight, CheckCircle2
} from 'lucide-react';

export default function RolesManagementPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [permissionsRole, setPermissionsRole] = useState<any>(null);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);
  const [permSearch, setPermSearch] = useState('');

  // Form states
  const [roleForm, setRoleForm] = useState({
    name: '',
    slug: '',
    description: '',
    is_active: true,
  });

  // Fetch all roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery({
    queryKey: ['roles-list'],
    queryFn: () => usersApi.getRoles().then((r) => r.data.data),
  });

  // Fetch all available system permissions
  const { data: allPermissions = [], isLoading: permsLoading } = useQuery({
    queryKey: ['permissions-catalog'],
    queryFn: () => usersApi.getPermissions().then((r) => r.data.data),
  });

  // Create role mutation
  const createRoleMutation = useMutation({
    mutationFn: (data: any) => usersApi.createRole(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles-list'] });
      setShowCreateModal(false);
      setRoleForm({ name: '', slug: '', description: '', is_active: true });
      toast.success('Custom role created successfully');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });

  // Update role mutation
  const updateRoleMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.updateRole(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles-list'] });
      setEditingRole(null);
      toast.success('Role updated successfully');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteRole(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles-list'] });
      toast.success('Role deleted successfully');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });

  // Save permissions mutation
  const savePermissionsMutation = useMutation({
    mutationFn: ({ roleId, permissionIds }: { roleId: string; permissionIds: string[] }) =>
      usersApi.updateRolePermissions(roleId, permissionIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['roles-list'] });
      setPermissionsRole(null);
      toast.success('Role permissions updated successfully');
    },
    onError: (err: any) => toast.error(extractApiError(err)),
  });

  // Open Permission Matrix drawer/modal
  const openPermissionsModal = async (role: any) => {
    setPermissionsRole(role);
    setPermSearch('');
    try {
      const res = await usersApi.getRolePermissions(role.id);
      const perms = res.data.data || [];
      setSelectedPermIds(perms.map((p: any) => p.id));
    } catch {
      setSelectedPermIds([]);
    }
  };

  // Group permissions by module
  const permissionsByModule = useMemo(() => {
    const map: Record<string, any[]> = {};
    const filtered = (allPermissions as any[]).filter((p) => {
      if (!permSearch) return true;
      const s = permSearch.toLowerCase();
      return (
        p.name?.toLowerCase().includes(s) ||
        p.slug?.toLowerCase().includes(s) ||
        p.module?.toLowerCase().includes(s)
      );
    });

    filtered.forEach((p) => {
      const mod = p.module || 'other';
      if (!map[mod]) map[mod] = [];
      map[mod].push(p);
    });
    return map;
  }, [allPermissions, permSearch]);

  const togglePermission = (id: string) => {
    setSelectedPermIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectModuleAll = (moduleKey: string) => {
    const modPerms = permissionsByModule[moduleKey] || [];
    const modIds = modPerms.map((p) => p.id);
    setSelectedPermIds((prev) => Array.from(new Set([...prev, ...modIds])));
  };

  const clearModuleAll = (moduleKey: string) => {
    const modPerms = permissionsByModule[moduleKey] || [];
    const modIds = new Set(modPerms.map((p) => p.id));
    setSelectedPermIds((prev) => prev.filter((id) => !modIds.has(id)));
  };

  // Filtered roles list
  const filteredRoles = useMemo(() => {
    if (!search) return roles;
    const s = search.toLowerCase();
    return roles.filter(
      (r: any) =>
        r.name?.toLowerCase().includes(s) ||
        r.slug?.toLowerCase().includes(s) ||
        r.description?.toLowerCase().includes(s)
    );
  }, [roles, search]);

  return (
    <ProtectedRoute requireSuperAdmin>
      <DashboardLayout
        title="Dynamic Roles & Permissions"
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Roles & Permissions' }]}
      >
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-6 h-6 text-indigo-400" />
                <h1 className="text-xl font-bold">Role-Based Access Control (RBAC)</h1>
              </div>
              <p className="text-slate-300 text-sm max-w-2xl">
                Centrally configure platform roles, assign fine-grained permissions, and define module access.
                All changes take effect immediately across all sessions.
              </p>
            </div>
            <Button
              icon={<Plus className="w-4 h-4" />}
              onClick={() => {
                setRoleForm({ name: '', slug: '', description: '', is_active: true });
                setShowCreateModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shrink-0"
            >
              Create New Role
            </Button>
          </div>

          {/* Roles Table Card */}
          <Card padding={false}>
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search roles by name or slug…"
                className="w-full sm:w-80"
              />
              <div className="text-xs text-slate-500">
                Total Roles: <span className="font-semibold text-slate-800">{filteredRoles.length}</span>
              </div>
            </div>

            <Table
              headers={['Role Name', 'Identifier (Slug)', 'Assigned Users', 'Permissions', 'Status', 'Last Updated', 'Actions']}
              loading={rolesLoading}
              empty={!filteredRoles.length}
              emptyMessage="No roles found matching your search."
            >
              {filteredRoles.map((role: any) => {
                const isSuper = role.slug === 'super_admin';
                const isClient = role.slug === 'client';
                const isProtected = role.is_system || isSuper || isClient;

                return (
                  <Tr key={role.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                            isSuper
                              ? 'bg-amber-100 text-amber-800'
                              : isClient
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-indigo-100 text-indigo-800'
                          }`}
                        >
                          <Shield className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900">{role.name}</span>
                            {isSuper && <Badge variant="warning">Sole Super Admin</Badge>}
                            {isClient && <Badge variant="success">Default Public Role</Badge>}
                            {role.is_system && !isSuper && !isClient && <Badge>System Role</Badge>}
                          </div>
                          {role.description && (
                            <p className="text-xs text-slate-500 line-clamp-1 max-w-sm">{role.description}</p>
                          )}
                        </div>
                      </div>
                    </Td>

                    <Td>
                      <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs">
                        {role.slug}
                      </code>
                    </Td>

                    <Td>
                      <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>{role.user_count || 0}</span>
                      </div>
                    </Td>

                    <Td>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700">
                        {isSuper ? 'Universal (All 55+)' : `${role.permission_count || 0} granted`}
                      </span>
                    </Td>

                    <Td>
                      <StatusBadge status={role.is_active ? 'active' : 'inactive'} />
                    </Td>

                    <Td className="text-xs text-slate-500">
                      {formatDate(role.updated_at || role.created_at)}
                    </Td>

                    <Td>
                      <div className="flex items-center gap-1">
                        {/* Configure permissions button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Key className="w-3.5 h-3.5 text-indigo-600" />}
                          onClick={() => openPermissionsModal(role)}
                          title="Configure Permissions"
                        >
                          Permissions
                        </Button>

                        {/* Edit Role Metadata */}
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
                          onClick={() => {
                            setEditingRole(role);
                            setRoleForm({
                              name: role.name,
                              slug: role.slug,
                              description: role.description || '',
                              is_active: role.is_active,
                            });
                          }}
                          title="Edit Role"
                        />

                        {/* Delete Role (only if not protected system role) */}
                        {!isProtected && (
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete custom role '${role.name}'?`)) {
                                deleteRoleMutation.mutate(role.id);
                              }
                            }}
                            title="Delete Role"
                          />
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Table>
          </Card>

          {/* CREATE ROLE MODAL */}
          <Modal
            open={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            title="Create Custom Role"
            size="md"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createRoleMutation.mutate(roleForm);
              }}
              className="space-y-4"
            >
              <Input
                label="Role Display Name"
                placeholder="e.g. Compliance Officer"
                value={roleForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setRoleForm((prev) => ({
                    ...prev,
                    name: val,
                    slug: prev.slug === '' ? val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') : prev.slug,
                  }));
                }}
                required
              />

              <Input
                label="Unique Slug Identifier"
                placeholder="e.g. compliance_officer"
                value={roleForm.slug}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                hint="Used internally for role definitions and API policies"
                required
              />

              <Textarea
                label="Role Description"
                placeholder="Describe the responsibilities and scope of this role..."
                value={roleForm.description}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="create_is_active"
                  checked={roleForm.is_active}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="create_is_active" className="text-sm font-medium text-slate-700">
                  Role is Active
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={createRoleMutation.isPending}>
                  Create Role
                </Button>
              </div>
            </form>
          </Modal>

          {/* EDIT ROLE MODAL */}
          <Modal
            open={!!editingRole}
            onClose={() => setEditingRole(null)}
            title={`Edit Role: ${editingRole?.name}`}
            size="md"
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateRoleMutation.mutate({
                  id: editingRole.id,
                  data: {
                    name: roleForm.name,
                    description: roleForm.description,
                    is_active: roleForm.is_active,
                  },
                });
              }}
              className="space-y-4"
            >
              <Input
                label="Role Display Name"
                value={roleForm.name}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                required
              />

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Role Slug Identifier</label>
                <input
                  disabled
                  value={editingRole?.slug || ''}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg text-slate-500 text-sm font-mono cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400">Slugs of existing roles cannot be changed.</p>
              </div>

              <Textarea
                label="Role Description"
                value={roleForm.description}
                onChange={(e) => setRoleForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />

              {editingRole?.slug !== 'super_admin' && editingRole?.slug !== 'client' && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="edit_is_active"
                    checked={roleForm.is_active}
                    onChange={(e) => setRoleForm((prev) => ({ ...prev, is_active: e.target.checked }))}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <label htmlFor="edit_is_active" className="text-sm font-medium text-slate-700">
                    Role is Active (if deactivated, assigned users immediately lose access)
                  </label>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setEditingRole(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={updateRoleMutation.isPending}>
                  Save Changes
                </Button>
              </div>
            </form>
          </Modal>

          {/* PERMISSIONS ASSIGNMENT MODAL */}
          <Modal
            open={!!permissionsRole}
            onClose={() => setPermissionsRole(null)}
            title={`Configure Permissions — ${permissionsRole?.name}`}
            size="xl"
          >
            <div className="space-y-4">
              {permissionsRole?.slug === 'super_admin' ? (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Sole Super Admin Access Policy</p>
                    <p className="text-xs text-amber-700 mt-1">
                      The designated Sole Super Admin possesses universal platform bypass across all modules,
                      endpoints, components, and actions. Manual permission assignment is neither required nor applicable.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="relative flex-1 w-full sm:w-auto">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search permissions by name, module, or slug…"
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                      <span>Selected:</span>
                      <Badge variant="info" className="text-xs font-bold">
                        {selectedPermIds.length} / {allPermissions.length}
                      </Badge>
                    </div>
                  </div>

                  {/* Modules Grouped Matrix */}
                  <div className="max-h-[55vh] overflow-y-auto space-y-4 pr-1">
                    {Object.entries(permissionsByModule).map(([moduleKey, perms]) => {
                      const allSelectedInMod = perms.every((p) => selectedPermIds.includes(p.id));
                      const someSelectedInMod = perms.some((p) => selectedPermIds.includes(p.id));

                      return (
                        <div
                          key={moduleKey}
                          className="border border-slate-200 rounded-xl p-4 bg-white shadow-xs space-y-3"
                        >
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                {moduleKey} ({perms.length})
                              </h4>
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                              <button
                                type="button"
                                onClick={() => selectModuleAll(moduleKey)}
                                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1"
                              >
                                <CheckSquare className="w-3 h-3" /> Select All
                              </button>
                              <span className="text-slate-300">|</span>
                              <button
                                type="button"
                                onClick={() => clearModuleAll(moduleKey)}
                                className="text-slate-500 hover:text-slate-700 font-medium flex items-center gap-1"
                              >
                                <Square className="w-3 h-3" /> Clear
                              </button>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                            {perms.map((perm: any) => {
                              const checked = selectedPermIds.includes(perm.id);
                              return (
                                <label
                                  key={perm.id}
                                  onClick={() => togglePermission(perm.id)}
                                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-left cursor-pointer transition select-none ${
                                    checked
                                      ? 'border-indigo-300 bg-indigo-50/50'
                                      : 'border-slate-100 hover:border-slate-200 bg-slate-50/30'
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => {}}
                                    className="mt-0.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                                      {perm.name}
                                    </p>
                                    <p className="text-[11px] font-mono text-slate-500 truncate">
                                      {perm.slug}
                                    </p>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100">
                    <span className="text-xs text-slate-500">
                      Changes take effect on all active sessions immediately.
                    </span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" onClick={() => setPermissionsRole(null)}>
                        Cancel
                      </Button>
                      <Button
                        onClick={() => {
                          savePermissionsMutation.mutate({
                            roleId: permissionsRole.id,
                            permissionIds: selectedPermIds,
                          });
                        }}
                        loading={savePermissionsMutation.isPending}
                        icon={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Save Permissions
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
