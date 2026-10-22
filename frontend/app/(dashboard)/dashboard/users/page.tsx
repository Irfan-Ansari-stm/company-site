'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
  Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination,
  Modal, Input, Select, Avatar, TabBar, Badge, StatCard
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus, Edit2, Trash2, Key, Users, Shield, Lock, ExternalLink, ShieldCheck, CheckCircle
} from 'lucide-react';

export default function UsersPage() {
  const qc = useQueryClient();
  const { isSuperAdmin } = useAuthStore();
  const [tab, setTab] = useState('users');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [showReset, setShowReset] = useState<any>(null);
  const [viewingPermsUser, setViewingPermsUser] = useState<any>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'client', phone: '' });
  const [newPassword, setNewPassword] = useState('');

  // Fetch users list
  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, search, role: roleFilter }],
    queryFn: () => usersApi.list({ page, limit: 20, search: search || undefined, role: roleFilter || undefined }).then(r => r.data),
    enabled: tab === 'users',
  });

  // Fetch dynamic roles
  const { data: rolesData = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.getRoles().then(r => r.data.data),
  });

  // Fetch all permissions
  const { data: permissionsData = [] } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => usersApi.getPermissions().then(r => r.data.data),
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowCreate(false);
      setForm({ first_name: '', last_name: '', email: '', password: '', role: 'client', phone: '' });
      toast.success('User account created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: () =>
      usersApi.update(showEdit.id, {
        first_name: showEdit.first_name,
        last_name: showEdit.last_name,
        role: showEdit.role,
        is_active: showEdit.is_active,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      setShowEdit(null);
      toast.success('User updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User deleted successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => usersApi.resetPassword(showReset.id, newPassword),
    onSuccess: () => {
      setShowReset(null);
      setNewPassword('');
      toast.success('Password reset successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: any) => usersApi.update(id, { is_active }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('User status updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const users = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  // Dynamic role options for select dropdowns
  const roleSelectOptions = [
    { value: '', label: 'All roles' },
    ...rolesData
      .filter((r: any) => r.is_active)
      .map((r: any) => ({
        value: r.slug,
        label: r.name + (r.slug === 'super_admin' ? ' (Sole)' : ''),
      })),
  ];

  const assignableRoles = rolesData.filter((r: any) => {
    if (!r.is_active) return false;
    // Only Super Admin can assign super_admin role
    if (r.slug === 'super_admin' && !isSuperAdmin()) return false;
    return true;
  });

  return (
    <ProtectedRoute permission="user.read">
      <DashboardLayout title="Users & Access Management" breadcrumbs={[{ label: 'Users' }]}>
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard title="Total Users" value={data?.total || 0} icon={<Users className="w-5 h-5" />} color="blue" />
            <StatCard title="Active Roles" value={rolesData?.filter((r: any) => r.is_active).length || 0} icon={<Shield className="w-5 h-5" />} color="purple" />
            <StatCard title="Active Users" value={users.filter((u: any) => u.is_active).length} icon={<Users className="w-5 h-5" />} color="green" />
          </div>

          <TabBar
            tabs={[
              { id: 'users', label: 'User Directory', count: data?.total },
              { id: 'roles', label: 'Roles Overview', count: rolesData?.length },
            ]}
            active={tab}
            onChange={setTab}
          />

          {/* USERS TAB */}
          {tab === 'users' && (
            <Card padding={false}>
              <div className="flex flex-col sm:flex-row items-center gap-3 p-4 border-b border-slate-100">
                <SearchInput value={search} onChange={setSearch} placeholder="Search users by name or email…" className="flex-1 max-w-sm" />
                <Select
                  options={roleSelectOptions}
                  value={roleFilter}
                  onChange={e => setRoleFilter(e.target.value)}
                  className="w-44 text-xs"
                />
                <div className="ml-auto">
                  <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>
                    Create User
                  </Button>
                </div>
              </div>

              <Table
                headers={['User', 'Role', 'Status', 'Verified', 'Last Login', 'Joined', 'Actions']}
                loading={isLoading}
                empty={!users.length}
                emptyMessage="No users found"
              >
                {users.map((u: any) => {
                  const isSoleSuperAdmin = u.role === 'super_admin';

                  return (
                    <Tr key={u.id}>
                      <Td>
                        <div className="flex items-center gap-3">
                          <Avatar src={u.avatar_url} name={u.display_name} size="sm" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-slate-900">{u.display_name}</p>
                              {isSoleSuperAdmin && <Badge variant="warning" className="text-[10px]">Sole Super Admin</Badge>}
                            </div>
                            <p className="text-xs text-slate-500">{u.email}</p>
                          </div>
                        </div>
                      </Td>

                      <Td>
                        <Badge variant={isSoleSuperAdmin ? 'warning' : u.role === 'client' ? 'success' : 'default'} className="capitalize">
                          {u.role.replace('_', ' ')}
                        </Badge>
                      </Td>

                      <Td>
                        {isSoleSuperAdmin ? (
                          <span title="Sole Super Admin cannot be deactivated">
                            <StatusBadge status="active" />
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}
                            className="cursor-pointer"
                            title="Click to toggle status"
                          >
                            <StatusBadge status={u.is_active ? 'active' : 'inactive'} />
                          </button>
                        )}
                      </Td>

                      <Td>
                        <Badge variant={u.is_verified ? 'success' : 'warning'}>
                          {u.is_verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </Td>

                      <Td className="text-xs text-slate-500">{u.last_login_at ? timeAgo(u.last_login_at) : 'Never'}</Td>
                      <Td className="text-xs text-slate-500">{formatDate(u.created_at)}</Td>

                      <Td>
                        <div className="flex items-center gap-1">
                          {/* Inspect effective permissions */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                            onClick={() => setViewingPermsUser(u)}
                            title="Inspect Permissions"
                          />

                          {/* Edit User */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Edit2 className="w-3.5 h-3.5 text-slate-600" />}
                            onClick={() => setShowEdit({ ...u })}
                            title="Edit User"
                          />

                          {/* Reset Password */}
                          <Button
                            variant="ghost"
                            size="sm"
                            icon={<Key className="w-3.5 h-3.5 text-slate-600" />}
                            onClick={() => setShowReset(u)}
                            title="Reset Password"
                          />

                          {/* Delete (Protected for Sole Super Admin) */}
                          {!isSoleSuperAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                              onClick={() => confirm(`Delete ${u.display_name}?`) && deleteMutation.mutate(u.id)}
                              title="Delete Account"
                            />
                          )}
                        </div>
                      </Td>
                    </Tr>
                  );
                })}
              </Table>
              <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data?.total} limit={20} />
            </Card>
          )}

          {/* ROLES TAB (SUMMARY & LINK TO FULL RBAC) */}
          {tab === 'roles' && (
            <div className="space-y-6">
              <div className="p-5 bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-indigo-950 text-base">Full Dynamic RBAC & Matrix</h3>
                  <p className="text-xs text-indigo-700 mt-1">
                    Manage fine-grained permissions, custom role creation, and module assignments in the dedicated section.
                  </p>
                </div>
                <Link href="/dashboard/roles">
                  <Button icon={<ExternalLink className="w-4 h-4" />}>
                    Open Roles & Permissions
                  </Button>
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rolesData.map((role: any) => (
                  <Card key={role.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                          <Shield className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900">{role.name}</h4>
                          <code className="text-[11px] text-slate-400 font-mono">{role.slug}</code>
                        </div>
                      </div>
                      <Badge variant={role.is_active ? 'success' : 'default'}>
                        {role.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    <p className="text-xs text-slate-500 mt-3 line-clamp-2 min-h-[32px]">
                      {role.description || 'No description provided.'}
                    </p>

                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
                      <span>{role.user_count || 0} assigned users</span>
                      <span className="font-semibold text-indigo-600">{role.permission_count || 0} permissions</span>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* CREATE USER MODAL */}
          <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create User Account" size="md">
            <form onSubmit={e => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Input label="First name" value={form.first_name} onChange={e => set('first_name', e.target.value)} required />
                <Input label="Last name" value={form.last_name} onChange={e => set('last_name', e.target.value)} required />
              </div>
              <Input label="Email" type="email" value={form.email} onChange={e => set('email', e.target.value)} required />
              <Input label="Phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
              <Input label="Temporary Password" type="password" value={form.password} onChange={e => set('password', e.target.value)} required hint="Minimum 8 characters" />

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-700">Assign Role</label>
                <select
                  value={form.role}
                  onChange={e => set('role', e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {assignableRoles.map((r: any) => (
                    <option key={r.id} value={r.slug}>{r.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowCreate(false)}>Cancel</Button>
                <Button type="submit" loading={createMutation.isPending}>Create User</Button>
              </div>
            </form>
          </Modal>

          {/* EDIT USER MODAL */}
          <Modal open={!!showEdit} onClose={() => setShowEdit(null)} title={`Edit User: ${showEdit?.display_name}`} size="md">
            {showEdit && (
              <form onSubmit={e => { e.preventDefault(); updateMutation.mutate(); }} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Input label="First name" value={showEdit.first_name} onChange={e => setShowEdit({ ...showEdit, first_name: e.target.value })} required />
                  <Input label="Last name" value={showEdit.last_name} onChange={e => setShowEdit({ ...showEdit, last_name: e.target.value })} required />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-700">Assign Role</label>
                  <select
                    value={showEdit.role}
                    disabled={showEdit.role === 'super_admin' && !isSuperAdmin()}
                    onChange={e => setShowEdit({ ...showEdit, role: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {assignableRoles.map((r: any) => (
                      <option key={r.id} value={r.slug}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {showEdit.role !== 'super_admin' && (
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="edit_user_active"
                      checked={showEdit.is_active}
                      onChange={e => setShowEdit({ ...showEdit, is_active: e.target.checked })}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="edit_user_active" className="text-sm font-medium text-slate-700">
                      Account is Active
                    </label>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                  <Button variant="outline" type="button" onClick={() => setShowEdit(null)}>Cancel</Button>
                  <Button type="submit" loading={updateMutation.isPending}>Save Changes</Button>
                </div>
              </form>
            )}
          </Modal>

          {/* RESET PASSWORD MODAL */}
          <Modal open={!!showReset} onClose={() => setShowReset(null)} title={`Reset Password for ${showReset?.display_name}`} size="sm">
            <form onSubmit={e => { e.preventDefault(); resetPasswordMutation.mutate(); }} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                hint="Minimum 8 characters"
              />
              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <Button variant="outline" type="button" onClick={() => setShowReset(null)}>Cancel</Button>
                <Button type="submit" loading={resetPasswordMutation.isPending}>Update Password</Button>
              </div>
            </form>
          </Modal>

          {/* INSPECT EFFECTIVE PERMISSIONS MODAL */}
          <Modal
            open={!!viewingPermsUser}
            onClose={() => setViewingPermsUser(null)}
            title={`Effective Permissions — ${viewingPermsUser?.display_name}`}
            size="lg"
          >
            {viewingPermsUser && (
              <div className="space-y-4">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500">Assigned Role:</span>{' '}
                    <Badge variant="info" className="capitalize font-semibold">
                      {viewingPermsUser.role.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-slate-500">Effective Permissions:</span>{' '}
                    <span className="font-bold text-slate-900">
                      {viewingPermsUser.role === 'super_admin' ? 'Universal (All)' : (viewingPermsUser.permissions?.length || 0)}
                    </span>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
                  {viewingPermsUser.role === 'super_admin' ? (
                    <div className="p-4 bg-amber-50 text-amber-800 rounded-xl text-xs font-medium">
                      This user is the designated Sole Super Admin and holds full universal bypass across all system actions.
                    </div>
                  ) : viewingPermsUser.permissions && viewingPermsUser.permissions.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {viewingPermsUser.permissions.map((perm: string) => (
                        <div key={perm} className="flex items-center gap-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-700">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="truncate">{perm}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-500 py-4 text-center">No specific permissions assigned to this user.</p>
                  )}
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                  <Button variant="outline" onClick={() => setViewingPermsUser(null)}>
                    Close
                  </Button>
                </div>
              </div>
            )}
          </Modal>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
