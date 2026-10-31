'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card,
  Button,
  Table,
  Tr,
  Td,
  StatusBadge,
  Pagination,
  Modal,
  Input,
  Select,
  Textarea,
  StatCard,
  TabBar,
  Badge,
  SearchInput,
  EmptyState,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hrApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus,
  Eye,
  Briefcase,
  Users,
  UserCheck,
  Edit,
  Trash2,
  ExternalLink,
  FileText,
  Star,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Globe,
  Filter,
} from 'lucide-react';

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
];

const LOCATION_TYPES = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'on_site', label: 'On-site' },
];

const APPLICATION_STAGES = [
  { value: 'applied', label: 'Applied' },
  { value: 'screening', label: 'Screening' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'interview_1', label: 'Interview 1' },
  { value: 'interview_2', label: 'Interview 2' },
  { value: 'technical_test', label: 'Technical Test' },
  { value: 'offer', label: 'Offer' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export default function HRPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('jobs');
  const [page, setPage] = useState(1);

  // Search & Filters
  const [searchJobs, setSearchJobs] = useState('');
  const [deptFilter, setDeptFilter] = useState('');

  const [searchApps, setSearchApps] = useState('');
  const [appJobFilter, setAppJobFilter] = useState('');
  const [appStageFilter, setAppStageFilter] = useState('');

  const [searchTeam, setSearchTeam] = useState('');
  const [teamDeptFilter, setTeamDeptFilter] = useState('');

  // Modals state
  const [showCreateJob, setShowCreateJob] = useState(false);
  const [editingJob, setEditingJob] = useState<any | null>(null);
  const [viewingJob, setViewingJob] = useState<any | null>(null);
  const [deletingJob, setDeletingJob] = useState<any | null>(null);

  const [reviewingApp, setReviewingApp] = useState<any | null>(null);
  const [appNotesText, setAppNotesText] = useState('');

  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState<any | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<any | null>(null);

  // Forms
  const [jobForm, setJobForm] = useState({
    title: '',
    department_id: '',
    employment_type: 'full_time',
    location_type: 'remote',
    location: 'Remote',
    salary_min: '',
    salary_max: '',
    positions: '1',
    description: '',
    is_featured: false,
  });

  const [teamForm, setTeamForm] = useState({
    name: '',
    designation: '',
    department: 'Engineering',
    bio: '',
    is_featured: false,
    is_active: true,
  });

  // ── Queries ──────────────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['hr-stats'],
    queryFn: () => hrApi.getStats().then((r) => r.data.data),
  });

  const { data: deptsData } = useQuery({
    queryKey: ['departments'],
    queryFn: () => hrApi.getDepartments().then((r) => r.data.data),
  });
  const departments = deptsData || [];

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs', { page, search: searchJobs, department_id: deptFilter }],
    queryFn: () =>
      hrApi
        .getJobs({
          page,
          limit: 20,
          search: searchJobs || undefined,
          department_id: deptFilter || undefined,
        })
        .then((r) => r.data),
  });

  const { data: applicationsData, isLoading: appsLoading } = useQuery({
    queryKey: [
      'applications',
      { page, search: searchApps, job_id: appJobFilter, stage: appStageFilter },
    ],
    queryFn: () =>
      hrApi
        .getApplications({
          page,
          limit: 20,
          search: searchApps || undefined,
          job_id: appJobFilter || undefined,
          stage: appStageFilter || undefined,
        })
        .then((r) => r.data),
  });

  const { data: teamData, isLoading: teamLoading } = useQuery({
    queryKey: ['team', { search: searchTeam, department: teamDeptFilter }],
    queryFn: () =>
      hrApi
        .getTeam({
          search: searchTeam || undefined,
          department: teamDeptFilter || undefined,
        })
        .then((r) => r.data.data),
  });

  // ── Mutations ────────────────────────────────────────────
  const createJobMutation = useMutation({
    mutationFn: () => hrApi.createJob(jobForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['hr-stats'] });
      setShowCreateJob(false);
      resetJobForm();
      toast.success('Job posted successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateJobMutation = useMutation({
    mutationFn: (id: string) => hrApi.updateJob(id, jobForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['hr-stats'] });
      setEditingJob(null);
      resetJobForm();
      toast.success('Job updated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteJobMutation = useMutation({
    mutationFn: (id: string) => hrApi.deleteJob(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['jobs'] });
      qc.invalidateQueries({ queryKey: ['hr-stats'] });
      setDeletingJob(null);
      toast.success('Job archived successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateAppMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      hrApi.updateApplication(id, data),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      qc.invalidateQueries({ queryKey: ['hr-stats'] });
      if (reviewingApp && reviewingApp.id === vars.id) {
        setReviewingApp((prev: any) => ({ ...prev, ...vars.data }));
      }
      toast.success('Application updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) =>
      hrApi.addApplicationNote(id, content),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['applications'] });
      setAppNotesText('');
      toast.success('Note added');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createTeamMutation = useMutation({
    mutationFn: () => hrApi.addTeamMember(teamForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['hr-stats'] });
      setShowCreateTeam(false);
      resetTeamForm();
      toast.success('Team member added successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateTeamMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      hrApi.updateTeamMember(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['hr-stats'] });
      setEditingTeam(null);
      resetTeamForm();
      toast.success('Team member updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteTeamMutation = useMutation({
    mutationFn: (id: string) => hrApi.removeTeamMember(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['team'] });
      qc.invalidateQueries({ queryKey: ['hr-stats'] });
      setDeletingTeam(null);
      toast.success('Team member archived');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Helpers
  const resetJobForm = () => {
    setJobForm({
      title: '',
      department_id: '',
      employment_type: 'full_time',
      location_type: 'remote',
      location: 'Remote',
      salary_min: '',
      salary_max: '',
      positions: '1',
      description: '',
      is_featured: false,
    });
  };

  const resetTeamForm = () => {
    setTeamForm({
      name: '',
      designation: '',
      department: 'Engineering',
      bio: '',
      is_featured: false,
      is_active: true,
    });
  };

  const handleEditJobClick = (j: any) => {
    setJobForm({
      title: j.title || '',
      department_id: j.department_id || '',
      employment_type: j.employment_type || 'full_time',
      location_type: j.location_type || 'remote',
      location: j.location || 'Remote',
      salary_min: j.salary_min != null ? String(j.salary_min) : '',
      salary_max: j.salary_max != null ? String(j.salary_max) : '',
      positions: j.positions != null ? String(j.positions) : '1',
      description: j.description || '',
      is_featured: !!j.is_featured,
    });
    setEditingJob(j);
  };

  const handleEditTeamClick = (m: any) => {
    setTeamForm({
      name: m.name || '',
      designation: m.designation || '',
      department: m.department || 'Engineering',
      bio: m.bio || '',
      is_featured: !!m.is_featured,
      is_active: m.is_active !== false,
    });
    setEditingTeam(m);
  };

  const setJ = (k: string, v: any) => setJobForm((f) => ({ ...f, [k]: v }));
  const setT = (k: string, v: any) => setTeamForm((f) => ({ ...f, [k]: v }));

  const jobs = jobsData?.data || [];
  const applications = applicationsData?.data || [];
  const team = teamData || [];

  const openPositionsCount = stats?.open_positions ?? (jobsData?.total || 0);
  const applicationsCount = stats?.total_applications ?? (applicationsData?.total || 0);
  const teamMembersCount = stats?.total_team ?? team.length;

  return (
    <DashboardLayout title="HR" breadcrumbs={[{ label: 'HR' }]}>
      <div className="space-y-6">
        {/* ── Dashboard Statistics Cards ───────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            title="Open Positions"
            value={openPositionsCount}
            icon={<Briefcase className="w-5 h-5" />}
            color="blue"
          />
          <StatCard
            title="Applications"
            value={applicationsCount}
            icon={<Users className="w-5 h-5" />}
            color="orange"
          />
          <StatCard
            title="Team Members"
            value={teamMembersCount}
            icon={<UserCheck className="w-5 h-5" />}
            color="green"
          />
        </div>

        {/* ── Navigation Tabs ──────────────────────────────────── */}
        <TabBar
          tabs={[
            { id: 'jobs', label: 'Job Openings', count: openPositionsCount },
            { id: 'applications', label: 'Applications', count: applicationsCount },
            { id: 'team', label: 'Team', count: teamMembersCount },
          ]}
          active={tab}
          onChange={(newTab) => {
            setTab(newTab);
            setPage(1);
          }}
        />

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 1: JOB OPENINGS                                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === 'jobs' && (
          <Card padding={false} className="shadow-sm">
            {/* Header Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 sm:p-5 border-b border-slate-100 gap-3">
              <h3 className="font-semibold text-slate-800 text-lg">Job Openings</h3>
              <div className="flex items-center gap-3">
                <SearchInput
                  value={searchJobs}
                  onChange={(v) => {
                    setSearchJobs(v);
                    setPage(1);
                  }}
                  placeholder="Search jobs..."
                  className="w-48 sm:w-64"
                />
                <Button
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => {
                    resetJobForm();
                    setShowCreateJob(true);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  Post Job
                </Button>
              </div>
            </div>

            {/* Jobs Table */}
            <Table
              headers={[
                'TITLE',
                'DEPARTMENT',
                'TYPE',
                'LOCATION',
                'SALARY',
                'POSITIONS',
                'APPLICANTS',
                'POSTED',
                '',
              ]}
              loading={jobsLoading}
              empty={!jobs.length}
              emptyMessage="No job openings found matching your criteria"
            >
              {jobs.map((j: any) => (
                <Tr key={j.id}>
                  <Td>
                    <div className="space-y-1">
                      <p className="font-medium text-slate-900 leading-snug">{j.title}</p>
                      {j.is_featured && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-600 border border-blue-200">
                          Featured
                        </span>
                      )}
                    </div>
                  </Td>
                  <Td>
                    <span className="text-slate-700 font-normal">
                      {j.department_name || '—'}
                    </span>
                  </Td>
                  <Td>
                    <StatusBadge status={j.employment_type} />
                  </Td>
                  <Td>
                    <span className="capitalize text-slate-700">
                      {j.location_type?.replace(/_/g, ' ') || j.location || 'Remote'}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-slate-700 font-medium">
                      {j.salary_min && j.salary_max
                        ? `$${Math.round(j.salary_min / 1000)}k–$${Math.round(j.salary_max / 1000)}k`
                        : j.salary_min
                        ? `From $${Math.round(j.salary_min / 1000)}k`
                        : '—'}
                    </span>
                  </Td>
                  <Td>
                    <span className="text-slate-700 font-medium">{j.positions || 1}</span>
                  </Td>
                  <Td>
                    <button
                      onClick={() => {
                        setAppJobFilter(j.id);
                        setTab('applications');
                        setPage(1);
                      }}
                      className="text-blue-600 hover:underline font-medium hover:text-blue-800"
                      title="View applications for this job"
                    >
                      {j.applicant_count ?? 0}
                    </button>
                  </Td>
                  <Td>
                    <span className="text-slate-500 whitespace-nowrap">
                      {timeAgo(j.created_at)}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-4 h-4 text-slate-500" />}
                        onClick={() => setViewingJob(j)}
                      >
                        View
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Edit className="w-4 h-4 text-slate-500" />}
                        onClick={() => handleEditJobClick(j)}
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Trash2 className="w-4 h-4 text-red-500" />}
                        onClick={() => setDeletingJob(j)}
                      />
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>

            <Pagination
              page={page}
              totalPages={Math.ceil((jobsData?.total || 0) / 20)}
              onPageChange={setPage}
              total={jobsData?.total}
              limit={20}
            />
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 2: APPLICATIONS                                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === 'applications' && (
          <Card padding={false} className="shadow-sm">
            {/* Filter toolbar */}
            <div className="flex flex-wrap items-center gap-3 p-4 border-b border-slate-100">
              <SearchInput
                value={searchApps}
                onChange={(v) => {
                  setSearchApps(v);
                  setPage(1);
                }}
                placeholder="Search candidates or jobs..."
                className="flex-1 min-w-[200px] max-w-xs"
              />
              <Select
                options={[
                  { value: '', label: 'All Openings' },
                  ...jobs.map((j: any) => ({ value: j.id, label: j.title })),
                ]}
                value={appJobFilter}
                onChange={(e) => {
                  setAppJobFilter(e.target.value);
                  setPage(1);
                }}
                className="w-48 text-sm"
              />
              <Select
                options={[
                  { value: '', label: 'All Stages' },
                  ...APPLICATION_STAGES,
                ]}
                value={appStageFilter}
                onChange={(e) => {
                  setAppStageFilter(e.target.value);
                  setPage(1);
                }}
                className="w-40 text-sm"
              />
              {(searchApps || appJobFilter || appStageFilter) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchApps('');
                    setAppJobFilter('');
                    setAppStageFilter('');
                    setPage(1);
                  }}
                >
                  Reset
                </Button>
              )}
            </div>

            {/* Applications Table */}
            <Table
              headers={['APPLICANT', 'POSITION', 'STAGE', 'RATING', 'APPLIED', '']}
              loading={appsLoading}
              empty={!applications.length}
              emptyMessage="No applications found"
            >
              {applications.map((a: any) => (
                <Tr key={a.id}>
                  <Td>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {a.first_name} {a.last_name}
                      </p>
                      <p className="text-xs text-slate-500">{a.email}</p>
                    </div>
                  </Td>
                  <Td>
                    <p className="text-slate-800 font-medium max-w-xs truncate">
                      {a.job_title}
                    </p>
                    {a.department_name && (
                      <p className="text-xs text-slate-500">{a.department_name}</p>
                    )}
                  </Td>
                  <Td>
                    <StatusBadge status={a.stage} />
                  </Td>
                  <Td>
                    {a.rating ? (
                      <span className="text-amber-500 text-sm font-semibold tracking-wide">
                        {'★'.repeat(a.rating)}
                        <span className="text-slate-300">{'★'.repeat(5 - a.rating)}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 text-sm">—</span>
                    )}
                  </Td>
                  <Td>
                    <span className="text-slate-500 whitespace-nowrap">
                      {timeAgo(a.applied_at)}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={<Eye className="w-4 h-4 text-slate-500" />}
                        onClick={() => setReviewingApp(a)}
                      >
                        Review
                      </Button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </Table>

            <Pagination
              page={page}
              totalPages={Math.ceil((applicationsData?.total || 0) / 20)}
              onPageChange={setPage}
              total={applicationsData?.total}
              limit={20}
            />
          </Card>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB 3: TEAM                                            */}
        {/* ═══════════════════════════════════════════════════════ */}
        {tab === 'team' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <SearchInput
                  value={searchTeam}
                  onChange={setSearchTeam}
                  placeholder="Search team members..."
                  className="w-full"
                />
              </div>
              <Button
                size="sm"
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  resetTeamForm();
                  setShowCreateTeam(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                Add Member
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {team.map((m: any) => (
                <Card
                  key={m.id}
                  className="text-center p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative"
                >
                  <div>
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold mx-auto mb-3 shadow-inner">
                      {(m.name || m.first_name || m.designation)?.[0] || '?'}
                    </div>
                    <p className="font-semibold text-slate-900 text-base leading-tight">
                      {m.name ||
                        `${m.first_name || ''} ${m.last_name || ''}`.trim() ||
                        'Team Member'}
                    </p>
                    <p className="text-sm font-medium text-slate-600 mt-1">
                      {m.designation}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {m.department || m.department_name}
                    </p>

                    <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
                      {m.is_featured && <Badge variant="info">Featured</Badge>}
                      <Badge variant={m.is_active !== false ? 'success' : 'default'}>
                        {m.is_active !== false ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>

                    {m.bio && (
                      <p className="text-xs text-slate-500 mt-3 line-clamp-2 px-2 text-left">
                        {m.bio}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-center gap-2 mt-5 pt-3 border-t border-slate-100">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Edit className="w-3.5 h-3.5 text-slate-600" />}
                      onClick={() => handleEditTeamClick(m)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<Trash2 className="w-3.5 h-3.5 text-red-500" />}
                      onClick={() => setDeletingTeam(m)}
                    >
                      Delete
                    </Button>
                  </div>
                </Card>
              ))}

              {!team.length && !teamLoading && (
                <div className="col-span-full py-12">
                  <EmptyState
                    icon={<Users className="w-8 h-8" />}
                    title="No team members found"
                    description="Get started by adding your first active team member."
                    action={
                      <Button
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                        onClick={() => {
                          resetTeamForm();
                          setShowCreateTeam(true);
                        }}
                      >
                        Add Member
                      </Button>
                    }
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════════════════ */}
      {/* MODALS                                                 */}
      {/* ═══════════════════════════════════════════════════════ */}

      {/* 1. Post Job Modal */}
      <Modal
        open={showCreateJob}
        onClose={() => setShowCreateJob(false)}
        title="Post Job Opening"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateJob(false)}>
              Cancel
            </Button>
            <Button
              loading={createJobMutation.isPending}
              disabled={!jobForm.title.trim() || !jobForm.description.trim()}
              onClick={() => createJobMutation.mutate()}
            >
              Post Job
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Job Title *"
              value={jobForm.title}
              onChange={(e) => setJ('title', e.target.value)}
              placeholder="e.g. Senior Full-Stack Engineer"
            />
          </div>
          <Select
            label="Department"
            options={[
              { value: '', label: 'Select department' },
              ...departments.map((d: any) => ({ value: d.id, label: d.name })),
            ]}
            value={jobForm.department_id}
            onChange={(e) => setJ('department_id', e.target.value)}
          />
          <Select
            label="Employment Type"
            options={EMPLOYMENT_TYPES}
            value={jobForm.employment_type}
            onChange={(e) => setJ('employment_type', e.target.value)}
          />
          <Select
            label="Workplace Type"
            options={LOCATION_TYPES}
            value={jobForm.location_type}
            onChange={(e) => setJ('location_type', e.target.value)}
          />
          <Input
            label="Location"
            value={jobForm.location}
            onChange={(e) => setJ('location', e.target.value)}
            placeholder="e.g. Remote or San Francisco, CA"
          />
          <Input
            label="Positions"
            type="number"
            value={jobForm.positions}
            onChange={(e) => setJ('positions', e.target.value)}
            min="1"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Salary ($)"
              type="number"
              value={jobForm.salary_min}
              onChange={(e) => setJ('salary_min', e.target.value)}
              placeholder="e.g. 100000"
            />
            <Input
              label="Max Salary ($)"
              type="number"
              value={jobForm.salary_max}
              onChange={(e) => setJ('salary_max', e.target.value)}
              placeholder="e.g. 140000"
            />
          </div>
          <div className="col-span-2">
            <Textarea
              label="Description *"
              value={jobForm.description}
              onChange={(e) => setJ('description', e.target.value)}
              rows={4}
              placeholder="Describe the role, expectations, and core mission..."
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="is_featured"
              checked={jobForm.is_featured}
              onChange={(e) => setJ('is_featured', e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="is_featured" className="text-sm font-medium text-slate-700">
              Feature this job posting prominently
            </label>
          </div>
        </div>
      </Modal>

      {/* 2. Edit Job Modal */}
      <Modal
        open={!!editingJob}
        onClose={() => setEditingJob(null)}
        title="Edit Job Opening"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingJob(null)}>
              Cancel
            </Button>
            <Button
              loading={updateJobMutation.isPending}
              disabled={!jobForm.title.trim() || !jobForm.description.trim()}
              onClick={() => updateJobMutation.mutate(editingJob.id)}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Input
              label="Job Title *"
              value={jobForm.title}
              onChange={(e) => setJ('title', e.target.value)}
            />
          </div>
          <Select
            label="Department"
            options={[
              { value: '', label: 'Select department' },
              ...departments.map((d: any) => ({ value: d.id, label: d.name })),
            ]}
            value={jobForm.department_id}
            onChange={(e) => setJ('department_id', e.target.value)}
          />
          <Select
            label="Employment Type"
            options={EMPLOYMENT_TYPES}
            value={jobForm.employment_type}
            onChange={(e) => setJ('employment_type', e.target.value)}
          />
          <Select
            label="Workplace Type"
            options={LOCATION_TYPES}
            value={jobForm.location_type}
            onChange={(e) => setJ('location_type', e.target.value)}
          />
          <Input
            label="Location"
            value={jobForm.location}
            onChange={(e) => setJ('location', e.target.value)}
          />
          <Input
            label="Positions"
            type="number"
            value={jobForm.positions}
            onChange={(e) => setJ('positions', e.target.value)}
            min="1"
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Min Salary ($)"
              type="number"
              value={jobForm.salary_min}
              onChange={(e) => setJ('salary_min', e.target.value)}
            />
            <Input
              label="Max Salary ($)"
              type="number"
              value={jobForm.salary_max}
              onChange={(e) => setJ('salary_max', e.target.value)}
            />
          </div>
          <div className="col-span-2">
            <Textarea
              label="Description *"
              value={jobForm.description}
              onChange={(e) => setJ('description', e.target.value)}
              rows={4}
            />
          </div>
          <div className="col-span-2 flex items-center gap-2">
            <input
              type="checkbox"
              id="edit_is_featured"
              checked={jobForm.is_featured}
              onChange={(e) => setJ('is_featured', e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <label htmlFor="edit_is_featured" className="text-sm font-medium text-slate-700">
              Featured job posting
            </label>
          </div>
        </div>
      </Modal>

      {/* 3. View Job Modal */}
      <Modal
        open={!!viewingJob}
        onClose={() => setViewingJob(null)}
        title={viewingJob?.title || 'Job Opening Details'}
        size="lg"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => {
                const j = viewingJob;
                setViewingJob(null);
                setAppJobFilter(j.id);
                setTab('applications');
                setPage(1);
              }}
            >
              View All Applicants ({viewingJob?.applicant_count ?? 0})
            </Button>
            <Button
              onClick={() => {
                const j = viewingJob;
                setViewingJob(null);
                handleEditJobClick(j);
              }}
            >
              Edit Job
            </Button>
          </>
        }
      >
        {viewingJob && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={viewingJob.employment_type} />
              <Badge variant="default" className="capitalize">
                {viewingJob.location_type?.replace(/_/g, ' ') || 'Remote'}
              </Badge>
              {viewingJob.is_featured && <Badge variant="info">Featured</Badge>}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div>
                <span className="text-slate-500 block">Department</span>
                <span className="font-semibold text-slate-800">
                  {viewingJob.department_name || '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Salary Range</span>
                <span className="font-semibold text-slate-800">
                  {viewingJob.salary_min && viewingJob.salary_max
                    ? `$${Math.round(viewingJob.salary_min / 1000)}k – $${Math.round(
                        viewingJob.salary_max / 1000
                      )}k / year`
                    : '—'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Openings</span>
                <span className="font-semibold text-slate-800">
                  {viewingJob.positions || 1} positions
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Posted</span>
                <span className="font-semibold text-slate-800">
                  {formatDate(viewingJob.created_at, 'MMM d, yyyy')} ({timeAgo(viewingJob.created_at)})
                </span>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1">Description</h4>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {viewingJob.description || 'No description provided.'}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* 4. Delete Job Confirmation */}
      <Modal
        open={!!deletingJob}
        onClose={() => setDeletingJob(null)}
        title="Archive Job Opening"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingJob(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteJobMutation.isPending}
              onClick={() => deleteJobMutation.mutate(deletingJob.id)}
            >
              Archive Job
            </Button>
          </>
        }
      >
        <p className="text-slate-700 text-sm">
          Are you sure you want to archive <strong>{deletingJob?.title}</strong>? This job
          posting will be unpublished and marked as archived.
        </p>
      </Modal>

      {/* 5. Review Application Modal */}
      <Modal
        open={!!reviewingApp}
        onClose={() => setReviewingApp(null)}
        title="Candidate Application Review"
        size="lg"
        footer={
          <Button variant="outline" onClick={() => setReviewingApp(null)}>
            Close
          </Button>
        }
      >
        {reviewingApp && (
          <div className="space-y-5">
            {/* Candidate Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  {reviewingApp.first_name} {reviewingApp.last_name}
                </h3>
                <p className="text-sm text-blue-600 font-medium">
                  Applied for: {reviewingApp.job_title}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Submitted {timeAgo(reviewingApp.applied_at)}
                </p>
              </div>

              {/* Status & Rating Control */}
              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">Stage</label>
                  <Select
                    options={APPLICATION_STAGES}
                    value={reviewingApp.stage}
                    onChange={(e) =>
                      updateAppMutation.mutate({
                        id: reviewingApp.id,
                        data: { stage: e.target.value },
                      })
                    }
                    className="text-xs py-1.5"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 block">Rating</label>
                  <Select
                    options={[
                      { value: '1', label: '1 Star' },
                      { value: '2', label: '2 Stars' },
                      { value: '3', label: '3 Stars' },
                      { value: '4', label: '4 Stars' },
                      { value: '5', label: '5 Stars' },
                    ]}
                    value={String(reviewingApp.rating || '3')}
                    onChange={(e) =>
                      updateAppMutation.mutate({
                        id: reviewingApp.id,
                        data: { rating: parseInt(e.target.value) },
                      })
                    }
                    className="text-xs py-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Candidate Contact & Profile Details */}
            <div className="grid grid-cols-2 gap-3 text-sm bg-slate-50 p-4 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-700">
                <Mail className="w-4 h-4 text-slate-400" />
                <span>{reviewingApp.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Phone className="w-4 h-4 text-slate-400" />
                <span>{reviewingApp.phone || 'Phone not provided'}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Globe className="w-4 h-4 text-slate-400" />
                {reviewingApp.linkedin_url ? (
                  <a
                    href={reviewingApp.linkedin_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    LinkedIn Profile <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">LinkedIn not provided</span>
                )}
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Globe className="w-4 h-4 text-slate-400" />
                {reviewingApp.portfolio_url ? (
                  <a
                    href={reviewingApp.portfolio_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline flex items-center gap-1"
                  >
                    Portfolio / Website <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="text-slate-400">Portfolio not provided</span>
                )}
              </div>
            </div>

            {/* Resume Attachment */}
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-2">Resume / Attachment</h4>
              {reviewingApp.resume_url ? (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>Candidate Resume</span>
                  </div>
                  <a
                    href={reviewingApp.resume_url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-white px-3 py-1.5 rounded-md border border-blue-300 hover:bg-blue-100 transition-colors"
                  >
                    View Resume <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                  No resume file uploaded for this application.
                </p>
              )}
            </div>

            {/* Cover Letter */}
            <div>
              <h4 className="text-sm font-semibold text-slate-800 mb-1">Cover Letter</h4>
              <p className="text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {reviewingApp.cover_letter || 'No cover letter was submitted with this application.'}
              </p>
            </div>

            {/* Internal Notes */}
            <div className="border-t border-slate-200 pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-slate-800">Add Internal Note</h4>
              <div className="flex gap-2">
                <Input
                  value={appNotesText}
                  onChange={(e) => setAppNotesText(e.target.value)}
                  placeholder="Record interview notes or feedback..."
                  className="flex-1"
                />
                <Button
                  size="sm"
                  disabled={!appNotesText.trim()}
                  loading={addNoteMutation.isPending}
                  onClick={() =>
                    addNoteMutation.mutate({
                      id: reviewingApp.id,
                      content: appNotesText,
                    })
                  }
                >
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* 6. Add Team Member Modal */}
      <Modal
        open={showCreateTeam}
        onClose={() => setShowCreateTeam(false)}
        title="Add Team Member"
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreateTeam(false)}>
              Cancel
            </Button>
            <Button
              loading={createTeamMutation.isPending}
              disabled={!teamForm.name.trim() || !teamForm.designation.trim()}
              onClick={() => createTeamMutation.mutate()}
            >
              Add Member
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name *"
            value={teamForm.name}
            onChange={(e) => setT('name', e.target.value)}
            placeholder="e.g. Dr. Aris Thorne"
          />
          <Input
            label="Designation *"
            value={teamForm.designation}
            onChange={(e) => setT('designation', e.target.value)}
            placeholder="e.g. Chief Technology Officer"
          />
          <Select
            label="Department"
            options={[
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Product & Design', label: 'Product & Design' },
              { value: 'Marketing & Growth', label: 'Marketing & Growth' },
              { value: 'Customer Success', label: 'Customer Success' },
              { value: 'Operations', label: 'Operations' },
            ]}
            value={teamForm.department}
            onChange={(e) => setT('department', e.target.value)}
          />
          <Textarea
            label="Bio / Background"
            value={teamForm.bio}
            onChange={(e) => setT('bio', e.target.value)}
            rows={3}
            placeholder="Brief bio or professional highlight..."
          />
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={teamForm.is_featured}
                onChange={(e) => setT('is_featured', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              Featured Member
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={teamForm.is_active}
                onChange={(e) => setT('is_active', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              Active Employee
            </label>
          </div>
        </div>
      </Modal>

      {/* 7. Edit Team Member Modal */}
      <Modal
        open={!!editingTeam}
        onClose={() => setEditingTeam(null)}
        title="Edit Team Member"
        footer={
          <>
            <Button variant="outline" onClick={() => setEditingTeam(null)}>
              Cancel
            </Button>
            <Button
              loading={updateTeamMutation.isPending}
              disabled={!teamForm.name.trim() || !teamForm.designation.trim()}
              onClick={() =>
                updateTeamMutation.mutate({
                  id: editingTeam.id,
                  data: teamForm,
                })
              }
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Full Name *"
            value={teamForm.name}
            onChange={(e) => setT('name', e.target.value)}
          />
          <Input
            label="Designation *"
            value={teamForm.designation}
            onChange={(e) => setT('designation', e.target.value)}
          />
          <Select
            label="Department"
            options={[
              { value: 'Engineering', label: 'Engineering' },
              { value: 'Product & Design', label: 'Product & Design' },
              { value: 'Marketing & Growth', label: 'Marketing & Growth' },
              { value: 'Customer Success', label: 'Customer Success' },
              { value: 'Operations', label: 'Operations' },
            ]}
            value={teamForm.department}
            onChange={(e) => setT('department', e.target.value)}
          />
          <Textarea
            label="Bio / Background"
            value={teamForm.bio}
            onChange={(e) => setT('bio', e.target.value)}
            rows={3}
          />
          <div className="flex items-center gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={teamForm.is_featured}
                onChange={(e) => setT('is_featured', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              Featured Member
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={teamForm.is_active}
                onChange={(e) => setT('is_active', e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
              />
              Active Employee
            </label>
          </div>
        </div>
      </Modal>

      {/* 8. Delete Team Member Modal */}
      <Modal
        open={!!deletingTeam}
        onClose={() => setDeletingTeam(null)}
        title="Archive Team Member"
        footer={
          <>
            <Button variant="outline" onClick={() => setDeletingTeam(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={deleteTeamMutation.isPending}
              onClick={() => deleteTeamMutation.mutate(deletingTeam.id)}
            >
              Archive Member
            </Button>
          </>
        }
      >
        <p className="text-slate-700 text-sm">
          Are you sure you want to deactivate and archive <strong>{deletingTeam?.name}</strong>?
          They will no longer be listed as an active team member.
        </p>
      </Modal>
    </DashboardLayout>
  );
}
