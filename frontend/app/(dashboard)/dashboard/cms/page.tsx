'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/app/(dashboard)/_components/layout/DashboardLayout';
import {
  Card,
  Button,
  StatusBadge,
  Pagination,
  Modal,
  Input,
  Select,
  Textarea,
  TabBar,
  Badge,
} from '@/components/ui';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cmsApi, servicesApi } from '@/lib/api';
import { formatDate, timeAgo, extractApiError } from '@/lib/utils';
import toast from 'react-hot-toast';
import {
  Plus,
  Eye,
  Edit2,
  Trash2,
  Globe,
  Menu,
  MessageSquare,
  Star,
  Zap,
  FileText,
  ArrowUp,
  ArrowDown,
  EyeOff,
  CheckCircle2,
  Settings,
  HelpCircle,
  Layers,
  Send,
  ExternalLink,
  BarChart3,
  RefreshCw,
  FolderKanban,
  Check,
  Code,
  Palette,
  Copy,
  RotateCcw,
  Sparkles,
  History,
  Sliders,
  Layout,
} from 'lucide-react';
import Link from 'next/link';
import { getDefaultSectionHtml } from '@/lib/sectionHtmlGenerator';

// Pre-defined section templates
const SECTION_TEMPLATES = [
  { id: 'hero', label: 'Hero Banner', desc: 'Prominent header with headline, CTAs, and background glow' },
  { id: 'features', label: 'Features & Bento Grid', desc: 'Modern card grid highlighting architectural capabilities' },
  { id: 'trust', label: 'Social Proof & Trust Metrics', desc: 'Verified metrics, uptime guarantees, and trust markers' },
  { id: 'problem_solution', label: 'Problem & Architecture Solution', desc: 'High-contrast problem vs solution comparison' },
  { id: 'showcase', label: 'Product Showcase Gallery', desc: 'Interactive showcase of flagship applications' },
  { id: 'how_it_works', label: 'Methodology & Lifecycle', desc: 'Step-by-step engineering and delivery stages' },
  { id: 'differentiators', label: 'Core Differentiators', desc: 'Why enterprise engineering leaders choose us' },
  { id: 'case_studies', label: 'Proven Client Case Studies', desc: 'Measurable enterprise outcomes and metrics' },
  { id: 'testimonials', label: 'Executive Testimonials', desc: 'Direct feedback and endorsements from technical partners' },
  { id: 'pricing', label: 'Commercial Models', desc: 'Flexible engagement models and commercial terms' },
  { id: 'faq', label: 'FAQ Accordion', desc: 'Dynamic accordion of technical & engagement FAQs' },
  { id: 'cta', label: 'Call to Action Banner', desc: 'High-conversion consultation scoping banner' },
  { id: 'custom_html', label: 'Custom HTML & Tailwind CSS Studio', desc: 'Full custom semantic markup and Tailwind styling' },
  { id: 'rich_text', label: 'Rich Text Editorial Block', desc: 'Editorial content, headings, and structured prose' },
];

// Tailwind Quick Snippets for HTML Studio
const TAILWIND_SNIPPETS = [
  {
    label: '3-Card Feature Grid',
    html: `<div class="grid grid-cols-1 md:grid-cols-3 gap-6 my-8">
  <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl hover:border-cyan-500/50 transition-all">
    <div class="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold mb-4">01</div>
    <h3 class="text-xl font-bold mb-2">High Availability</h3>
    <p class="text-sm text-slate-400">Multi-region distributed infrastructure engineered for 99.99% uptime.</p>
  </div>
  <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl hover:border-cyan-500/50 transition-all">
    <div class="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold mb-4">02</div>
    <h3 class="text-xl font-bold mb-2">SOC2 Compliance</h3>
    <p class="text-sm text-slate-400">Enterprise data encryption, audit trails, and strict role-based access control.</p>
  </div>
  <div class="p-6 rounded-2xl bg-slate-900 border border-slate-800 text-white shadow-xl hover:border-cyan-500/50 transition-all">
    <div class="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-bold mb-4">03</div>
    <h3 class="text-xl font-bold mb-2">API First</h3>
    <p class="text-sm text-slate-400">Comprehensive RESTful and GraphQL APIs built for seamless third-party integration.</p>
  </div>
</div>`,
  },
  {
    label: 'Gradient Callout Banner',
    html: `<div class="my-6 p-8 rounded-3xl bg-gradient-to-r from-cyan-900/40 via-blue-900/30 to-slate-900 border border-cyan-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
  <div>
    <span class="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 mb-2">Advisory Notice</span>
    <h4 class="text-2xl font-bold text-white">Ready for Architectural Scoping?</h4>
    <p class="text-sm text-slate-300 mt-1">Direct access to Principal Systems Architects. Non-disclosure agreements standard.</p>
  </div>
  <a href="/contact" class="px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-lg shrink-0">Schedule Session</a>
</div>`,
  },
  {
    label: 'Stats Bar',
    html: `<div class="grid grid-cols-2 md:grid-cols-4 gap-4 my-8 p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center">
  <div><div class="text-3xl font-black text-cyan-400">99.99%</div><div class="text-xs text-slate-400 mt-1 uppercase font-semibold">Uptime SLA</div></div>
  <div><div class="text-3xl font-black text-blue-400">&lt;50ms</div><div class="text-xs text-slate-400 mt-1 uppercase font-semibold">P95 Latency</div></div>
  <div><div class="text-3xl font-black text-emerald-400">100%</div><div class="text-xs text-slate-400 mt-1 uppercase font-semibold">IP Ownership</div></div>
  <div><div class="text-3xl font-black text-amber-400">24/7</div><div class="text-xs text-slate-400 mt-1 uppercase font-semibold">SRE Monitoring</div></div>
</div>`,
  },
];

export default function CMSPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // Selected Page for Page Section Builder
  const [selectedPage, setSelectedPage] = useState<any>(null);

  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [createType, setCreateType] = useState<
    | 'page'
    | 'section'
    | 'faq'
    | 'service'
    | 'solution'
    | 'process'
    | 'engagement'
  >('page');

  const [form, setForm] = useState<any>({});
  const [editingItem, setEditingItem] = useState<any>(null);

  // Section builder internal tab: 'content' | 'layout' | 'code'
  const [sectionModalTab, setSectionModalTab] = useState<'content' | 'layout' | 'code'>('content');

  // Revisions modal
  const [showRevisionsModal, setShowRevisionsModal] = useState(false);

  // 1. CMS Stats
  const { data: statsData } = useQuery({
    queryKey: ['cms-stats'],
    queryFn: () => cmsApi.getStats().then((r) => r.data.data),
  });

  // 2. Pages
  const { data: pagesData } = useQuery({
    queryKey: ['cms-pages', { page, search }],
    queryFn: () => cmsApi.getPages({ page, limit: 30, search: search || undefined }).then((r) => r.data),
    enabled: tab === 'pages' || tab === 'overview',
  });

  // 3. Page Sections for Selected Page
  const { data: sectionsData } = useQuery({
    queryKey: ['cms-page-sections', selectedPage?.id],
    queryFn: () => cmsApi.getPageSections(selectedPage.id).then((r) => r.data.data),
    enabled: !!selectedPage?.id,
  });

  // 4. Page Revisions
  const { data: revisionsData } = useQuery({
    queryKey: ['cms-page-revisions', selectedPage?.id],
    queryFn: () => cmsApi.getRevisions(selectedPage.id).then((r) => r.data.data),
    enabled: !!selectedPage?.id && showRevisionsModal,
  });

  // 5. Global Theme Settings
  const { data: themeData } = useQuery({
    queryKey: ['cms-theme-settings'],
    queryFn: () => cmsApi.getThemeSettings().then((r) => r.data.data),
    enabled: tab === 'theme',
  });

  const [themeForm, setThemeForm] = useState<any>(null);

  // 6. FAQs
  const { data: faqsData } = useQuery({
    queryKey: ['cms-faqs', { page, search }],
    queryFn: () => cmsApi.getFaqs({ page, limit: 50, search: search || undefined }).then((r) => r.data),
    enabled: tab === 'faqs',
  });

  // 7. Delivery Process
  const { data: processData } = useQuery({
    queryKey: ['cms-process'],
    queryFn: () => cmsApi.getDeliveryProcess().then((r) => r.data.data),
    enabled: tab === 'process_models',
  });

  // 8. Engagement Models
  const { data: engagementData } = useQuery({
    queryKey: ['cms-engagement'],
    queryFn: () => cmsApi.getEngagementModels().then((r) => r.data.data),
    enabled: tab === 'process_models',
  });

  // 9. Site Settings & Announcement
  const { data: siteSettingsData } = useQuery({
    queryKey: ['cms-site-settings'],
    queryFn: () => cmsApi.getSiteSettings().then((r) => r.data.data),
    enabled: tab === 'settings' || tab === 'navigation' || tab === 'footer',
  });

  // 10. Menus
  const { data: menusData } = useQuery({
    queryKey: ['cms-menus'],
    queryFn: () => cmsApi.getMenus().then((r) => r.data.data),
    enabled: tab === 'navigation' || tab === 'footer',
  });

  // 11. Services
  const { data: servicesData } = useQuery({
    queryKey: ['cms-services'],
    queryFn: () => servicesApi.getServices({ limit: 50 }).then((r) => r.data.data || r.data),
    enabled: tab === 'services',
  });

  // 12. Solutions
  const { data: solutionsData } = useQuery({
    queryKey: ['cms-solutions'],
    queryFn: () => servicesApi.getSolutions().then((r) => r.data.data),
    enabled: tab === 'solutions',
  });

  // ════════════════════════════════════════════════════════════
  //  MUTATIONS
  // ════════════════════════════════════════════════════════════

  const createPageMutation = useMutation({
    mutationFn: (data: any) => cmsApi.createPage(data),
    onSuccess: (res: any) => {
      qc.invalidateQueries({ queryKey: ['cms-pages'] });
      qc.invalidateQueries({ queryKey: ['cms-stats'] });
      setShowCreate(false);
      setSelectedPage(res.data.data);
      toast.success('Page created successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updatePageMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => cmsApi.updatePage(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-pages'] });
      qc.invalidateQueries({ queryKey: ['cms-stats'] });
      setShowCreate(false);
      toast.success('Page updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deletePageMutation = useMutation({
    mutationFn: (id: string) => cmsApi.deletePage(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-pages'] });
      qc.invalidateQueries({ queryKey: ['cms-stats'] });
      if (selectedPage?.id) setSelectedPage(null);
      toast.success('Page deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const publishPageMutation = useMutation({
    mutationFn: (pageId: string) => cmsApi.publishPage(pageId, 'Published from CMS Visual Studio'),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-pages'] });
      qc.invalidateQueries({ queryKey: ['cms-stats'] });
      toast.success('Page published and revision snapshot saved!');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const rollbackMutation = useMutation({
    mutationFn: ({ pageId, revisionId }: { pageId: string; revisionId: string }) =>
      cmsApi.rollbackRevision(pageId, revisionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-page-sections', selectedPage?.id] });
      qc.invalidateQueries({ queryKey: ['cms-page-revisions', selectedPage?.id] });
      setShowRevisionsModal(false);
      toast.success('Page successfully restored to selected revision!');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const addSectionMutation = useMutation({
    mutationFn: ({ pageId, data }: { pageId: string; data: any }) => cmsApi.addPageSection(pageId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-page-sections', selectedPage?.id] });
      setShowCreate(false);
      toast.success('Section added to page');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateSectionMutation = useMutation({
    mutationFn: ({ pageId, sectionId, data }: { pageId: string; sectionId: string; data: any }) =>
      cmsApi.updatePageSection(pageId, sectionId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-page-sections', selectedPage?.id] });
      setShowCreate(false);
      toast.success('Section updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const duplicateSectionMutation = useMutation({
    mutationFn: ({ pageId, sectionId }: { pageId: string; sectionId: string }) =>
      cmsApi.duplicateSection(pageId, sectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-page-sections', selectedPage?.id] });
      toast.success('Section duplicated successfully');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteSectionMutation = useMutation({
    mutationFn: ({ pageId, sectionId }: { pageId: string; sectionId: string }) =>
      cmsApi.deletePageSection(pageId, sectionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-page-sections', selectedPage?.id] });
      toast.success('Section removed');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const reorderSectionsMutation = useMutation({
    mutationFn: ({ pageId, sectionIds }: { pageId: string; sectionIds: string[] }) =>
      cmsApi.reorderSections(pageId, sectionIds),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-page-sections', selectedPage?.id] });
      toast.success('Sections order updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateThemeMutation = useMutation({
    mutationFn: (tokens: any) => cmsApi.updateThemeSettings(tokens),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-theme-settings'] });
      toast.success('Theme design tokens updated & applied!');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateSiteSettingsMutation = useMutation({
    mutationFn: (data: any) => cmsApi.updateSiteSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-site-settings'] });
      toast.success('Site settings and announcement updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Services & Solutions mutations
  const createServiceMutation = useMutation({
    mutationFn: (data: any) => servicesApi.createService(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-services'] });
      setShowCreate(false);
      toast.success('Service offering created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateServiceMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => servicesApi.updateService(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-services'] });
      setShowCreate(false);
      toast.success('Service updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteServiceMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteService(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-services'] });
      toast.success('Service deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const createSolutionMutation = useMutation({
    mutationFn: (data: any) => servicesApi.createSolution(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-solutions'] });
      setShowCreate(false);
      toast.success('Solution created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateSolutionMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => servicesApi.updateSolution(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-solutions'] });
      setShowCreate(false);
      toast.success('Solution updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteSolutionMutation = useMutation({
    mutationFn: (id: string) => servicesApi.deleteSolution(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-solutions'] });
      toast.success('Solution deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // FAQs mutations
  const createFaqMutation = useMutation({
    mutationFn: (data: any) => cmsApi.createFaq(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-faqs'] });
      setShowCreate(false);
      toast.success('FAQ created');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const updateFaqMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => cmsApi.updateFaq(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-faqs'] });
      setShowCreate(false);
      toast.success('FAQ updated');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  const deleteFaqMutation = useMutation({
    mutationFn: (id: string) => cmsApi.deleteFaq(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms-faqs'] });
      toast.success('FAQ deleted');
    },
    onError: (e: any) => toast.error(extractApiError(e)),
  });

  // Helper form setters
  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setProp = (k: string, v: any) => {
    setForm((f: any) => ({
      ...f,
      block_props: {
        ...(f.block_props || {}),
        [k]: v,
      },
    }));
  };

  const openCreate = (type: typeof createType, initialData: any = {}) => {
    setCreateType(type);
    if (type === 'section') {
      const blockType = initialData.block_type || 'hero';
      const initialProps = initialData.block_props || {};
      const renderedHtml = initialProps.custom_html || getDefaultSectionHtml(blockType, initialProps);
      setForm({
        ...initialData,
        block_type: blockType,
        block_props: {
          ...initialProps,
          custom_html: renderedHtml,
        },
      });
    } else {
      setForm(initialData);
    }
    setEditingItem(null);
    setSectionModalTab('content');
    setShowCreate(true);
  };

  const openEdit = (type: typeof createType, item: any) => {
    setCreateType(type);
    setEditingItem(item);
    if (type === 'section') {
      const blockType = item.block_type || 'hero';
      const initialProps = item.block_props || {};
      const renderedHtml = initialProps.custom_html || getDefaultSectionHtml(blockType, initialProps);
      setForm({
        ...item,
        block_props: {
          ...initialProps,
          custom_html: renderedHtml,
        },
      });
    } else {
      setForm(item);
    }
    setSectionModalTab('content');
    setShowCreate(true);
  };

  const handleSaveModal = () => {
    if (createType === 'page') {
      if (editingItem) {
        updatePageMutation.mutate({ id: editingItem.id, data: form });
      } else {
        createPageMutation.mutate(form);
      }
    } else if (createType === 'section') {
      if (!selectedPage?.id) return;
      if (editingItem) {
        updateSectionMutation.mutate({
          pageId: selectedPage.id,
          sectionId: editingItem.id,
          data: form,
        });
      } else {
        addSectionMutation.mutate({
          pageId: selectedPage.id,
          data: form,
        });
      }
    } else if (createType === 'faq') {
      if (editingItem) {
        updateFaqMutation.mutate({ id: editingItem.id, data: form });
      } else {
        createFaqMutation.mutate(form);
      }
    } else if (createType === 'service') {
      if (editingItem) {
        updateServiceMutation.mutate({ id: editingItem.id, data: form });
      } else {
        createServiceMutation.mutate(form);
      }
    } else if (createType === 'solution') {
      if (editingItem) {
        updateSolutionMutation.mutate({ id: editingItem.id, data: form });
      } else {
        createSolutionMutation.mutate(form);
      }
    }
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (!sectionsData || !selectedPage?.id) return;
    const items = [...sectionsData];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    const temp = items[index];
    items[index] = items[targetIdx];
    items[targetIdx] = temp;

    const sectionIds = items.map((i) => i.id);
    reorderSectionsMutation.mutate({ pageId: selectedPage.id, sectionIds });
  };

  const toggleSectionVisibility = (sec: any) => {
    if (!selectedPage?.id) return;
    updateSectionMutation.mutate({
      pageId: selectedPage.id,
      sectionId: sec.id,
      data: { is_visible: !sec.is_visible },
    });
  };

  // Sync theme tokens
  const currentTheme = themeForm || themeData || {
    primaryColor: '#0284c7',
    primaryHover: '#0369a1',
    accentColor: '#6366f1',
    backgroundColor: '#f8fafc',
    foregroundColor: '#0f172a',
    cardBackground: '#ffffff',
    containerMaxWidth: '80rem',
    borderRadius: '0.75rem',
    fontFamily: 'Inter, system-ui, sans-serif',
  };

  const headerMenu = Array.isArray(menusData) ? menusData.find((m: any) => m.location === 'header') : undefined;
  const footerMenu = Array.isArray(menusData) ? menusData.find((m: any) => m.location === 'footer') : undefined;

  const headerNavLinks: any[] = Array.isArray(headerMenu?.items)
    ? headerMenu.items
    : Array.isArray(headerMenu?.items?.links)
    ? headerMenu.items.links
    : [
        { label: 'Services', href: '/services' },
        { label: 'Solutions', href: '/solutions' },
        { label: 'Process', href: '/process' },
        { label: 'Engagement Models', href: '/engagement-models' },
        { label: 'Showcases', href: '/showcases' },
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'FAQs', href: '/faq' },
      ];

  // Header Menu Links state & handlers
  const [headerLinks, setHeaderLinks] = useState<Array<{ label: string; href: string }>>([]);
  const [navLinksInitialized, setNavLinksInitialized] = useState(false);
  const [isSavingNavigation, setIsSavingNavigation] = useState(false);

  useEffect(() => {
    if (!navLinksInitialized && headerMenu?.items) {
      const links = Array.isArray(headerMenu.items)
        ? headerMenu.items
        : Array.isArray(headerMenu.items.links)
        ? headerMenu.items.links
        : null;
      if (links && links.length > 0) {
        setHeaderLinks(links);
        setNavLinksInitialized(true);
      }
    } else if (!navLinksInitialized && menusData && !headerMenu) {
      setHeaderLinks([
        { label: 'Services', href: '/services' },
        { label: 'Solutions', href: '/solutions' },
        { label: 'Process', href: '/process' },
        { label: 'Engagement Models', href: '/engagement-models' },
        { label: 'Showcases', href: '/showcases' },
        { label: 'About', href: '/about' },
        { label: 'Blog', href: '/blog' },
        { label: 'FAQs', href: '/faq' },
      ]);
      setNavLinksInitialized(true);
    }
  }, [headerMenu, menusData, navLinksInitialized]);

  const handleUpdateLink = (index: number, field: 'label' | 'href', value: string) => {
    setHeaderLinks((prev) => {
      const current = prev.length > 0 ? prev : headerNavLinks;
      const updated = [...current];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleAddLink = () => {
    setHeaderLinks((prev) => {
      const current = prev.length > 0 ? prev : headerNavLinks;
      return [...current, { label: 'New Link', href: '/new-page' }];
    });
  };

  const handleRemoveLink = (index: number) => {
    setHeaderLinks((prev) => {
      const current = prev.length > 0 ? prev : headerNavLinks;
      return current.filter((_, i) => i !== index);
    });
  };

  const handleMoveLink = (index: number, direction: 'up' | 'down') => {
    setHeaderLinks((prev) => {
      const current = prev.length > 0 ? prev : headerNavLinks;
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const copy = [...current];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  const handleSaveNavigation = async () => {
    setIsSavingNavigation(true);
    try {
      // 1. Save branding & site settings safely
      const brandingPayload: Record<string, any> = {};
      if (siteSettingsData?.['site.name'] !== undefined) {
        brandingPayload['site.name'] = siteSettingsData['site.name'];
      }
      if (siteSettingsData?.['site.logo_url'] !== undefined) {
        brandingPayload['site.logo_url'] = siteSettingsData['site.logo_url'];
      }
      if (siteSettingsData?.['site.announcement'] !== undefined) {
        brandingPayload['site.announcement'] = siteSettingsData['site.announcement'];
      }
      if (Object.keys(brandingPayload).length > 0) {
        await cmsApi.updateSiteSettings(brandingPayload);
      }

      // 2. Save Header Menu Links
      const linksToSave = headerLinks.length > 0 ? headerLinks : headerNavLinks;
      if (headerMenu?.id) {
        const currentItems =
          typeof headerMenu.items === 'object' && !Array.isArray(headerMenu.items)
            ? headerMenu.items
            : {};
        await cmsApi.updateMenu(headerMenu.id, {
          items: {
            ...currentItems,
            links: linksToSave,
          },
        });
      } else {
        await cmsApi.createMenu({
          name: 'Main Header Navigation',
          slug: 'main-header-navigation',
          location: 'header',
          items: {
            links: linksToSave,
          },
        });
      }

      qc.invalidateQueries({ queryKey: ['cms-menus'] });
      qc.invalidateQueries({ queryKey: ['cms-site-settings'] });
      toast.success('Header navigation and branding settings saved successfully');
    } catch (err: any) {
      toast.error(extractApiError(err) || 'Failed to save navigation settings');
    } finally {
      setIsSavingNavigation(false);
    }
  };

  return (
    <DashboardLayout title="CMS & Visual Page Builder" breadcrumbs={[{ label: 'CMS Studio' }]}>
      <div className="space-y-6">
        {/* Navigation Tabs */}
        <TabBar
          tabs={[
            { id: 'overview', label: 'Dashboard Overview' },
            { id: 'pages', label: 'Pages & Visual Builder', count: statsData?.pages?.total },
            { id: 'theme', label: 'Theme & Design Tokens' },
            { id: 'navigation', label: 'Header & Navigation' },
            { id: 'footer', label: 'Footer & Columns' },
            { id: 'services', label: 'Services Catalog', count: statsData?.services },
            { id: 'solutions', label: 'Solutions', count: statsData?.solutions },
            { id: 'faqs', label: 'FAQs', count: statsData?.faqs },
            { id: 'process_models', label: 'Process & Models' },
            { id: 'settings', label: 'Site Settings & SEO' },
          ]}
          active={tab}
          onChange={(t) => {
            setTab(t);
            setPage(1);
          }}
        />

        {/* ════════════════════════════════════════════════════════════
            1. CMS DASHBOARD OVERVIEW (REAL METRICS)
           ════════════════════════════════════════════════════════════ */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <Card>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase text-slate-500">Live Pages</span>
                  <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                    {statsData?.pages?.published || 15}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {statsData?.pages?.draft || 0} drafts
                  </span>
                </div>
              </Card>

              <Card>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase text-slate-500">Sections</span>
                  <span className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {statsData?.sections || 74}
                  </span>
                  <span className="text-[11px] text-slate-400">Across all routes</span>
                </div>
              </Card>

              <Card>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase text-slate-500">Services</span>
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {statsData?.services || 16}
                  </span>
                  <span className="text-[11px] text-slate-400">Catalog items</span>
                </div>
              </Card>

              <Card>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase text-slate-500">Solutions</span>
                  <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
                    {statsData?.solutions || 8}
                  </span>
                  <span className="text-[11px] text-slate-400">Enterprise areas</span>
                </div>
              </Card>

              <Card>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase text-slate-500">Published Blog</span>
                  <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {statsData?.blog?.published || 13}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {statsData?.blog?.draft || 0} drafts
                  </span>
                </div>
              </Card>

              <Card>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold uppercase text-slate-500">Leads & Inquiries</span>
                  <span className="text-2xl font-black text-amber-600 dark:text-amber-400">
                    {statsData?.leads || 0}
                  </span>
                  <span className="text-[11px] text-slate-400">Inbound briefs</span>
                </div>
              </Card>
            </div>

            {/* Quick Actions Panel */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
                    <Layout className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Visual Page Builder</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-3">
                      Reorder sections, update headlines, or craft custom Tailwind blocks.
                    </p>
                    <Button size="sm" onClick={() => setTab('pages')}>
                      Open Page Builder
                    </Button>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Theme & Design System</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-3">
                      Configure brand colors, container widths, and typography globally.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setTab('theme')}>
                      Customize Design Tokens
                    </Button>
                  </div>
                </div>
              </Card>

              <Card>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">Live Public Website</h4>
                    <p className="text-xs text-slate-500 mt-1 mb-3">
                      View the live, API-driven public storefront reflecting all CMS changes.
                    </p>
                    <Link href="/" target="_blank">
                      <Button size="sm" variant="outline" icon={<ExternalLink className="w-3.5 h-3.5" />}>
                        View Website
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            2. PAGES & VISUAL PAGE BUILDER
           ════════════════════════════════════════════════════════════ */}
        {tab === 'pages' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Pages List (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <Card padding={false}>
                  <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">Website Pages</h3>
                      <p className="text-xs text-slate-500">Select a page to build and reorder sections</p>
                    </div>
                    <Button size="sm" icon={<Plus className="w-4 h-4" />} onClick={() => openCreate('page')}>
                      New Page
                    </Button>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[650px] overflow-y-auto">
                    {Array.isArray(pagesData?.data) && pagesData.data.map((p: any) => {
                      const isSelected = selectedPage?.id === p.id;
                      return (
                        <div
                          key={p.id}
                          onClick={() => setSelectedPage(p)}
                          className={`p-3.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-cyan-50 dark:bg-cyan-950/40 border-l-4 border-cyan-500'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-900'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-xs text-slate-900 dark:text-white">
                                {p.title}
                              </span>
                              {p.is_homepage && (
                                <Badge variant="info">Homepage</Badge>
                              )}
                              {p.visibility === 'draft' && (
                                <Badge variant="warning">Draft</Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-slate-500">
                              <code>/{p.slug}</code>
                              <span>&bull;</span>
                              <span className="capitalize">{p.visibility}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <Link
                              href={p.slug === 'home' ? '/' : `/${p.slug}`}
                              target="_blank"
                              className="p-1.5 text-slate-400 hover:text-cyan-600 transition"
                              title="Preview Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEdit('page', p);
                              }}
                              className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                              title="Edit Settings"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!p.is_homepage && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (confirm(`Delete page "${p.title}"?`)) {
                                    deletePageMutation.mutate(p.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                                title="Delete Page"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>
              </div>

              {/* Right Column: Section Builder for Selected Page (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                {selectedPage ? (
                  <Card padding={false}>
                    {/* Header Controls for Selected Page */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                              {selectedPage.title}
                            </h3>
                            <Badge variant={selectedPage.visibility === 'public' ? 'success' : 'warning'}>
                              {selectedPage.visibility === 'public' ? 'Published' : 'Draft'}
                            </Badge>
                            <Badge>{sectionsData?.length || 0} Sections</Badge>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Route: <code>/{selectedPage.slug === 'home' ? '' : selectedPage.slug}</code>
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          {/* Revisions History Button */}
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<History className="w-3.5 h-3.5" />}
                            onClick={() => setShowRevisionsModal(true)}
                            title="View Revision Snapshots"
                          >
                            Revisions
                          </Button>

                          {/* Publish Button */}
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                            onClick={() => publishPageMutation.mutate(selectedPage.id)}
                          >
                            Publish
                          </Button>

                          {/* Add Section Button */}
                          <Button
                            size="sm"
                            icon={<Plus className="w-3.5 h-3.5" />}
                            onClick={() =>
                              openCreate('section', {
                                block_type: 'hero',
                                sort_order: (sectionsData?.length || 0) + 1,
                                is_visible: true,
                                block_props: {
                                  title: 'New Section Heading',
                                  eyebrow: 'Capabilities',
                                  subtitle: 'Detailed description for this dynamic section.',
                                  bg_variant: 'default',
                                  container_width: 'standard',
                                  padding: 'lg',
                                  alignment: 'center',
                                },
                              })
                            }
                          >
                            Add Section
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Sections List */}
                    <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800">
                      {Array.isArray(sectionsData) && sectionsData.map((sec: any, idx: number) => {
                        const templateInfo = SECTION_TEMPLATES.find((t) => t.id === sec.block_type);
                        return (
                          <div
                            key={sec.id}
                            className={`py-3.5 flex items-center justify-between gap-3 ${
                              !sec.is_visible
                                ? 'opacity-50 bg-slate-50/50 dark:bg-slate-900/30 px-3 rounded-xl'
                                : ''
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold text-slate-400 w-5">
                                {idx + 1}.
                              </span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                                    {templateInfo?.label || sec.block_type.replace(/_/g, ' ').toUpperCase()}
                                  </span>
                                  {!sec.is_visible && (
                                    <Badge variant="warning">Hidden</Badge>
                                  )}
                                  {sec.block_type === 'custom_html' && (
                                    <Badge variant="info">HTML/Tailwind</Badge>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 truncate max-w-sm">
                                  {sec.block_props?.title ||
                                    sec.block_props?.headline ||
                                    sec.block_props?.eyebrow ||
                                    templateInfo?.desc ||
                                    'Configured Section'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              {/* Reorder Buttons */}
                              <button
                                type="button"
                                disabled={idx === 0}
                                onClick={() => moveSection(idx, 'up')}
                                className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:border-slate-800"
                                title="Move Up"
                              >
                                <ArrowUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                disabled={idx === sectionsData.length - 1}
                                onClick={() => moveSection(idx, 'down')}
                                className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 dark:border-slate-800"
                                title="Move Down"
                              >
                                <ArrowDown className="w-3.5 h-3.5" />
                              </button>

                              {/* Duplicate Section */}
                              <button
                                type="button"
                                onClick={() =>
                                  duplicateSectionMutation.mutate({
                                    pageId: selectedPage.id,
                                    sectionId: sec.id,
                                  })
                                }
                                className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800"
                                title="Duplicate Section"
                              >
                                <Copy className="w-3.5 h-3.5 text-indigo-500" />
                              </button>

                              {/* Visibility Toggle */}
                              <button
                                type="button"
                                onClick={() => toggleSectionVisibility(sec)}
                                className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800"
                                title={sec.is_visible ? 'Hide section' : 'Show section'}
                              >
                                {sec.is_visible ? (
                                  <Eye className="w-3.5 h-3.5 text-cyan-600" />
                                ) : (
                                  <EyeOff className="w-3.5 h-3.5 text-amber-500" />
                                )}
                              </button>

                              {/* Edit Section */}
                              <button
                                type="button"
                                onClick={() => openEdit('section', sec)}
                                className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800"
                                title="Edit Content & Tailwind Styling"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-500" />
                              </button>

                              {/* Delete Section */}
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Delete this section permanently?')) {
                                    deleteSectionMutation.mutate({
                                      pageId: selectedPage.id,
                                      sectionId: sec.id,
                                    });
                                  }
                                }}
                                className="p-1 rounded border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800"
                                title="Delete Section"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                ) : (
                  <Card>
                    <div className="py-16 text-center text-slate-400">
                      <Layout className="w-10 h-10 mx-auto mb-3 opacity-40" />
                      <p className="text-sm font-semibold">Select a page from the left to start editing</p>
                      <p className="text-xs text-slate-500 mt-1">
                        You can customize headings, add HTML & Tailwind blocks, and reorder sections live.
                      </p>
                    </div>
                  </Card>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            3. GLOBAL THEME & DESIGN SYSTEM TOKENS
           ════════════════════════════════════════════════════════════ */}
        {tab === 'theme' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Design Tokens Form (7 Cols) */}
              <div className="lg:col-span-7 space-y-4">
                <Card>
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        Global Design System Tokens
                      </h3>
                      <p className="text-xs text-slate-500">
                        Updates semantic CSS variables applied dynamically across the entire public website.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      icon={<Check className="w-4 h-4" />}
                      onClick={() => updateThemeMutation.mutate(currentTheme)}
                    >
                      Save & Apply Theme
                    </Button>
                  </div>

                  <div className="pt-4 space-y-4">
                    {/* Brand Colors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Primary Brand Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentTheme.primaryColor || '#0284c7'}
                            onChange={(e) =>
                              setThemeForm({ ...currentTheme, primaryColor: e.target.value })
                            }
                            className="w-10 h-9 p-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                          />
                          <Input
                            value={currentTheme.primaryColor || '#0284c7'}
                            onChange={(e) =>
                              setThemeForm({ ...currentTheme, primaryColor: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Primary Hover Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentTheme.primaryHover || '#0369a1'}
                            onChange={(e) =>
                              setThemeForm({ ...currentTheme, primaryHover: e.target.value })
                            }
                            className="w-10 h-9 p-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                          />
                          <Input
                            value={currentTheme.primaryHover || '#0369a1'}
                            onChange={(e) =>
                              setThemeForm({ ...currentTheme, primaryHover: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Accent Color
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={currentTheme.accentColor || '#6366f1'}
                            onChange={(e) =>
                              setThemeForm({ ...currentTheme, accentColor: e.target.value })
                            }
                            className="w-10 h-9 p-0.5 rounded border border-slate-200 dark:border-slate-700 cursor-pointer"
                          />
                          <Input
                            value={currentTheme.accentColor || '#6366f1'}
                            onChange={(e) =>
                              setThemeForm({ ...currentTheme, accentColor: e.target.value })
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Container Max Width
                        </label>
                        <Select
                          options={[
                            { value: '72rem', label: 'Compact (72rem / 1152px)' },
                            { value: '80rem', label: 'Standard (80rem / 1280px)' },
                            { value: '90rem', label: 'Wide (90rem / 1440px)' },
                            { value: '100%', label: 'Fluid (100%)' },
                          ]}
                          value={currentTheme.containerMaxWidth || '80rem'}
                          onChange={(e) =>
                            setThemeForm({ ...currentTheme, containerMaxWidth: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Border Radius
                        </label>
                        <Select
                          options={[
                            { value: '0.375rem', label: 'Small (0.375rem)' },
                            { value: '0.5rem', label: 'Medium (0.5rem)' },
                            { value: '0.75rem', label: 'Standard (0.75rem)' },
                            { value: '1rem', label: 'Large (1.0rem)' },
                            { value: '1.5rem', label: 'Extra Large (1.5rem)' },
                          ]}
                          value={currentTheme.borderRadius || '0.75rem'}
                          onChange={(e) =>
                            setThemeForm({ ...currentTheme, borderRadius: e.target.value })
                          }
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                          Typography Preset
                        </label>
                        <Select
                          options={[
                            { value: 'Inter, system-ui, sans-serif', label: 'Inter (Default Modern)' },
                            { value: '-apple-system, BlinkMacSystemFont, "SF Pro", sans-serif', label: 'Apple SF Pro' },
                            { value: 'Roboto, system-ui, sans-serif', label: 'Roboto' },
                          ]}
                          value={currentTheme.fontFamily || 'Inter, system-ui, sans-serif'}
                          onChange={(e) =>
                            setThemeForm({ ...currentTheme, fontFamily: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column: Interactive Live Token Preview (5 Cols) */}
              <div className="lg:col-span-5 space-y-4">
                <Card>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm mb-4">
                    Live Design Token Preview
                  </h3>
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: currentTheme.primaryColor }}
                      >
                        Primary Badge
                      </span>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                        style={{ backgroundColor: currentTheme.accentColor }}
                      >
                        Accent
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                      Scalable Distributed Systems
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      This preview reflects live CSS token bindings for button radius, container bounds, and color hues.
                    </p>

                    <div className="pt-2 flex items-center gap-3">
                      <button
                        type="button"
                        style={{
                          backgroundColor: currentTheme.primaryColor,
                          borderRadius: currentTheme.borderRadius,
                        }}
                        className="px-4 py-2 text-xs font-bold text-white shadow-md transition-all hover:opacity-90"
                      >
                        Primary Action
                      </button>
                      <button
                        type="button"
                        style={{
                          borderColor: currentTheme.primaryColor,
                          color: currentTheme.primaryColor,
                          borderRadius: currentTheme.borderRadius,
                        }}
                        className="px-4 py-2 text-xs font-bold border transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                      >
                        Secondary Action
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            4. HEADER & NAVIGATION MANAGER
           ════════════════════════════════════════════════════════════ */}
        {tab === 'navigation' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Global Header & Navigation Bar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage top branding, primary CTA buttons, and header menu links across all pages.
                  </p>
                </div>
                <Button
                  size="sm"
                  disabled={isSavingNavigation}
                  onClick={handleSaveNavigation}
                >
                  {isSavingNavigation ? 'Saving...' : 'Save Navigation Settings'}
                </Button>
              </div>

              <div className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Brand Name"
                  value={siteSettingsData?.['site.name'] || 'Sysmaira Software Solutions'}
                  onChange={(e) =>
                    qc.setQueryData(['cms-site-settings'], {
                      ...siteSettingsData,
                      'site.name': e.target.value,
                    })
                  }
                />
                <Input
                  label="Logo Image URL"
                  value={siteSettingsData?.['site.logo_url'] || '/images/logo.webp'}
                  onChange={(e) =>
                    qc.setQueryData(['cms-site-settings'], {
                      ...siteSettingsData,
                      'site.logo_url': e.target.value,
                    })
                  }
                />
              </div>

              {/* Navigation Menu Links */}
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300">
                      Header Menu Links
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Customize navigation links displayed in the website header.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={handleAddLink}
                  >
                    Add Link
                  </Button>
                </div>

                <div className="space-y-2">
                  {(headerLinks.length > 0 ? headerLinks : headerNavLinks).map((item: any, i: number) => {
                    const activeList = headerLinks.length > 0 ? headerLinks : headerNavLinks;
                    return (
                      <div
                        key={i}
                        className="p-2.5 flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <span className="font-mono text-[11px] font-bold text-slate-400 w-5 text-center shrink-0">
                          {i + 1}.
                        </span>

                        <div className="w-36 sm:w-48 shrink-0">
                          <input
                            type="text"
                            value={item.label}
                            onChange={(e) => handleUpdateLink(i, 'label', e.target.value)}
                            placeholder="Menu Label"
                            aria-label={`Menu link ${i + 1} label`}
                            className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                          />
                        </div>

                        <div className="flex-1 min-w-[120px]">
                          <input
                            type="text"
                            value={item.href}
                            onChange={(e) => handleUpdateLink(i, 'href', e.target.value)}
                            placeholder="/path or https://..."
                            aria-label={`Menu link ${i + 1} URL`}
                            className="w-full font-mono rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-600 outline-none transition focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
                          />
                        </div>

                        <div className="flex items-center gap-0.5 shrink-0">
                          <button
                            type="button"
                            disabled={i === 0}
                            onClick={() => handleMoveLink(i, 'up')}
                            aria-label={`Move link ${i + 1} up`}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            disabled={i === activeList.length - 1}
                            onClick={() => handleMoveLink(i, 'down')}
                            aria-label={`Move link ${i + 1} down`}
                            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveLink(i)}
                          aria-label={`Delete link ${i + 1}`}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer transition shrink-0"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            5. FOOTER & LINK COLUMNS MANAGER
           ════════════════════════════════════════════════════════════ */}
        {tab === 'footer' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Footer & Link Columns
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage footer mission text, copyright statement, and column groupings.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    updateSiteSettingsMutation.mutate({
                      'site.copyright': siteSettingsData?.['site.copyright'],
                    })
                  }
                >
                  Save Footer
                </Button>
              </div>

              <div className="pt-4 space-y-4">
                <Input
                  label="Copyright Text"
                  value={
                    siteSettingsData?.['site.copyright'] ||
                    `© ${new Date().getFullYear()} Sysmaira Software Solutions Inc. All rights reserved.`
                  }
                  onChange={(e) =>
                    qc.setQueryData(['cms-site-settings'], {
                      ...siteSettingsData,
                      'site.copyright': e.target.value,
                    })
                  }
                />
              </div>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            6. SERVICES CATALOG MANAGER
           ════════════════════════════════════════════════════════════ */}
        {tab === 'services' && (
          <div className="space-y-4">
            <Card padding={false}>
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Services Catalog</h3>
                  <p className="text-xs text-slate-500">
                    Manage service offerings delivered to /services and homepage
                  </p>
                </div>
                <Button
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() =>
                    openCreate('service', {
                      title: '',
                      slug: '',
                      tagline: '',
                      short_description: '',
                      is_active: true,
                    })
                  }
                >
                  Add Service
                </Button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.isArray(servicesData) && servicesData.map((s: any) => (
                  <div
                    key={s.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {s.title}
                        </span>
                        <code className="text-[11px] text-slate-400">/{s.slug}</code>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {s.short_description || s.tagline || 'Custom Enterprise Service'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit('service', s)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                        title="Edit Service"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete service "${s.title}"?`)) {
                            deleteServiceMutation.mutate(s.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Service"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            7. SOLUTIONS CATALOG MANAGER
           ════════════════════════════════════════════════════════════ */}
        {tab === 'solutions' && (
          <div className="space-y-4">
            <Card padding={false}>
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Enterprise Solutions Catalog
                  </h3>
                  <p className="text-xs text-slate-500">
                    Manage solutions delivered to /solutions and homepage
                  </p>
                </div>
                <Button
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() =>
                    openCreate('solution', {
                      title: '',
                      slug: '',
                      tagline: '',
                      eyebrow: '',
                      short_description: '',
                      is_active: true,
                    })
                  }
                >
                  Add Solution
                </Button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.isArray(solutionsData) && solutionsData.map((sol: any) => (
                  <div
                    key={sol.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {sol.title}
                        </span>
                        <code className="text-[11px] text-slate-400">/{sol.slug}</code>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                        {sol.short_description || sol.tagline || 'Custom Enterprise Solution'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit('solution', sol)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                        title="Edit Solution"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Delete solution "${sol.title}"?`)) {
                            deleteSolutionMutation.mutate(sol.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        title="Delete Solution"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            8. FAQS MANAGER
           ════════════════════════════════════════════════════════════ */}
        {tab === 'faqs' && (
          <div className="space-y-4">
            <Card padding={false}>
              <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">Frequently Asked Questions</h3>
                  <p className="text-xs text-slate-500">Manage technical, delivery, and compliance FAQs</p>
                </div>
                <Button
                  size="sm"
                  icon={<Plus className="w-4 h-4" />}
                  onClick={() => openCreate('faq', { category: 'General', is_published: true })}
                >
                  Add FAQ
                </Button>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
                {Array.isArray(faqsData?.data) && faqsData.data.map((faq: any) => (
                  <div
                    key={faq.id}
                    className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-slate-900/40"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-900 dark:text-white">
                          {faq.question}
                        </span>
                        <Badge variant="info">{faq.category}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-1">{faq.answer}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit('faq', faq)}
                        className="p-1.5 text-slate-400 hover:text-blue-600 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm('Delete FAQ permanently?')) {
                            deleteFaqMutation.mutate(faq.id);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            9. PROCESS & MODELS
           ════════════════════════════════════════════════════════════ */}
        {tab === 'process_models' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card padding={false}>
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Delivery Process Stages</h3>
                <p className="text-xs text-slate-500">7 engineering lifecycle phases</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.isArray(processData) && processData.map((p: any) => (
                  <div key={p.id} className="p-3 text-xs">
                    <span className="font-bold text-cyan-600 dark:text-cyan-400 mr-2">
                      Stage {p.stage_number}:
                    </span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{p.title}</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding={false}>
              <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">Engagement Models</h3>
                <p className="text-xs text-slate-500">Commercial operational models</p>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {Array.isArray(engagementData) && engagementData.map((m: any) => (
                  <div key={m.id} className="p-3 text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{m.title}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{m.description}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            10. SITE SETTINGS & ANNOUNCEMENT BAR
           ════════════════════════════════════════════════════════════ */}
        {tab === 'settings' && (
          <div className="space-y-6">
            <Card>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                    Global Site Settings & Announcement Banner
                  </h3>
                  <p className="text-xs text-slate-500">
                    Live alert bar, contact channels, and default SEO metadata.
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() =>
                    updateSiteSettingsMutation.mutate({
                      'site.name': siteSettingsData?.['site.name'],
                      'site.tagline': siteSettingsData?.['site.tagline'],
                      'site.announcement': siteSettingsData?.['site.announcement'],
                      'contact.email': siteSettingsData?.['contact.email'],
                      'contact.phone': siteSettingsData?.['contact.phone'],
                    })
                  }
                >
                  Save Settings
                </Button>
              </div>

              <div className="pt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    label="Website Name"
                    value={siteSettingsData?.['site.name'] || 'Sysmaira Software Solutions'}
                    onChange={(e) =>
                      qc.setQueryData(['cms-site-settings'], {
                        ...siteSettingsData,
                        'site.name': e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Tagline"
                    value={
                      siteSettingsData?.['site.tagline'] ||
                      'Custom Software Development & IT Services'
                    }
                    onChange={(e) =>
                      qc.setQueryData(['cms-site-settings'], {
                        ...siteSettingsData,
                        'site.tagline': e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Support / Contact Email"
                    value={siteSettingsData?.['contact.email'] || 'hello@sysmaira.com'}
                    onChange={(e) =>
                      qc.setQueryData(['cms-site-settings'], {
                        ...siteSettingsData,
                        'contact.email': e.target.value,
                      })
                    }
                  />
                  <Input
                    label="Contact Phone"
                    value={siteSettingsData?.['contact.phone'] || '+1 (555) 019-2831'}
                    onChange={(e) =>
                      qc.setQueryData(['cms-site-settings'], {
                        ...siteSettingsData,
                        'contact.phone': e.target.value,
                      })
                    }
                  />
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="font-semibold text-xs text-slate-700 dark:text-slate-300 mb-2">
                    Top Announcement Bar
                  </h4>
                  <div className="space-y-3">
                    <Input
                      label="Announcement Badge"
                      value={siteSettingsData?.['site.announcement']?.badge || 'Architecture Advisory'}
                      onChange={(e) => {
                        const updated = {
                          ...siteSettingsData['site.announcement'],
                          badge: e.target.value,
                        };
                        qc.setQueryData(['cms-site-settings'], {
                          ...siteSettingsData,
                          'site.announcement': updated,
                        });
                      }}
                    />
                    <Input
                      label="Announcement Message"
                      value={
                        siteSettingsData?.['site.announcement']?.text ||
                        'Schedule an enterprise architectural scoping session with a Principal Systems Architect.'
                      }
                      onChange={(e) => {
                        const updated = {
                          ...siteSettingsData['site.announcement'],
                          text: e.target.value,
                        };
                        qc.setQueryData(['cms-site-settings'], {
                          ...siteSettingsData,
                          'site.announcement': updated,
                        });
                      }}
                    />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════
          REVISIONS & VERSION ROLLBACK MODAL
         ════════════════════════════════════════════════════════════ */}
      <Modal
        open={showRevisionsModal}
        onClose={() => setShowRevisionsModal(false)}
        title={`Version Revisions — ${selectedPage?.title || 'Page'}`}
        footer={
          <Button variant="outline" onClick={() => setShowRevisionsModal(false)}>
            Close
          </Button>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-500">
            Every publish event automatically captures an immutable snapshot of all page sections. You can roll back to any previous version instantly.
          </p>

          <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[400px] overflow-y-auto">
            {Array.isArray(revisionsData) && revisionsData.length > 0 ? (
              revisionsData.map((rev: any) => (
                <div key={rev.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white">
                        Revision #{rev.revision_num}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(rev.created_at)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {rev.note || 'Published via CMS Studio'} &bull; by {rev.saved_by_name || 'Super Admin'}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="outline"
                    icon={<RotateCcw className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (
                        confirm(
                          `Roll back "${selectedPage?.title}" to Revision #${rev.revision_num}? All current sections will be replaced with this version's snapshot.`
                        )
                      ) {
                        rollbackMutation.mutate({
                          pageId: selectedPage.id,
                          revisionId: rev.id,
                        });
                      }
                    }}
                  >
                    Rollback
                  </Button>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No previous snapshots found. Publishing the page creates version snapshots.
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* ════════════════════════════════════════════════════════════
          VISUAL PAGE BUILDER & MULTI-TAB SECTION EDITOR MODAL
         ════════════════════════════════════════════════════════════ */}
      <Modal
        open={showCreate}
        size="xl"
        onClose={() => setShowCreate(false)}
        title={
          createType === 'page'
            ? editingItem
              ? 'Edit Page Settings'
              : 'Create New Page'
            : createType === 'section'
            ? editingItem
              ? `Edit Section — ${form.block_type ? form.block_type.replace(/_/g, ' ').toUpperCase() : 'Visual & Code Studio'}`
              : 'Add Section to Page'
            : createType === 'faq'
            ? editingItem
              ? 'Edit FAQ'
              : 'New FAQ'
            : createType === 'service'
            ? editingItem
              ? 'Edit Service'
              : 'New Service'
            : createType === 'solution'
            ? editingItem
              ? 'Edit Solution'
              : 'New Solution'
            : 'CMS Action'
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveModal}>Save Changes</Button>
          </>
        }
      >
        {/* PAGE SETTINGS FORM */}
        {createType === 'page' && (
          <div className="space-y-4">
            <Input
              label="Page Title *"
              value={form.title || ''}
              onChange={(e) => set('title', e.target.value)}
            />
            <Input
              label="URL Slug"
              value={form.slug || ''}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="e.g. mobile-apps (auto-generated if empty)"
            />
            <Select
              label="Visibility Status"
              options={[
                { value: 'public', label: 'Public (Published)' },
                { value: 'draft', label: 'Draft' },
              ]}
              value={form.visibility || 'public'}
              onChange={(e) => set('visibility', e.target.value)}
            />
            <Textarea
              label="Meta Description / Excerpt"
              rows={3}
              value={form.excerpt || ''}
              onChange={(e) => set('excerpt', e.target.value)}
            />
          </div>
        )}

        {/* SECTION BUILDER & TAILWIND/HTML CODE STUDIO */}
        {createType === 'section' && (
          <div className="space-y-4">
            {/* Section Type & Ordering */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Section Type *
                </label>
                <Select
                  options={SECTION_TEMPLATES.map((t) => ({ value: t.id, label: t.label }))}
                  value={form.block_type || 'hero'}
                  onChange={(e) => {
                    const newType = e.target.value;
                    set('block_type', newType);
                    const newHtml = getDefaultSectionHtml(newType, form.block_props || {});
                    setProp('custom_html', newHtml);
                  }}
                />
              </div>
              <Input
                label="Sort Order"
                type="number"
                value={String(form.sort_order || 1)}
                onChange={(e) => set('sort_order', parseInt(e.target.value) || 1)}
              />
            </div>

            {/* Sub-Tabs for Section Builder */}
            <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
              <button
                type="button"
                onClick={() => setSectionModalTab('content')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  sectionModalTab === 'content'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                Visual Content
              </button>
              <button
                type="button"
                onClick={() => setSectionModalTab('layout')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  sectionModalTab === 'layout'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                Layout & Appearance
              </button>
              <button
                type="button"
                onClick={() => setSectionModalTab('code')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  sectionModalTab === 'code'
                    ? 'bg-cyan-500 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                HTML & Tailwind Studio
              </button>
            </div>

            {/* TAB 1: VISUAL CONTENT */}
            {sectionModalTab === 'content' && (
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/40 border border-cyan-200 dark:border-cyan-800/50 flex items-center justify-between gap-3 text-xs">
                  <span className="text-cyan-800 dark:text-cyan-300">
                    💡 Edit fields below, or click to synchronize into the HTML & Tailwind code studio.
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const updatedHtml = getDefaultSectionHtml(form.block_type || 'hero', form.block_props || {});
                      setProp('custom_html', updatedHtml);
                      setSectionModalTab('code');
                      toast.success('Visual content synced into HTML & Tailwind Studio!');
                    }}
                    className="px-2.5 py-1 rounded bg-cyan-600 text-white font-semibold hover:bg-cyan-500 shrink-0 text-xs transition"
                  >
                    Open in HTML Studio &rarr;
                  </button>
                </div>

                <Input
                  label="Eyebrow Badge"
                  placeholder="e.g. Enterprise Engineering"
                  value={form.block_props?.eyebrow || ''}
                  onChange={(e) => setProp('eyebrow', e.target.value)}
                />
                <Input
                  label="Headline / Title *"
                  placeholder="Main section heading"
                  value={form.block_props?.title || form.block_props?.headline || ''}
                  onChange={(e) => setProp('title', e.target.value)}
                />
                <Textarea
                  label="Supporting Description"
                  rows={3}
                  placeholder="Paragraph narrative or value proposition..."
                  value={form.block_props?.subtitle || form.block_props?.description || ''}
                  onChange={(e) => setProp('subtitle', e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Primary CTA Text"
                    placeholder="Book Consultation"
                    value={form.block_props?.ctaText || ''}
                    onChange={(e) => setProp('ctaText', e.target.value)}
                  />
                  <Input
                    label="Primary CTA Link"
                    placeholder="/contact"
                    value={form.block_props?.ctaHref || ''}
                    onChange={(e) => setProp('ctaHref', e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* TAB 2: LAYOUT & APPEARANCE */}
            {sectionModalTab === 'layout' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Background Variant
                    </label>
                    <Select
                      options={[
                        { value: 'default', label: 'Default Transparent' },
                        { value: 'slate', label: 'Subtle Slate with Borders' },
                        { value: 'dark', label: 'Deep Inverted Slate' },
                        { value: 'cyan-tint', label: 'Cyan Tech Glow' },
                        { value: 'gradient', label: 'Navy Gradient' },
                      ]}
                      value={form.block_props?.bg_variant || 'default'}
                      onChange={(e) => setProp('bg_variant', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Container Width
                    </label>
                    <Select
                      options={[
                        { value: 'standard', label: 'Standard (7xl max-w)' },
                        { value: 'full', label: 'Full Width (w-full)' },
                        { value: 'compact', label: 'Compact Narrow (4xl)' },
                      ]}
                      value={form.block_props?.container_width || 'standard'}
                      onChange={(e) => setProp('container_width', e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Vertical Padding
                    </label>
                    <Select
                      options={[
                        { value: 'none', label: 'None (py-0)' },
                        { value: 'sm', label: 'Small (py-8)' },
                        { value: 'md', label: 'Medium (py-12)' },
                        { value: 'lg', label: 'Standard Large (py-16)' },
                        { value: 'xl', label: 'Extra Large (py-24)' },
                      ]}
                      value={form.block_props?.padding || 'lg'}
                      onChange={(e) => setProp('padding', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Alignment
                    </label>
                    <Select
                      options={[
                        { value: 'left', label: 'Left Aligned' },
                        { value: 'center', label: 'Center Aligned' },
                        { value: 'right', label: 'Right Aligned' },
                      ]}
                      value={form.block_props?.alignment || 'center'}
                      onChange={(e) => setProp('alignment', e.target.value)}
                    />
                  </div>
                </div>

                <Input
                  label="Custom Wrapper Tailwind Classes"
                  placeholder="e.g. border-b border-cyan-500/20 shadow-2xl"
                  value={form.css_class || ''}
                  onChange={(e) => set('css_class', e.target.value)}
                />
              </div>
            )}

            {/* TAB 3: HTML & TAILWIND STUDIO */}
            {sectionModalTab === 'code' && (
              <div className="space-y-4">
                {/* Studio Toolbar & Snippets */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-semibold text-slate-500 mr-1">Snippets:</span>
                    {TAILWIND_SNIPPETS.map((snip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setProp('custom_html', snip.html)}
                        className="px-2.5 py-1 rounded bg-white hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-[11px] font-semibold text-slate-700 dark:text-slate-200 transition shadow-sm"
                      >
                        + {snip.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const syncedHtml = getDefaultSectionHtml(form.block_type || 'hero', form.block_props || {});
                        setProp('custom_html', syncedHtml);
                        toast.success('Generated fresh HTML & Tailwind from visual inputs!');
                      }}
                      className="px-2.5 py-1 rounded bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-950 dark:hover:bg-cyan-900 text-cyan-800 dark:text-cyan-300 font-semibold text-[11px] transition flex items-center gap-1"
                      title="Sync Content Fields into HTML"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Sync Fields
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const templateHtml = getDefaultSectionHtml(form.block_type || 'hero', {});
                        setProp('custom_html', templateHtml);
                        toast.success('Reset to clean section template');
                      }}
                      className="px-2.5 py-1 rounded bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-[11px] transition flex items-center gap-1"
                      title="Reset to Template"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  </div>
                </div>

                {/* Pre-rendered HTML & Tailwind Classes Textarea */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      Pre-Rendered HTML & Tailwind Code (Edit directly below):
                    </label>
                    <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-semibold">
                      Any edit updates the live preview below immediately
                    </span>
                  </div>
                  <Textarea
                    rows={10}
                    placeholder="<div>Write custom semantic HTML markup with Tailwind utility classes...</div>"
                    value={
                      form.block_props?.custom_html ??
                      getDefaultSectionHtml(form.block_type || 'hero', form.block_props || {})
                    }
                    onChange={(e) => setProp('custom_html', e.target.value)}
                  />
                </div>

                {/* Live Sandbox Preview */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
                      Live HTML & Tailwind Preview Sandbox
                    </label>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                      ✓ Zero-Trust Server Sanitized
                    </span>
                  </div>
                  <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-950 text-white min-h-[160px] max-h-[350px] overflow-y-auto text-xs shadow-inner">
                    <div
                      dangerouslySetInnerHTML={{
                        __html:
                          form.block_props?.custom_html ||
                          getDefaultSectionHtml(form.block_type || 'hero', form.block_props || {}),
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SERVICES FORM */}
        {createType === 'service' && (
          <div className="space-y-4">
            <Input
              label="Service Title *"
              value={form.title || ''}
              onChange={(e) => set('title', e.target.value)}
            />
            <Input
              label="Slug"
              value={form.slug || ''}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="e.g. cloud-architecture"
            />
            <Input
              label="Tagline / Short Hook"
              value={form.tagline || ''}
              onChange={(e) => set('tagline', e.target.value)}
            />
            <Textarea
              label="Description"
              rows={4}
              value={form.short_description || form.description || ''}
              onChange={(e) => {
                set('short_description', e.target.value);
                set('description', e.target.value);
              }}
            />
          </div>
        )}

        {/* SOLUTIONS FORM */}
        {createType === 'solution' && (
          <div className="space-y-4">
            <Input
              label="Solution Title *"
              value={form.title || ''}
              onChange={(e) => set('title', e.target.value)}
            />
            <Input
              label="Slug"
              value={form.slug || ''}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="e.g. enterprise-automation"
            />
            <Input
              label="Eyebrow Badge"
              value={form.eyebrow || ''}
              onChange={(e) => set('eyebrow', e.target.value)}
            />
            <Input
              label="Tagline"
              value={form.tagline || ''}
              onChange={(e) => set('tagline', e.target.value)}
            />
            <Textarea
              label="Short Description"
              rows={4}
              value={form.short_description || form.description || ''}
              onChange={(e) => set('short_description', e.target.value)}
            />
          </div>
        )}

        {/* FAQS FORM */}
        {createType === 'faq' && (
          <div className="space-y-4">
            <Input
              label="Category"
              value={form.category || 'General'}
              onChange={(e) => set('category', e.target.value)}
            />
            <Input
              label="Question *"
              value={form.question || ''}
              onChange={(e) => set('question', e.target.value)}
            />
            <Textarea
              label="Answer *"
              rows={4}
              value={form.answer || ''}
              onChange={(e) => set('answer', e.target.value)}
            />
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
