'use client';

import React, { useState, useMemo } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Card,
  Button,
  SearchInput,
  Table,
  Tr,
  Td,
  StatusBadge,
  Badge,
  Modal,
  Input,
  Textarea,
  ConfirmDialog,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { formatDate, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Shield,
  Plus,
  Edit2,
  Trash2,
  Key,
  CheckSquare,
  Square,
  Search,
  AlertTriangle,
  Lock,
  Users,
  Eye,
  CheckCircle2,
  Layers,
  Check,
} from 'lucide-react';

export default function RolesManagementPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [viewingRole, setViewingRole] = useState<any>(null);
  const [permissionsRole, setPermissionsRole] = useState<any>(null);
  const [deletingRole, setDeletingRole] = useState<any>(null);
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

  // Detailed query for viewing role
  const { data: roleDetail } = useQuery({
    queryKey: ['role-detail', viewingRole?.id],
    queryFn: () => usersApi.getRole(viewingRole.id).then((r) => r.data.data),
    enabled: !!viewingRole?.id,
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
      if (viewingRole?.id) setViewingRole(null);
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
      qc.invalidateQueries({ queryKey: ['role-detail', permissionsRole?.id] });
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

  const selectAllCatalog = () => {
    setSelectedPermIds(allPermissions.map((p: any) => p.id));
  };

  const clearAllCatalog = () => {
    setSelectedPermIds([]);
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
        <div className="space-y-6 min-w-0">
          {/* Header Summary */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-xl">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Shield className="w-6 h-6 text-indigo-400 shrink-0" />
                <h1 className="text-xl font-bold">Role-Based Access Control (RBAC)</h1>
              </div>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
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
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shrink-0 self-start sm:self-auto"
            >
              Create New Role
            </Button>
          </div>

          {/* Roles Table Card */}
          <Card padding={false} className="shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search roles by name or identifier slug…"
                className="w-full sm:w-80"
              />
              <div className="text-xs text-slate-500 shrink-0">
                Total Defined Roles: <span className="font-semibold text-slate-800">{filteredRoles.length}</span>
              </div>
            </div>

            <div className="overflow-x-auto min-w-0">
              <Table
                headers={[
                  'Role Name',
                  'Identifier (Slug)',
                  'Assigned Users',
                  'Permissions',
                  'Status',
                  'Last Updated',
                  'Actions',
                ]}
                loading={rolesLoading}
                empty={!filteredRoles.length}
                emptyMessage="No roles found matching your search."
              >
                {filteredRoles.map((role: any) => {
                  const isSuper = role.slug === 'super_admin';
                  const isClient = role.slug === 'client';
                  const isProtected = role.is_system || isSuper || isClient;

                  return (
                    <Tr key={role.id} className="hover:bg-slate-50/70 transition-colors">
                      <Td>
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                              isSuper
                                ? 'bg-amber-100 text-amber-800'
                                : isClient
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            <Shield className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-900">{role.name}</span>
                              {isSuper && <Badge variant="warning">Sole Super Admin</Badge>}
                              {isClient && <Badge variant="success">Default Public Role</Badge>}
                              {role.is_system && !isSuper && !isClient && <Badge>System Role</Badge>}
                            </div>
                            {role.description && (
                              <p className="text-xs text-slate-500 line-clamp-1 max-w-sm mt-0.5">
                                {role.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </Td>

                      <Td>
                        <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono text-xs whitespace-nowrap">
                          {role.slug}
                        </code>
                      </Td>

                      <Td>
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium text-xs">
                          <Users className="w-3.5 h-3.5 text-slate-400" />
                          <span>{role.user_count || 0}</span>
                        </div>
                      </Td>

                      <Td>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 whitespace-nowrap">
                          {isSuper ? 'Universal (All 55+)' : `${role.permission_count || 0} granted`}
                        </span>
                      </Td>

                      <Td>
                        <StatusBadge status={role.is_active ? 'active' : 'inactive'} />
                      </Td>

                      <Td className="text-xs text-slate-500 whitespace-nowrap">
                        {formatDate(role.updated_at || role.created_at)}
                      </Td>

                      <Td className="whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* View Role Details */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Eye className="w-3.5 h-3.5 text-slate-600" />}
                            onClick={() => setViewingRole(role)}
                            title="View Role Details"
                          />

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
                              icon={<Trash2 className="w-3.5 h-3.5 text-rose-500" />}
                              onClick={() => setDeletingRole(role)}
                              title="Delete Role"
                            />
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Table>
            </div>
          </Card>

          {/* ─── CREATE ROLE MODAL ─── */}
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
                label="Role Display Name *"
                placeholder="e.g. Compliance Officer"
                value={roleForm.name}
                onChange={(e) => {
                  const val = e.target.value;
                  setRoleForm((prev) => ({
                    ...prev,
                    name: val,
                    slug:
                      prev.slug === ''
                        ? val.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
                        : prev.slug,
                  }));
                }}
                required
              />

              <Input
                label="Unique Identifier (Slug) *"
                placeholder="e.g. compliance_officer"
                value={roleForm.slug}
                onChange={(e) =>
                  setRoleForm((prev) => ({
                    ...prev,
                    slug: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                  }))
                }
                hint="Used internally for role definitions and authorization policies"
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
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="create_is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
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

          {/* ─── EDIT ROLE MODAL ─── */}
          {editingRole && (
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
                  label="Role Display Name *"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Role Identifier (Slug)</label>
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
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <label htmlFor="edit_is_active" className="text-sm font-medium text-slate-700 cursor-pointer">
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
          )}

          {/* ─── VIEW ROLE DETAILS MODAL ─── */}
          {viewingRole && (
            <Modal
              open={!!viewingRole}
              onClose={() => setViewingRole(null)}
              title={`Role Overview: ${viewingRole.name}`}
              size="lg"
              footer={
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const r = viewingRole;
                        setViewingRole(null);
                        openPermissionsModal(r);
                      }}
                    >
                      Configure Permissions
                    </Button>
                  </div>
                  <Button onClick={() => setViewingRole(null)}>Close</Button>
                </div>
              }
            >
              <div className="space-y-4">
                {/* Header Information */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Slug</span>
                    <code className="text-xs font-mono font-bold text-slate-800">{viewingRole.slug}</code>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Status</span>
                    <StatusBadge status={viewingRole.is_active ? 'active' : 'inactive'} />
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Assigned Users</span>
                    <span className="text-xs font-bold text-slate-800">{viewingRole.user_count || 0} user(s)</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Permissions</span>
                    <span className="text-xs font-bold text-indigo-700">
                      {viewingRole.slug === 'super_admin' ? 'Universal' : `${viewingRole.permission_count || 0} granted`}
                    </span>
                  </div>
                </div>

                {viewingRole.description && (
                  <div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-1">
                      Description
                    </span>
                    <p className="text-xs text-slate-700 leading-relaxed bg-white p-3 rounded-lg border border-slate-200">
                      {viewingRole.description}
                    </p>
                  </div>
                )}

                {/* Assigned Users Sample */}
                {roleDetail?.users && roleDetail.users.length > 0 && (
                  <div>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                      Recently Assigned Users ({roleDetail.users.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                      {roleDetail.users.map((u: any) => (
                        <div
                          key={u.id}
                          className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 text-xs"
                        >
                          <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center font-bold text-[10px] text-slate-600 shrink-0">
                            {(u.display_name || u.email)[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 truncate">{u.display_name}</p>
                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Granted Permissions Preview */}
                <div>
                  <span className="text-xs font-bold text-slate-600 uppercase tracking-wider block mb-2">
                    Granted Permissions ({roleDetail?.permissions?.length || 0})
                  </span>
                  <div className="max-h-56 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-slate-200">
                    {roleDetail?.permissions?.map((p: any) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between text-xs py-1 px-2 hover:bg-slate-50 rounded"
                      >
                        <span className="font-medium text-slate-800">{p.name}</span>
                        <code className="text-[10px] font-mono text-slate-400">{p.slug}</code>
                      </div>
                    ))}
                    {!roleDetail?.permissions?.length && (
                      <p className="text-xs text-slate-400 py-3 text-center">No permissions assigned.</p>
                    )}
                  </div>
                </div>
              </div>
            </Modal>
          )}

          {/* ─── PERMISSIONS ASSIGNMENT MODAL ─── */}
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
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Search permissions by name, module, or slug…"
                        value={permSearch}
                        onChange={(e) => setPermSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={selectAllCatalog}
                          className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold"
                        >
                          Select All
                        </button>
                        <span className="text-slate-300">|</span>
                        <button
                          type="button"
                          onClick={clearAllCatalog}
                          className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                        >
                          Clear All
                        </button>
                      </div>
                      <Badge variant="info" className="text-xs font-bold">
                        {selectedPermIds.length} / {allPermissions.length} Granted
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
                                      ? 'border-indigo-300 bg-indigo-50/50 shadow-xs'
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

          {/* Delete Role Confirmation */}
          <ConfirmDialog
            open={!!deletingRole}
            onClose={() => setDeletingRole(null)}
            onConfirm={() => {
              const id = deletingRole.id;
              setDeletingRole(null);
              deleteRoleMutation.mutate(id);
            }}
            title="Delete Custom Role"
            description={
              <>
                Are you sure you want to permanently delete custom role{' '}
                <strong>&quot;{deletingRole?.name}&quot;</strong> ({deletingRole?.slug})? Users currently assigned to this role must be reassigned.
              </>
            }
            loading={deleteRoleMutation.isPending}
          />
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
