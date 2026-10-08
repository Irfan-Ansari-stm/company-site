'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, Input, TabBar, Alert, Avatar, Badge } from '@/components/ui';
import { useQuery, useMutation } from '@tanstack/react-query';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Shield, Clock, Smartphone, Key, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser } = useAuthStore();
  const [tab, setTab] = useState('profile');
  const [profileForm, setProfileForm] = useState({ first_name: user?.first_name || '', last_name: user?.last_name || '', display_name: user?.display_name || '', phone: '' });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [twoFASetup, setTwoFASetup] = useState<any>(null);
  const [twoFACode, setTwoFACode] = useState('');

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => authApi.getSessions().then(r => r.data.data),
    enabled: tab === 'security',
  });

  const updateProfileMutation = useMutation({
    mutationFn: () => authApi.updateMe(profileForm),
    onSuccess: (data) => { setUser(data.data.data); toast.success('Profile updated'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const changePasswordMutation = useMutation({
    mutationFn: () => authApi.changePassword(passwordForm.currentPassword, passwordForm.newPassword),
    onSuccess: () => { setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' }); toast.success('Password changed'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const setup2FAMutation = useMutation({
    mutationFn: () => authApi.setup2FA(),
    onSuccess: (data) => setTwoFASetup(data.data.data),
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const enable2FAMutation = useMutation({
    mutationFn: () => authApi.enable2FA(twoFACode),
    onSuccess: () => { toast.success('2FA enabled!'); setTwoFASetup(null); setTwoFACode(''); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const disable2FAMutation = useMutation({
    mutationFn: () => authApi.disable2FA(twoFACode),
    onSuccess: () => { toast.success('2FA disabled'); setTwoFACode(''); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteSessionMutation = useMutation({
    mutationFn: (id: string) => authApi.deleteSession(id),
    onSuccess: () => { toast.success('Session terminated'); },
  });

  const setP = (k: string, v: string) => setProfileForm(f => ({ ...f, [k]: v }));
  const setPw = (k: string, v: string) => setPasswordForm(f => ({ ...f, [k]: v }));

  const passwordMismatch = passwordForm.newPassword && passwordForm.confirmPassword && passwordForm.newPassword !== passwordForm.confirmPassword;

  return (
    <DashboardLayout title="My Profile" breadcrumbs={[{ label: 'Profile' }]}>
      <div className="max-w-3xl">
        {/* Avatar + Name header */}
        <Card className="mb-6">
          <div className="flex items-center gap-4">
            <Avatar src={user?.avatar_url} name={user?.display_name} size="xl" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">{user?.display_name}</h2>
              <p className="text-slate-500">{user?.email}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="capitalize">{user?.role}</Badge>
                {user?.is_verified && <Badge variant="success">Verified</Badge>}
                {user?.two_factor_enabled && <Badge variant="info"><Shield className="w-3 h-3 mr-1 inline" />2FA On</Badge>}
              </div>
            </div>
          </div>
        </Card>

        <TabBar
          tabs={[
            { id: 'profile', label: 'Profile' },
            { id: 'password', label: 'Password' },
            { id: 'security', label: 'Security' },
            { id: 'notifications', label: 'Notifications' },
          ]}
          active={tab}
          onChange={setTab}
        />

        {/* PROFILE */}
        {tab === 'profile' && (
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">Personal Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <Input label="First Name" value={profileForm.first_name} onChange={e => setP('first_name', e.target.value)} />
              <Input label="Last Name" value={profileForm.last_name} onChange={e => setP('last_name', e.target.value)} />
              <Input label="Display Name" value={profileForm.display_name} onChange={e => setP('display_name', e.target.value)} className="col-span-2" />
              <Input label="Email" value={user?.email || ''} disabled className="col-span-2" hint="Contact admin to change email" />
            </div>
            <div className="flex justify-end mt-4">
              <Button loading={updateProfileMutation.isPending} onClick={() => updateProfileMutation.mutate()}>Save Changes</Button>
            </div>
          </Card>
        )}

        {/* PASSWORD */}
        {tab === 'password' && (
          <Card>
            <h3 className="font-semibold text-slate-800 mb-4">Change Password</h3>
            <div className="space-y-4">
              <Input label="Current Password" type="password" value={passwordForm.currentPassword} onChange={e => setPw('currentPassword', e.target.value)} />
              <Input label="New Password" type="password" value={passwordForm.newPassword} onChange={e => setPw('newPassword', e.target.value)} hint="Minimum 8 characters" />
              <Input label="Confirm New Password" type="password" value={passwordForm.confirmPassword} onChange={e => setPw('confirmPassword', e.target.value)} error={passwordMismatch ? "Passwords don't match" : undefined} />
            </div>
            <div className="flex justify-end mt-4">
              <Button
                loading={changePasswordMutation.isPending}
                disabled={!!passwordMismatch || !passwordForm.currentPassword || !passwordForm.newPassword}
                onClick={() => changePasswordMutation.mutate()}
              >
                Update Password
              </Button>
            </div>
          </Card>
        )}

        {/* SECURITY */}
        {tab === 'security' && (
          <div className="space-y-4">
            {/* 2FA */}
            <Card>
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Smartphone className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-slate-500 mt-0.5">Add an extra layer of security to your account</p>
                    <Badge variant={user?.two_factor_enabled ? 'success' : 'default'} className="mt-1">
                      {user?.two_factor_enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
                {!user?.two_factor_enabled ? (
                  <Button size="sm" onClick={() => setup2FAMutation.mutate()} loading={setup2FAMutation.isPending}>Enable 2FA</Button>
                ) : (
                  <Button variant="danger" size="sm" onClick={() => disable2FAMutation.mutate()} loading={disable2FAMutation.isPending}>Disable</Button>
                )}
              </div>

              {/* 2FA Setup flow */}
              {twoFASetup && (
                <div className="mt-4 border-t border-slate-100 pt-4 space-y-3">
                  <p className="text-sm text-slate-700">Scan this QR code with your authenticator app:</p>
                  {twoFASetup.qr_code && (
                    <img src={twoFASetup.qr_code} alt="2FA QR Code" className="w-40 h-40 rounded-lg border border-slate-200" />
                  )}
                  {twoFASetup.secret && (
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-xs text-slate-500">Or enter manually:</p>
                      <code className="text-sm font-mono">{twoFASetup.secret}</code>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Input placeholder="Enter 6-digit code" value={twoFACode} onChange={e => setTwoFACode(e.target.value)} className="max-w-[160px]" maxLength={6} />
                    <Button size="sm" loading={enable2FAMutation.isPending} onClick={() => enable2FAMutation.mutate()} disabled={twoFACode.length !== 6}>Verify & Enable</Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Active Sessions */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-slate-400" />
                <h3 className="font-semibold text-slate-900">Active Sessions</h3>
              </div>
              <div className="space-y-3">
                {sessionsData?.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{session.device_info?.browser || session.ip_address}</p>
                      <p className="text-xs text-slate-500">{session.ip_address} · {timeAgo(session.last_activity || session.created_at)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.is_current && <Badge variant="success">Current</Badge>}
                      {!session.is_current && (
                        <Button variant="ghost" size="sm" icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                          onClick={() => deleteSessionMutation.mutate(session.id)} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* NOTIFICATIONS */}
        {tab === 'notifications' && (
          <NotificationPreferences />
        )}
      </div>
    </DashboardLayout>
  );
}

function NotificationPreferences() {
  const { data, isLoading } = useQuery({
    queryKey: ['notif-preferences'],
    queryFn: () => authApi.me().then(r => r.data.data), // notification prefs are fetched via separate endpoint
  });

  const { data: prefsData } = useQuery({
    queryKey: ['notif-prefs'],
    queryFn: () => import('@/lib/api').then(m => m.notificationsApi.getPreferences()).then(r => r.data.data),
  });

  const [prefs, setPrefs] = useState<any>({});

  const updateMutation = useMutation({
    mutationFn: () => import('@/lib/api').then(m => m.notificationsApi.updatePreferences(prefs)),
    onSuccess: () => toast.success('Preferences saved'),
  });

  const CATEGORIES = [
    { key: 'leads', label: 'New Leads' },
    { key: 'projects', label: 'Project Updates' },
    { key: 'invoices', label: 'Invoice Alerts' },
    { key: 'support', label: 'Support Tickets' },
    { key: 'system', label: 'System Alerts' },
  ];

  return (
    <Card>
      <h3 className="font-semibold text-slate-800 mb-4">Notification Preferences</h3>
      <div className="space-y-3">
        {CATEGORIES.map(cat => (
          <div key={cat.key} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
            <span className="text-sm text-slate-700">{cat.label}</span>
            <div className="flex items-center gap-4">
              {['email', 'in_app', 'push'].map(channel => (
                <label key={channel} className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded"
                    checked={prefs[`${cat.key}_${channel}`] ?? prefsData?.[`${cat.key}_${channel}`] ?? true}
                    onChange={e => setPrefs((p: any) => ({ ...p, [`${cat.key}_${channel}`]: e.target.checked }))}
                  />
                  <span className="text-xs text-slate-500 capitalize">{channel.replace(/_/g, ' ')}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end mt-4">
        <Button size="sm" loading={updateMutation.isPending} onClick={() => updateMutation.mutate()}>Save Preferences</Button>
      </div>
    </Card>
  );
}
