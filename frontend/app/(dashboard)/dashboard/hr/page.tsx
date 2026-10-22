'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import { Card, Button, Table, Tr, Td, StatusBadge, Pagination, Modal, Input, Select, Textarea, StatCard, TabBar, Badge, PageLoader } from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus, Eye, Briefcase, Users, UserCheck } from 'lucide-react';
import Link from 'next/link';

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' }, { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' }, { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
];
const LOCATION_TYPES = [
  { value: 'on_site', label: 'On-site' }, { value: 'remote', label: 'Remote' }, { value: 'hybrid', label: 'Hybrid' },
];

export default function HRPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('jobs');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [jobForm, setJobForm] = useState({ title: '', description: '', employment_type: 'full_time', location_type: 'remote', location: '', salary_min: '', salary_max: '', positions: '1' });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', { page }],
    queryFn: () => hrApi.getJobs({ page, limit: 20 }).then(r => r.data),
    enabled: tab === 'jobs',
  });

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: ['applications', { page }],
    queryFn: () => hrApi.getApplications({ page, limit: 20 }).then(r => r.data),
    enabled: tab === 'applications',
  });

  const { data: teamData } = useQuery({
    queryKey: ['team'],
    queryFn: () => hrApi.getTeam().then(r => r.data.data),
    enabled: tab === 'team',
  });

  const { data: depts } = useQuery({
    queryKey: ['departments'],
    queryFn: () => hrApi.getDepartments().then(r => r.data.data),
  });

  const createJobMutation = useMutation({
    mutationFn: () => hrApi.createJob(jobForm),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs'] }); setShowCreate(false); toast.success('Job posted'); },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const setJ = (k: string, v: string) => setJobForm(f => ({ ...f, [k]: v }));
  const jobs = jobsData?.data || [];
  const applications = applicationsData?.data || [];

  return (
    <DashboardLayout title="HR & Recruitment" breadcrumbs={[{ label: 'HR' }]}>
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Open Positions" value={jobs.filter((j: any) => j.is_active !== false).length} icon={<Briefcase className="w-5 h-5" />} color="blue" />
          <StatCard title="Applications" value={applicationsData?.total || 0} icon={<Users className="w-5 h-5" />} color="orange" />
          <StatCard title="Team Members" value={teamData?.length || 0} icon={<UserCheck className="w-5 h-5" />} color="green" />
        </div>

        <TabBar
          tabs={[
            { id: 'jobs', label: 'Job Openings', count: jobsData?.total },
            { id: 'applications', label: 'Applications', count: applicationsData?.total },
            { id: 'team', label: 'Team', count: teamData?.length },
          ]}
          active={tab}
          onChange={setTab}
        />

        {tab === 'jobs' && (
          <Card padding={false}>
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <h3 className="font-semibold text-slate-800">Job Openings</h3>
              <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => setShowCreate(true)}>Post Job</Button>
            </div>
            <Table
              headers={['Title', 'Department', 'Type', 'Location', 'Salary', 'Positions', 'Applicants', 'Posted', '']}
              loading={jobsLoading}
              empty={!jobs.length}
            >
              {jobs.map((j: any) => (
                <Tr key={j.id}>
                  <Td>
                    <p className="font-medium text-slate-900">{j.title}</p>
                    {j.is_featured && <Badge variant="info">Featured</Badge>}
                  </Td>
                  <Td>{j.department_name || '—'}</Td>
                  <Td><StatusBadge status={j.employment_type} /></Td>
                  <Td className="capitalize">{j.location_type?.replace(/_/g, ' ')}</Td>
                  <Td>
                    {j.salary_min && j.salary_max ? `$${j.salary_min / 1000}k–$${j.salary_max / 1000}k` : '—'}
                  </Td>
                  <Td>{j.positions}</Td>
                  <Td>{j.applicant_count}</Td>
                  <Td>{timeAgo(j.created_at)}</Td>
                  <Td>
                    <Link href={`/dashboard/hr/jobs/${j.id}`}>
                      <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>View</Button>
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={Math.ceil((jobsData?.total || 0) / 20)} onPageChange={setPage} total={jobsData?.total} limit={20} />
          </Card>
        )}

        {tab === 'applications' && (
          <Card padding={false}>
            <Table
              headers={['Applicant', 'Position', 'Stage', 'Rating', 'Applied', '']}
              loading={appsLoading}
              empty={!applications.length}
              emptyMessage="No applications yet"
            >
              {applications.map((a: any) => (
                <Tr key={a.id}>
                  <Td>
                    <div>
                      <p className="font-medium text-slate-900">{a.first_name} {a.last_name}</p>
                      <p className="text-xs text-slate-500">{a.email}</p>
                    </div>
                  </Td>
                  <Td>{a.job_title}</Td>
                  <Td><StatusBadge status={a.stage} /></Td>
                  <Td>
                    {a.rating ? (
                      <span className="text-yellow-500">{'★'.repeat(a.rating)}{'☆'.repeat(5 - a.rating)}</span>
                    ) : '—'}
                  </Td>
                  <Td>{timeAgo(a.applied_at)}</Td>
                  <Td>
                    <Link href={`/dashboard/hr/applications/${a.id}`}>
                      <Button variant="ghost" size="sm" icon={<Eye className="w-4 h-4" />}>Review</Button>
                    </Link>
                  </Td>
                </Tr>
              ))}
            </Table>
            <Pagination page={page} totalPages={Math.ceil((applicationsData?.total || 0) / 20)} onPageChange={setPage} total={applicationsData?.total} limit={20} />
          </Card>
        )}

        {tab === 'team' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {teamData?.map((m: any) => (
              <Card key={m.id} className="text-center !p-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3">
                  {(m.name || m.first_name || m.designation)?.[0] || '?'}
                </div>
                <p className="font-semibold text-slate-900">{m.name || `${m.first_name || ''} ${m.last_name || ''}`.trim() || 'Team Member'}</p>
                <p className="text-sm text-slate-500">{m.designation}</p>
                <p className="text-xs text-slate-400 mt-1">{m.department_name}</p>
                {m.is_featured && <Badge variant="info" className="mt-2">Featured</Badge>}
              </Card>
            ))}
            {!teamData?.length && <p className="col-span-full text-center text-slate-500 py-8">No team members added</p>}
          </div>
        )}
      </div>

      {/* Create Job Modal */}
      <Modal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        title="Post Job Opening"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button loading={createJobMutation.isPending} onClick={() => createJobMutation.mutate()}>Post Job</Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input label="Job Title *" value={jobForm.title} onChange={e => setJ('title', e.target.value)} />
          </div>
          <Select label="Employment Type" options={EMPLOYMENT_TYPES} value={jobForm.employment_type} onChange={e => setJ('employment_type', e.target.value)} />
          <Select label="Work Type" options={LOCATION_TYPES} value={jobForm.location_type} onChange={e => setJ('location_type', e.target.value)} />
          <Input label="Location" value={jobForm.location} onChange={e => setJ('location', e.target.value)} placeholder="City, Country" />
          <Input label="Positions" type="number" value={jobForm.positions} onChange={e => setJ('positions', e.target.value)} min="1" />
          <Input label="Salary Min" type="number" value={jobForm.salary_min} onChange={e => setJ('salary_min', e.target.value)} placeholder="e.g. 60000" />
          <Input label="Salary Max" type="number" value={jobForm.salary_max} onChange={e => setJ('salary_max', e.target.value)} placeholder="e.g. 90000" />
          <div className="col-span-2">
            <Textarea label="Description *" value={jobForm.description} onChange={e => setJ('description', e.target.value)} rows={4} />
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
