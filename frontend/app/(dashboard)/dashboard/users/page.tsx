'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, SearchInput, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Avatar, TabBar, Badge, StatCard } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Edit2, Trash2, Key, Users, Shield, Lock } from 'lucide-react';

const ROLES_LIST = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'employee', label: 'Employee' },
  { value: 'client', label: 'Client' },
  { value: 'viewer', label: 'Viewer' },
];

export default function UsersPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('users');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState<any>(null);
  const [showReset, setShowReset] = useState<any>(null);
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', password: '', role: 'employee', phone: '' });
  const [newPassword, setNewPassword] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['users', { page, search, role: roleFilter }],
    queryFn: () => usersApi.list({ page, limit: 20, search: search || undefined, role: roleFilter || undefined }).then(r => r.data),
    enabled: tab === 'users',
  });

  const { data: rolesData } = useQuery({
    queryKey: ['roles'],
    queryFn: () => usersApi.getRoles().then(r => r.data.data),
    enabled: tab === 'roles',
  });

  const { data: permissionsData } = useQuery({
    queryKey: ['permissions'],
    queryFn: () => usersApi.getPermissions().then(r => r.data.data),
    enabled: tab === 'roles',
  });

  const createMutation = useMutation({
    mutationFn: () => usersApi.create(form),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowCreate(false); toast.success('User created'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateMutation = useMutation({
    mutationFn: () => usersApi.update(showEdit.id, { first_name: showEdit.first_name, last_name: showEdit.last_name, role: showEdit.role, is_active: showEdit.is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowEdit(null); toast.success('User updated'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.delete(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User deleted'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const resetPasswordMutation = useMutation({
    mutationFn: () => usersApi.resetPassword(showReset.id, newPassword),
    onSuccess: () => { setShowReset(null); setNewPassword(''); toast.success('Password reset'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: any) => usersApi.update(id, { is_active }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); toast.success('User status updated'); },
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));
  const users = data?.data || [];
  const totalPages = Math.ceil((data?.total || 0) / 20);

  // group permissions by module
  const permsByModule: Record<string, any[]> = {};
  permissionsData?.forEach((p: any) => {
    if (!permsByModule[p.module]) permsByModule[p.module] = [];
    permsByModule[p.module].push(p);
  });

  return (
    <DashboardLayout title="Users & Roles" breadcrumbs={[{ label: 'Users' }]}>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Users" value={data?.total || 0} icon={<Users className="w-5 h-5" />} color="blue" />
          <StatCard title="Roles" value={rolesData?.length || 0} icon={<Shield className="w-5 h-5" />} color="purple" />
          <StatCard title="Active" value={users.filter((u: any) => u.is_active).length} icon={<Users className="w-5 h-5" />} color="green" />
        </div>

        <TabBar
          tabs={[
            { id: 'users', label: 'Users', count: data?.total },
            { id: 'roles', label: 'Roles & Permissions', count: rolesData?.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* USERS TAB */}
        {tab === 'users' && (
          <Card padding={false}>
            <div className="flex items-center gap-3 p-4 border-b border-slate-100">
              <SearchInput value={search} onChange={setSearch} placeholder="Search users…" className="flex-1 max-w-xs" />
              <Select options={[{ value: '', label: 'All roles' }, ...ROLES_LIST]} value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="w-36" />
              <div className="ml-auto">
                <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Invite User</Button>
              </div>
            </div>
            <Table
              headers={['User', 'Role', 'Status', 'Verified', 'Last Login', 'Joined', '']}
              loading={isLoading}
              empty={!users.length}
              emptyMessage="No users found"
            >
              {users.map((u: any) => (
                <Tr key={u.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar src={u.avatar_url} name={u.display_name} size="sm" />
                      <div>
                        <p className="font-medium text-slate-900">{u.display_name}</p>
                        <p className="text-xs text-slate-500">{u.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td><Badge className="capitalize">{u.role}</Badge></Td>
                  <Td>
                    <button onClick={() => toggleActiveMutation.mutate({ id: u.id, is_active: !u.is_active })}>
                      <StatusBadge status={u.is_active ? 'active' : 'inactive'} />
                    </button>
                  </Td>
                  <Td>
                    <Badge variant={u.is_verified ? 'success' : 'warning'}>{u.is_verified ? 'Verified' : 'Pending'}</Badge>
                  </Td>
                  <Td>{u.last_login_at ? timeAgo(u.last_login_at) : 'Never'}</Td>
                  <Td>{formatDate(u.created_at)}</Td>
                  <Td>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={() => setShowEdit({ ...u })} />
                      <Button variant="ghost" size="sm" icon={<Key className="w-3.5 h-3.5" />} onClick={() => setShowReset(u)} />
                      <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                        onClick={() => confirm(`Delete ${u.display_name}?`) && deleteMutation.mutate(u.id)} />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} total={data?.total} limit={20} />
          </Card>
        )}

        {/* ROLES TAB */}
        {tab === 'roles' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles list */}
            <Card padding={false}>
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800">Roles</h3>
                <Button size="sm" icon={<Plus className="w-4 h-4" />}>New Role</Button>
              </div>
              <div className="divide-y divide-slate-100">
                {rolesData?.map((role: any) => (
                  <div key={role.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{role.name}</p>
                      {role.description && <p className="text-xs text-slate-500">{role.description}</p>}
                    </div>
                    <Badge>{role.user_count || 0} users</Badge>
                    {!role.is_system && (
                      <Button variant="ghost" size="sm" icon={<Edit2 className="w-3.5 h-3.5" />} />
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Permissions matrix */}
            <Card>
              <h3 className="font-semibold text-slate-800 mb-4">Permissions by Module</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {Object.entries(permsByModule).map(([module, perms]) => (
                  <div key={module}>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">{module}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {perms.map((p: any) => (
                        <Badge key={p.id} className="text-xs">
                          <Lock className="w-2.5 h-2.5 mr-1 inline" />
                          {p.action}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Invite User"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createMutation.isPending} onClick={() => createMutation.mutate()}>Create User</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <Input label="First Name *" value={form.first_name} onChange={e => set('first_name', e.target.value)} />
          <Input label="Last Name *" value={form.last_name} onChange={e => set('last_name', e.target.value)} />
          <Input label="Email *" type="email" value={form.email} onChange={e => set('email', e.target.value)} className="col-span-2" />
          <Input label="Phone" value={form.phone} onChange={e => set('phone', e.target.value)} />
          <Select label="Role" options={ROLES_LIST} value={form.role} onChange={e => set('role', e.target.value)} />
          <Input label="Password *" type="password" value={form.password} onChange={e => set('password', e.target.value)} className="col-span-2" />
        </div>
      </Modal>

      {/* Edit User Modal */}
      {showEdit && (
        <Modal
          open={!!showEdit}
          onClose={() => setShowEdit(null)}
          title="Edit User"
          footer={
            <>
              <Button variant="outline" onClick={() => setShowEdit(null)}>Cancel</Button>
              <Button loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>Save</Button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={showEdit.first_name || ''} onChange={e => setShowEdit((u: any) => ({ ...u, first_name: e.target.value }))} />
            <Input label="Last Name" value={showEdit.last_name || ''} onChange={e => setShowEdit((u: any) => ({ ...u, last_name: e.target.value }))} />
            <Select label="Role" options={ROLES_LIST} value={showEdit.role} onChange={e => setShowEdit((u: any) => ({ ...u, role: e.target.value }))} />
            <Select label="Status" options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} value={String(showEdit.is_active)} onChange={e => setShowEdit((u: any) => ({ ...u, is_active: e.target.value === 'true' }))} />
          </div>
        </Modal>
      )}

      {/* Reset Password Modal */}
      {showReset && (
        <Modal
          open={!!showReset}
          onClose={() => setShowReset(null)}
          title={`Reset Password — ${showReset.display_name}`}
          footer={
            <>
              <Button variant="outline" onClick={() => setShowReset(null)}>Cancel</Button>
              <Button loading={resetPasswordMutation.isPending} onClick={() => resetPasswordMutation.mutate()}>Reset Password</Button>
            </>
          }
        >
          <Input label="New Password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} hint="Minimum 8 characters" />
        </Modal>
      )}
    </DashboardLayout>
  );
}
