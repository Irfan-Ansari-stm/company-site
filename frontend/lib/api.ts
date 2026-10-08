import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

export const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor — refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_BASE}/auth/refresh`, { refreshToken });
        localStorage.setItem('accessToken', data.data.accessToken);
        localStorage.setItem('refreshToken', data.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── AUTH ────────────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  logout: (refreshToken?: string) =>
    api.post('/auth/logout', { refreshToken }),
  refresh: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
  me: () => api.get('/auth/me'),
  updateMe: (data: any) => api.patch('/auth/me', data),
  changePassword: (currentPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { currentPassword, newPassword }),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  verifyEmail: (token: string) =>
    api.get(`/auth/verify-email?token=${token}`),
  getSessions: () => api.get('/auth/sessions'),
  deleteSession: (id: string) => api.delete(`/auth/sessions/${id}`),
  setup2FA: () => api.post('/auth/2fa/setup'),
  enable2FA: (code: string) => api.post('/auth/2fa/enable', { code }),
  disable2FA: (code: string) => api.post('/auth/2fa/disable', { code }),
  verify2FA: (partialToken: string, code: string) =>
    api.post('/auth/2fa/verify', { partialToken, code }),
};

// ─── USERS ───────────────────────────────────────────────────
export const usersApi = {
  list: (params?: any) => api.get('/users', { params }),
  get: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
  resetPassword: (id: string, password: string) =>
    api.post(`/users/${id}/reset-password`, { password }),
  activity: (id: string) => api.get(`/users/${id}/activity`),

  // Roles
  getRoles: () => api.get('/roles'),
  createRole: (data: any) => api.post('/roles', data),
  updateRole: (id: string, data: any) => api.patch(`/roles/${id}`, data),
  deleteRole: (id: string) => api.delete(`/roles/${id}`),
  getRolePermissions: (id: string) => api.get(`/roles/${id}/permissions`),
  updateRolePermissions: (id: string, permission_ids: string[]) =>
    api.put(`/roles/${id}/permissions`, { permission_ids }),
  assignRole: (roleId: string, user_id: string) =>
    api.post(`/roles/${roleId}/users`, { user_id }),
  removeRole: (roleId: string, userId: string) =>
    api.delete(`/roles/${roleId}/users/${userId}`),

  // Permissions
  getPermissions: (module?: string) =>
    api.get('/permissions', { params: { module } }),
};

// ─── CRM ─────────────────────────────────────────────────────
export const crmApi = {
  // Leads
  getLeads: (params?: any) => api.get('/crm/leads', { params }),
  getLead: (id: string) => api.get(`/crm/leads/${id}`),
  createLead: (data: any) => api.post('/crm/leads', data),
  submitPublicLead: (data: any) => api.post('/crm/leads/public', data),
  updateLead: (id: string, data: any) => api.patch(`/crm/leads/${id}`, data),
  deleteLead: (id: string) => api.delete(`/crm/leads/${id}`),
  convertLead: (id: string) => api.post(`/crm/leads/${id}/convert`),
  assignLead: (id: string, user_id: string) =>
    api.post(`/crm/leads/${id}/assign`, { user_id }),
  getLeadPipeline: (assigned_to?: string) =>
    api.get('/crm/leads/pipeline', { params: { assigned_to } }),
  getLeadFunnel: () => api.get('/crm/leads/funnel'),
  getLeadSourceStats: () => api.get('/crm/leads/source-stats'),

  // Lead Notes
  getLeadNotes: (id: string) => api.get(`/crm/leads/${id}/notes`),
  addLeadNote: (id: string, data: any) =>
    api.post(`/crm/leads/${id}/notes`, data),
  updateLeadNote: (leadId: string, noteId: string, data: any) =>
    api.patch(`/crm/leads/${leadId}/notes/${noteId}`, data),
  deleteLeadNote: (leadId: string, noteId: string) =>
    api.delete(`/crm/leads/${leadId}/notes/${noteId}`),

  // Lead Activities
  getLeadActivities: (id: string, params?: any) =>
    api.get(`/crm/leads/${id}/activities`, { params }),
  addLeadActivity: (id: string, data: any) =>
    api.post(`/crm/leads/${id}/activities`, data),

  // Meetings
  getMeetings: (params?: any) => api.get('/crm/meetings', { params }),
  getMeeting: (id: string) => api.get(`/crm/meetings/${id}`),
  createMeeting: (data: any) => api.post('/crm/meetings', data),
  updateMeeting: (id: string, data: any) => api.patch(`/crm/meetings/${id}`, data),
  deleteMeeting: (id: string) => api.delete(`/crm/meetings/${id}`),

  // Proposals
  getProposals: (params?: any) => api.get('/crm/proposals', { params }),
  getProposal: (id: string) => api.get(`/crm/proposals/${id}`),
  createProposal: (data: any) => api.post('/crm/proposals', data),
  updateProposal: (id: string, data: any) => api.patch(`/crm/proposals/${id}`, data),
  sendProposal: (id: string) => api.post(`/crm/proposals/${id}/send`),
  deleteProposal: (id: string) => api.delete(`/crm/proposals/${id}`),

  // Accounts
  getAccounts: (params?: any) => api.get('/crm/accounts', { params }),
  getAccount: (id: string) => api.get(`/crm/accounts/${id}`),
  createAccount: (data: any) => api.post('/crm/accounts', data),
  updateAccount: (id: string, data: any) => api.patch(`/crm/accounts/${id}`, data),

  // Contacts
  getContacts: (params?: any) => api.get('/crm/contacts', { params }),
  createContact: (data: any) => api.post('/crm/contacts', data),

  // Pipelines
  getPipelines: () => api.get('/crm/pipelines'),
  createPipeline: (data: any) => api.post('/crm/pipelines', data),
};

// ─── PROJECTS ────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: any) => api.get('/projects', { params }),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  dashboard: () => api.get('/projects/dashboard'),
  overdue: () => api.get('/projects/overdue'),

  // Members
  getMembers: (id: string) => api.get(`/projects/${id}/members`),
  addMember: (id: string, data: any) => api.post(`/projects/${id}/members`, data),
  removeMember: (id: string, userId: string) =>
    api.delete(`/projects/${id}/members/${userId}`),

  // Milestones
  getMilestones: (id: string) => api.get(`/projects/${id}/milestones`),
  createMilestone: (id: string, data: any) =>
    api.post(`/projects/${id}/milestones`, data),
  updateMilestone: (id: string, milestoneId: string, data: any) =>
    api.patch(`/projects/${id}/milestones/${milestoneId}`, data),
  deleteMilestone: (id: string, milestoneId: string) =>
    api.delete(`/projects/${id}/milestones/${milestoneId}`),

  // Files
  getFiles: (id: string) => api.get(`/projects/${id}/files`),
  addFile: (id: string, data: any) => api.post(`/projects/${id}/files`, data),
  deleteFile: (id: string, fileId: string) =>
    api.delete(`/projects/${id}/files/${fileId}`),
};

// ─── TASKS ───────────────────────────────────────────────────
export const tasksApi = {
  list: (params?: any) => api.get('/tasks', { params }),
  myTasks: () => api.get('/tasks/my'),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  addComment: (id: string, data: any) => api.post(`/tasks/${id}/comments`, data),
  updateComment: (id: string, commentId: string, data: any) =>
    api.patch(`/tasks/${id}/comments/${commentId}`, data),
  deleteComment: (id: string, commentId: string) =>
    api.delete(`/tasks/${id}/comments/${commentId}`),
  addAttachment: (id: string, media_id: string) =>
    api.post(`/tasks/${id}/attachments`, { media_id }),
  removeAttachment: (id: string, attachId: string) =>
    api.delete(`/tasks/${id}/attachments/${attachId}`),
};

// ─── SPRINTS ─────────────────────────────────────────────────
export const sprintsApi = {
  list: (params?: any) => api.get('/sprints', { params }),
  get: (id: string) => api.get(`/sprints/${id}`),
  create: (data: any) => api.post('/sprints', data),
  update: (id: string, data: any) => api.patch(`/sprints/${id}`, data),
};

// ─── TIME ENTRIES ────────────────────────────────────────────
export const timeApi = {
  list: (params?: any) => api.get('/time-entries', { params }),
  myEntries: (params?: any) => api.get('/time-entries/my', { params }),
  create: (data: any) => api.post('/time-entries', data),
  update: (id: string, data: any) => api.patch(`/time-entries/${id}`, data),
  delete: (id: string) => api.delete(`/time-entries/${id}`),
  summary: (params?: any) => api.get('/time-entries/summary', { params }),
};

// ─── FINANCE ─────────────────────────────────────────────────
export const financeApi = {
  // Invoices
  getInvoices: (params?: any) => api.get('/finance/invoices', { params }),
  getInvoice: (id: string) => api.get(`/finance/invoices/${id}`),
  createInvoice: (data: any) => api.post('/finance/invoices', data),
  updateInvoice: (id: string, data: any) => api.patch(`/finance/invoices/${id}`, data),
  sendInvoice: (id: string) => api.post(`/finance/invoices/${id}/send`),
  deleteInvoice: (id: string) => api.delete(`/finance/invoices/${id}`),
  getInvoiceSummary: () => api.get('/finance/invoices/summary'),
  getOverdueInvoices: () => api.get('/finance/invoices/overdue'),

  // Payments
  getPayments: (params?: any) => api.get('/finance/payments', { params }),
  getPayment: (id: string) => api.get(`/finance/payments/${id}`),
  createPayment: (data: any) => api.post('/finance/payments', data),
  updatePayment: (id: string, data: any) => api.patch(`/finance/payments/${id}`, data),

  // Expenses
  getExpenses: (params?: any) => api.get('/finance/expenses', { params }),
  createExpense: (data: any) => api.post('/finance/expenses', data),
  updateExpense: (id: string, data: any) => api.patch(`/finance/expenses/${id}`, data),
  deleteExpense: (id: string) => api.delete(`/finance/expenses/${id}`),

  // Subscriptions
  getSubscriptions: (params?: any) => api.get('/finance/subscriptions', { params }),
  createSubscription: (data: any) => api.post('/finance/subscriptions', data),
  updateSubscription: (id: string, data: any) =>
    api.patch(`/finance/subscriptions/${id}`, data),
  getPlans: () => api.get('/finance/subscription-plans'),
  createPlan: (data: any) => api.post('/finance/subscription-plans', data),

  // Quotes
  getQuotes: (params?: any) => api.get('/finance/quotes', { params }),
  createQuote: (data: any) => api.post('/finance/quotes', data),
  updateQuote: (id: string, data: any) => api.patch(`/finance/quotes/${id}`, data),

  // Reports
  getRevenueReport: (params?: any) =>
    api.get('/finance/reports/revenue', { params }),
  getProfitabilityReport: (params?: any) =>
    api.get('/finance/reports/profitability', { params }),
  getAgingReport: () => api.get('/finance/reports/aging'),
  getCashFlowReport: (params?: any) =>
    api.get('/finance/reports/cash-flow', { params }),
};

// ─── CLIENTS ─────────────────────────────────────────────────
export const clientsApi = {
  list: (params?: any) => api.get('/clients', { params }),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.patch(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
  getContacts: (id: string) => api.get(`/clients/${id}/contacts`),
  addContact: (id: string, data: any) => api.post(`/clients/${id}/contacts`, data),
  removeContact: (id: string, contactId: string) =>
    api.delete(`/clients/${id}/contacts/${contactId}`),
  getPortalAccess: (id: string) => api.get(`/clients/${id}/portal`),
  grantPortalAccess: (id: string, data: any) =>
    api.post(`/clients/${id}/portal`, data),
  getNotes: (id: string) => api.get(`/clients/${id}/notes`),
  addNote: (id: string, data: any) => api.post(`/clients/${id}/notes`, data),
};

// ─── SUPPORT ─────────────────────────────────────────────────
export const supportApi = {
  getTickets: (params?: any) => api.get('/support/tickets', { params }),
  getTicket: (id: string) => api.get(`/support/tickets/${id}`),
  createTicket: (data: any) => api.post('/support/tickets', data),
  updateTicket: (id: string, data: any) => api.patch(`/support/tickets/${id}`, data),
  getTicketStats: () => api.get('/support/tickets/stats'),
  addReply: (id: string, data: any) =>
    api.post(`/support/tickets/${id}/replies`, data),
  updateReply: (id: string, replyId: string, data: any) =>
    api.patch(`/support/tickets/${id}/replies/${replyId}`, data),
  deleteReply: (id: string, replyId: string) =>
    api.delete(`/support/tickets/${id}/replies/${replyId}`),
  rateTicket: (id: string, rating: number, feedback?: string) =>
    api.post(`/support/tickets/${id}/rate`, { rating, feedback }),

  // Knowledge Base
  getKBArticles: (params?: any) => api.get('/support/kb', { params }),
  getKBArticle: (slugOrId: string) => api.get(`/support/kb/${slugOrId}`),
  createKBArticle: (data: any) => api.post('/support/kb', data),
};

// ─── HR ──────────────────────────────────────────────────────
export const hrApi = {
  getDepartments: () => api.get('/hr/departments'),
  createDepartment: (data: any) => api.post('/hr/departments', data),

  getJobs: (params?: any) => api.get('/hr/jobs', { params }),
  getJob: (slugOrId: string) => api.get(`/hr/jobs/${slugOrId}`),
  createJob: (data: any) => api.post('/hr/jobs', data),
  updateJob: (id: string, data: any) => api.patch(`/hr/jobs/${id}`, data),
  deleteJob: (id: string) => api.delete(`/hr/jobs/${id}`),

  getApplications: (params?: any) => api.get('/hr/applications', { params }),
  getApplication: (id: string) => api.get(`/hr/applications/${id}`),
  applyForJob: (jobId: string, data: any) =>
    api.post(`/hr/jobs/${jobId}/apply`, data),
  updateApplication: (id: string, data: any) =>
    api.patch(`/hr/applications/${id}`, data),
  addInterview: (id: string, data: any) =>
    api.post(`/hr/applications/${id}/interviews`, data),
  updateInterview: (id: string, intId: string, data: any) =>
    api.patch(`/hr/applications/${id}/interviews/${intId}`, data),
  addApplicationNote: (id: string, content: string) =>
    api.post(`/hr/applications/${id}/notes`, { content }),

  getTeam: (params?: any) => api.get('/hr/team', { params }),
  addTeamMember: (data: any) => api.post('/hr/team', data),
  updateTeamMember: (id: string, data: any) => api.patch(`/hr/team/${id}`, data),
  removeTeamMember: (id: string) => api.delete(`/hr/team/${id}`),
};

// ─── BLOG ────────────────────────────────────────────────────
export const blogApi = {
  getCategories: () => api.get('/blog/categories'),
  createCategory: (data: any) => api.post('/blog/categories', data),
  updateCategory: (id: string, data: any) => api.patch(`/blog/categories/${id}`, data),

  getTags: () => api.get('/blog/tags'),
  getTagCloud: () => api.get('/blog/tags/cloud'),
  createTag: (data: any) => api.post('/blog/tags', data),

  getPosts: (params?: any) => api.get('/blog/posts', { params }),
  getPublishedPosts: () => api.get('/blog/posts/published'),
  getPost: (slugOrId: string) => api.get(`/blog/posts/${slugOrId}`),
  createPost: (data: any) => api.post('/blog/posts', data),
  updatePost: (id: string, data: any) => api.patch(`/blog/posts/${id}`, data),
  deletePost: (id: string) => api.delete(`/blog/posts/${id}`),
  likePost: (id: string) => api.post(`/blog/posts/${id}/like`),
  updateRelatedPosts: (id: string, related_post_ids: string[]) =>
    api.put(`/blog/posts/${id}/related`, { related_post_ids }),

  getResources: (params?: any) => api.get('/blog/resources', { params }),
  getResource: (slugOrId: string) => api.get(`/blog/resources/${slugOrId}`),
  createResource: (data: any) => api.post('/blog/resources', data),
  downloadResource: (id: string) => api.post(`/blog/resources/${id}/download`),
};

// ─── CMS ─────────────────────────────────────────────────────
export const cmsApi = {
  // Pages
  getPages: (params?: any) => api.get('/cms/pages', { params }),
  getPage: (slugOrId: string) => api.get(`/cms/pages/${slugOrId}`),
  createPage: (data: any) => api.post('/cms/pages', data),
  updatePage: (id: string, data: any) => api.patch(`/cms/pages/${id}`, data),
  deletePage: (id: string) => api.delete(`/cms/pages/${id}`),
  getPageSections: (id: string) => api.get(`/cms/pages/${id}/sections`),
  addPageSection: (id: string, data: any) =>
    api.post(`/cms/pages/${id}/sections`, data),
  updatePageSection: (pageId: string, sectionId: string, data: any) =>
    api.patch(`/cms/pages/${pageId}/sections/${sectionId}`, data),
  deletePageSection: (pageId: string, sectionId: string) =>
    api.delete(`/cms/pages/${pageId}/sections/${sectionId}`),
  getPageRevisions: (id: string) => api.get(`/cms/pages/${id}/revisions`),
  savePageRevision: (id: string, data: any) =>
    api.post(`/cms/pages/${id}/revisions`, data),

  // SEO
  getSEO: (params?: any) => api.get('/cms/seo', { params }),
  createSEO: (data: any) => api.post('/cms/seo', data),
  updateSEO: (id: string, data: any) => api.patch(`/cms/seo/${id}`, data),

  // Menus
  getMenus: (location?: string) =>
    api.get('/cms/menus', { params: { location } }),
  getMenu: (slugOrId: string) => api.get(`/cms/menus/${slugOrId}`),
  createMenu: (data: any) => api.post('/cms/menus', data),
  updateMenu: (id: string, data: any) => api.patch(`/cms/menus/${id}`, data),
  deleteMenu: (id: string) => api.delete(`/cms/menus/${id}`),

  // Redirects
  getRedirects: (params?: any) => api.get('/cms/redirects', { params }),
  createRedirect: (data: any) => api.post('/cms/redirects', data),
  deleteRedirect: (id: string) => api.delete(`/cms/redirects/${id}`),

  // Forms
  getForms: () => api.get('/cms/forms'),
  getForm: (slugOrId: string) => api.get(`/cms/forms/${slugOrId}`),
  createForm: (data: any) => api.post('/cms/forms', data),
  submitForm: (id: string, data: any) => api.post(`/cms/forms/${id}/submit`, { data }),
  getFormSubmissions: (id: string, params?: any) =>
    api.get(`/cms/forms/${id}/submissions`, { params }),

  // Testimonials
  getTestimonials: (params?: any) => api.get('/cms/testimonials', { params }),
  createTestimonial: (data: any) => api.post('/cms/testimonials', data),
  updateTestimonial: (id: string, data: any) =>
    api.patch(`/cms/testimonials/${id}`, data),
  deleteTestimonial: (id: string) => api.delete(`/cms/testimonials/${id}`),

  // Popups
  getPopups: () => api.get('/cms/popups'),
  createPopup: (data: any) => api.post('/cms/popups', data),
  updatePopup: (id: string, data: any) => api.patch(`/cms/popups/${id}`, data),
};

// ─── SERVICES ────────────────────────────────────────────────
export const servicesApi = {
  getCategories: () => api.get('/services/categories'),
  createCategory: (data: any) => api.post('/services/categories', data),
  updateCategory: (id: string, data: any) =>
    api.patch(`/services/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/services/categories/${id}`),

  getServices: (params?: any) => api.get('/services', { params }),
  getCatalog: () => api.get('/services/catalog'),
  getService: (slugOrId: string) => api.get(`/services/${slugOrId}`),
  createService: (data: any) => api.post('/services', data),
  updateService: (id: string, data: any) => api.patch(`/services/${id}`, data),
  deleteService: (id: string) => api.delete(`/services/${id}`),

  addFeature: (id: string, data: any) => api.post(`/services/${id}/features`, data),
  removeFeature: (id: string, featureId: string) =>
    api.delete(`/services/${id}/features/${featureId}`),

  getPackages: (id: string) => api.get(`/services/${id}/packages`),
  createPackage: (id: string, data: any) =>
    api.post(`/services/${id}/packages`, data),
  updatePackage: (id: string, pkgId: string, data: any) =>
    api.patch(`/services/${id}/packages/${pkgId}`, data),
  deletePackage: (id: string, pkgId: string) =>
    api.delete(`/services/${id}/packages/${pkgId}`),

  getIndustries: () => api.get('/industries'),
  getIndustry: (slugOrId: string) => api.get(`/industries/${slugOrId}`),
  createIndustry: (data: any) => api.post('/industries', data),

  getSolutions: () => api.get('/solutions'),
  getSolution: (slugOrId: string) => api.get(`/solutions/${slugOrId}`),
  createSolution: (data: any) => api.post('/solutions', data),
};

// ─── PORTFOLIO ───────────────────────────────────────────────
export const portfolioApi = {
  list: (params?: any) => api.get('/portfolio', { params }),
  get: (slugOrId: string) => api.get(`/portfolio/${slugOrId}`),
  create: (data: any) => api.post('/portfolio', data),
  update: (id: string, data: any) => api.patch(`/portfolio/${id}`, data),
  delete: (id: string) => api.delete(`/portfolio/${id}`),
  addGallery: (id: string, data: any) => api.post(`/portfolio/${id}/gallery`, data),
  removeGallery: (id: string, galleryId: string) =>
    api.delete(`/portfolio/${id}/gallery/${galleryId}`),
  addMetric: (id: string, data: any) =>
    api.post(`/portfolio/${id}/metrics`, data),
  removeMetric: (id: string, metricId: string) =>
    api.delete(`/portfolio/${id}/metrics/${metricId}`),
};

// ─── MARKETING ───────────────────────────────────────────────
export const marketingApi = {
  getSubscribers: (params?: any) => api.get('/marketing/subscribers', { params }),
  getSubscriber: (id: string) => api.get(`/marketing/subscribers/${id}`),
  subscribe: (data: any) => api.post('/marketing/subscribers/subscribe', data),
  unsubscribe: (email: string) =>
    api.post('/marketing/subscribers/unsubscribe', { email }),
  updateSubscriber: (id: string, data: any) =>
    api.patch(`/marketing/subscribers/${id}`, data),

  getLists: () => api.get('/marketing/lists'),
  createList: (data: any) => api.post('/marketing/lists', data),
  updateList: (id: string, data: any) => api.patch(`/marketing/lists/${id}`, data),
  addToList: (id: string, subscriber_id: string) =>
    api.post(`/marketing/lists/${id}/subscribers`, { subscriber_id }),
  removeFromList: (id: string, subscriberId: string) =>
    api.delete(`/marketing/lists/${id}/subscribers/${subscriberId}`),

  getCampaigns: (params?: any) => api.get('/marketing/campaigns', { params }),
  getCampaign: (id: string) => api.get(`/marketing/campaigns/${id}`),
  createCampaign: (data: any) => api.post('/marketing/campaigns', data),
  updateCampaign: (id: string, data: any) =>
    api.patch(`/marketing/campaigns/${id}`, data),
  sendCampaign: (id: string) => api.post(`/marketing/campaigns/${id}/send`),
  deleteCampaign: (id: string) => api.delete(`/marketing/campaigns/${id}`),

  getCoupons: (params?: any) => api.get('/marketing/coupons', { params }),
  validateCoupon: (code: string, amount?: number) =>
    api.post('/marketing/coupons/validate', { code, amount }),
  createCoupon: (data: any) => api.post('/marketing/coupons', data),
  updateCoupon: (id: string, data: any) => api.patch(`/marketing/coupons/${id}`, data),
};

// ─── MEDIA ───────────────────────────────────────────────────
export const mediaApi = {
  list: (params?: any) => api.get('/media', { params }),
  upload: (file: File, data?: any) => {
    const form = new FormData();
    form.append('file', file);
    if (data) Object.entries(data).forEach(([k, v]) => form.append(k, String(v)));
    return api.post('/media/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  uploadMultiple: (files: File[], folder_id?: string) => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    if (folder_id) form.append('folder_id', folder_id);
    return api.post('/media/upload-multiple', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (id: string, data: any) => api.patch(`/media/${id}`, data),
  delete: (id: string) => api.delete(`/media/${id}`),

  getFolders: (parent_id?: string) =>
    api.get('/media/folders', { params: { parent_id } }),
  createFolder: (name: string, parent_id?: string) =>
    api.post('/media/folders', { name, parent_id }),
  updateFolder: (id: string, data: any) => api.patch(`/media/folders/${id}`, data),
  deleteFolder: (id: string) => api.delete(`/media/folders/${id}`),
};

// ─── NOTIFICATIONS ───────────────────────────────────────────
export const notificationsApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  count: () => api.get('/notifications/count'),
  markRead: (id: string) => api.post(`/notifications/read/${id}`),
  markAllRead: () => api.post('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
  getPreferences: () => api.get('/notifications/preferences'),
  updatePreferences: (data: any) => api.put('/notifications/preferences', data),
  subscribePush: (data: any) => api.post('/notifications/push-subscribe', data),
};

// ─── ANALYTICS ───────────────────────────────────────────────
export const analyticsApi = {
  dashboard: (params?: any) => api.get('/analytics/dashboard', { params }),
  trafficSources: (params?: any) =>
    api.get('/analytics/traffic-sources', { params }),
  conversion: () => api.get('/analytics/conversion'),
  realtime: () => api.get('/analytics/realtime'),
  trackPageview: (data: any) => api.post('/analytics/pageview', data),
  trackEvent: (data: any) => api.post('/analytics/event', data),
};

// ─── AI ──────────────────────────────────────────────────────
export const aiApi = {
  getConversations: () => api.get('/ai/conversations'),
  getConversation: (id: string) => api.get(`/ai/conversations/${id}`),
  createConversation: (data: any) => api.post('/ai/conversations', data),
  deleteConversation: (id: string) => api.delete(`/ai/conversations/${id}`),
  chat: (data: any) => api.post('/ai/chat', data),
  generateProposal: (data: any) => api.post('/ai/generate/proposal', data),
  generateBlog: (data: any) => api.post('/ai/generate/blog', data),
  generateEmail: (data: any) => api.post('/ai/generate/email', data),
  getUsage: () => api.get('/ai/usage'),
};

// ─── SYSTEM ──────────────────────────────────────────────────
export const systemApi = {
  health: () => api.get('/system/health'),
  getSettings: (group?: string) =>
    api.get('/system/settings', { params: { group } }),
  getPublicSettings: () => api.get('/system/settings/public'),
  updateSettings: (settings: Record<string, any>) =>
    api.put('/system/settings', { settings }),
  updateSetting: (key: string, value: any) =>
    api.put(`/system/settings/${key}`, { value }),

  getAuditLogs: (params?: any) => api.get('/system/audit-logs', { params }),

  getApiKeys: () => api.get('/system/api-keys'),
  createApiKey: (data: any) => api.post('/system/api-keys', data),
  deleteApiKey: (id: string) => api.delete(`/system/api-keys/${id}`),

  getWebhooks: () => api.get('/system/webhooks'),
  createWebhook: (data: any) => api.post('/system/webhooks', data),
  updateWebhook: (id: string, data: any) =>
    api.patch(`/system/webhooks/${id}`, data),
  deleteWebhook: (id: string) => api.delete(`/system/webhooks/${id}`),
  getWebhookDeliveries: (id: string) =>
    api.get(`/system/webhooks/${id}/deliveries`),

  getEmailTemplates: (category?: string) =>
    api.get('/system/email-templates', { params: { category } }),
  getEmailTemplate: (slugOrId: string) =>
    api.get(`/system/email-templates/${slugOrId}`),
  createEmailTemplate: (data: any) => api.post('/system/email-templates', data),
  updateEmailTemplate: (id: string, data: any) =>
    api.patch(`/system/email-templates/${id}`, data),

  getFeatureFlags: () => api.get('/system/feature-flags'),
  getAllFeatureFlags: () => api.get('/system/feature-flags/all'),
  createFeatureFlag: (data: any) => api.post('/system/feature-flags', data),
  updateFeatureFlag: (id: string, data: any) =>
    api.patch(`/system/feature-flags/${id}`, data),
};

export default api;
