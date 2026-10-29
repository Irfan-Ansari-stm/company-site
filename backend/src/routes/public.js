// src/routes/public.js
// Public Content Delivery APIs for Software A-Z / Sysmaira Platform
const router = require('express').Router();
const { query } = require('../config/database');
const { paginate, paginateResponse } = require('../middleware/common');
const { success, created, generatePublicId } = require('../utils/helpers');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { memoryCache } = require('../utils/cache');

// High-speed caching middleware for public content delivery (120s TTL)
router.use(memoryCache.middleware(120));

// ════════════════════════════════════════════════════════════
//  SITE SETTINGS & GLOBAL BRANDING
// ════════════════════════════════════════════════════════════
router.get('/site-settings', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT key, value FROM system_schema.settings WHERE is_public = TRUE OR group_name IN ('branding', 'social', 'contact', 'announcement')`
  );
  const settings = {};
  rows.forEach(r => {
    try {
      settings[r.key] = typeof r.value === 'string' ? JSON.parse(r.value) : r.value;
    } catch {
      settings[r.key] = r.value;
    }
  });

  return success(res, {
    siteName: settings['site.name'] || 'Sysmaira Software Solutions',
    tagline: settings['site.tagline'] || 'Custom Software Development & IT Services',
    url: settings['site.url'] || 'https://sysmaira.com',
    logoUrl: settings['site.logo_url'] || '/images/logo.webp',
    faviconUrl: settings['site.favicon_url'] || '/favicon.ico',
    contact: {
      email: settings['contact.email'] || settings['email.support'] || 'hello@sysmaira.com',
      phone: settings['contact.phone'] || '+1 (555) 019-2831',
      address: settings['company.address'] || '100 Montgomery St, Suite 1800, San Francisco, CA, 94104',
      workingHours: settings['contact.working_hours'] || 'Mon - Fri: 9:00 AM - 6:00 PM PST',
    },
    announcement: settings['site.announcement'] || {
      enabled: true,
      badge: 'Architecture Advisory',
      text: 'Schedule an enterprise architectural scoping session with a Principal Systems Architect.',
      ctaText: 'Book Technical Consultation',
      ctaHref: '/contact',
    },
    social: settings['site.social'] || [
      { name: 'Twitter', href: 'https://twitter.com', icon: 'Twitter' },
      { name: 'Github', href: 'https://github.com', icon: 'Github' },
      { name: 'Linkedin', href: 'https://linkedin.com', icon: 'Linkedin' },
      { name: 'Youtube', href: 'https://youtube.com', icon: 'Youtube' },
    ],
    copyright: settings['site.copyright'] || `© ${new Date().getFullYear()} Sysmaira Software Solutions Inc. All rights reserved.`,
    defaultSeo: settings['site.default_seo'] || {
      title: 'Sysmaira Software Solutions | Custom Software Development & IT Services',
      description: 'End-to-end custom software development, modern web applications, mobile app engineering, UI/UX design, API integrations, and ongoing software maintenance.',
      ogImage: '/images/og-preview.png',
    },
    theme: settings['theme.tokens'] || null,
  });
}));

// ════════════════════════════════════════════════════════════
//  NAVIGATION & HEADER
// ════════════════════════════════════════════════════════════
router.get('/navigation', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM cms_schema.menus WHERE location = 'header' AND is_active = TRUE LIMIT 1`
  );

  if (rows.length && rows[0].items) {
    return success(res, rows[0].items);
  }

  // Fallback defaults if menu record is initializing
  return success(res, {
    brandName: 'Sysmaira Software',
    brandSubtitle: 'Solutions',
    logoUrl: '/images/logo.webp',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Services', href: '/services' },
      { label: 'Solutions', href: '/solutions' },
      { label: 'Process', href: '/process' },
      { label: 'Engagement', href: '/engagement-models' },
      { label: 'Showcases', href: '/showcases' },
      { label: 'Blog', href: '/blog' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contact', href: '/contact' },
    ],
    primaryCta: { label: 'Get Started', href: '/contact' },
    secondaryCta: { label: 'Sign In', href: '/auth/login' },
  });
}));

// ════════════════════════════════════════════════════════════
//  FOOTER
// ════════════════════════════════════════════════════════════
router.get('/footer', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM cms_schema.menus WHERE location = 'footer' AND is_active = TRUE LIMIT 1`
  );

  if (rows.length && rows[0].items) {
    return success(res, rows[0].items);
  }

  // Fallback defaults
  return success(res, {
    brandName: 'Sysmaira Software Solutions',
    description: 'We design, build, and support reliable software applications for growing businesses and enterprises. Practical technology, clear communication, and dependable execution.',
    social: [
      { name: 'Twitter', href: 'https://twitter.com', icon: 'Twitter' },
      { name: 'Github', href: 'https://github.com', icon: 'Github' },
      { name: 'Linkedin', href: 'https://linkedin.com', icon: 'Linkedin' },
      { name: 'Youtube', href: 'https://youtube.com', icon: 'Youtube' },
    ],
    columns: [
      {
        title: 'Core Services',
        links: [
          { label: 'Custom Software Development', href: '/services#custom-software' },
          { label: 'Web Application Development', href: '/services#web-apps' },
          { label: 'Mobile App Engineering', href: '/services#mobile-apps' },
          { label: 'UI/UX Design Systems', href: '/services#design-systems' },
          { label: 'System Integration & APIs', href: '/services#api-integration' },
          { label: 'Legacy Modernization', href: '/services#modernization' },
        ],
      },
      {
        title: 'Solutions',
        links: [
          { label: 'Business Process Automation', href: '/solutions#process-automation' },
          { label: 'Customer Portals & Dashboards', href: '/solutions#customer-portals' },
          { label: 'Mobile Workforce Applications', href: '/solutions#mobile-workforce' },
          { label: 'Legacy Modernization', href: '/solutions#modernization' },
          { label: 'Dedicated Developer Teams', href: '/solutions#developer-teams' },
        ],
      },
      {
        title: 'Methodology',
        links: [
          { label: 'Delivery Process', href: '/process' },
          { label: 'Engagement Models', href: '/engagement-models' },
          { label: 'Showcases & Portfolio', href: '/showcases' },
          { label: 'Client FAQs', href: '/faq' },
          { label: 'Engineering Blog', href: '/blog' },
        ],
      },
      {
        title: 'Company',
        links: [
          { label: 'About Sysmaira', href: '/about' },
          { label: 'Consultation & Contact', href: '/contact' },
          { label: 'Privacy Policy', href: '/privacy' },
          { label: 'Terms of Service', href: '/terms' },
          { label: 'Client Portal Login', href: '/auth/login' },
        ],
      },
    ],
    legal: [
      { label: 'Privacy Policy', href: '/privacy' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Security & Compliance', href: '/security-compliance' },
    ],
    copyright: `© ${new Date().getFullYear()} Sysmaira Software Solutions Inc. All rights reserved.`,
  });
}));

// ════════════════════════════════════════════════════════════
//  PAGE BUILDER: GET /pages/:slug (WITH SECTIONS)
// ════════════════════════════════════════════════════════════
router.get('/pages/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;

  const pageQuery = slug === 'home' || slug === 'index'
    ? `SELECT p.*, sm.meta_title, sm.meta_description, sm.og_image_url, sm.canonical_url, sm.schema_json
         FROM cms_schema.pages p
         LEFT JOIN cms_schema.seo_meta sm ON p.seo_id = sm.id
        WHERE (p.slug = 'home' OR p.is_homepage = TRUE) AND p.visibility = 'public' AND p.deleted_at IS NULL
        LIMIT 1`
    : `SELECT p.*, sm.meta_title, sm.meta_description, sm.og_image_url, sm.canonical_url, sm.schema_json
         FROM cms_schema.pages p
         LEFT JOIN cms_schema.seo_meta sm ON p.seo_id = sm.id
        WHERE p.slug = $1 AND p.visibility = 'public' AND p.deleted_at IS NULL
        LIMIT 1`;

  const pageParams = (slug === 'home' || slug === 'index') ? [] : [slug];
  const { rows: pageRows } = await query(pageQuery, pageParams);

  if (!pageRows.length) {
    throw new AppError(`Page not found: ${slug}`, 404);
  }

  const page = pageRows[0];

  // Retrieve all visible sections ordered by sort_order
  const { rows: sections } = await query(
    `SELECT id, block_type, block_props, sort_order, animation, css_class
       FROM cms_schema.page_sections
      WHERE page_id = $1 AND is_visible = TRUE
      ORDER BY sort_order ASC`,
    [page.id]
  );

  return success(res, {
    id: page.id,
    title: page.title,
    slug: page.slug,
    template: page.template,
    excerpt: page.excerpt,
    isHomepage: page.is_homepage,
    publishedAt: page.published_at,
    metadata: page.metadata,
    seo: {
      title: page.meta_title || page.title,
      description: page.meta_description || page.excerpt,
      ogImage: page.og_image_url,
      canonicalUrl: page.canonical_url,
      schemaJson: page.schema_json,
    },
    sections: sections.map(s => ({
      id: s.id,
      type: s.block_type,
      props: s.block_props,
      sortOrder: s.sort_order,
      cssClass: s.css_class,
      animation: s.animation,
    })),
  });
}));

// ════════════════════════════════════════════════════════════
//  SERVICES (CATALOG & DETAIL)
// ════════════════════════════════════════════════════════════
router.get('/services', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT s.*, sc.name AS category_name, sc.slug AS category_slug,
            sm.meta_title, sm.meta_description, sm.og_image_url
       FROM cms_schema.services s
       LEFT JOIN cms_schema.service_categories sc ON s.category_id = sc.id
       LEFT JOIN cms_schema.seo_meta sm ON s.seo_id = sm.id
      WHERE s.is_active = TRUE AND s.deleted_at IS NULL
      ORDER BY s.sort_order ASC`
  );
  return success(res, rows);
}));

router.get('/services/:slug', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT s.*, sc.name AS category_name, sc.slug AS category_slug,
            sm.meta_title, sm.meta_description, sm.og_image_url
       FROM cms_schema.services s
       LEFT JOIN cms_schema.service_categories sc ON s.category_id = sc.id
       LEFT JOIN cms_schema.seo_meta sm ON s.seo_id = sm.id
      WHERE s.slug = $1 AND s.is_active = TRUE AND s.deleted_at IS NULL`,
    [req.params.slug]
  );
  if (!rows.length) throw new AppError('Service not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  SOLUTIONS (CATALOG & DETAIL)
// ════════════════════════════════════════════════════════════
router.get('/solutions', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM cms_schema.solutions
      WHERE is_active = TRUE
      ORDER BY sort_order ASC`
  );
  return success(res, rows);
}));

router.get('/solutions/:slug', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM cms_schema.solutions
      WHERE slug = $1 AND is_active = TRUE`,
    [req.params.slug]
  );
  if (!rows.length) throw new AppError('Solution not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  SHOWCASES / PORTFOLIO
// ════════════════════════════════════════════════════════════
router.get('/showcases', asyncHandler(async (req, res) => {
  const { category, featured } = req.query;
  const conditions = ['p.is_published = TRUE', 'p.deleted_at IS NULL'];
  const params = [];
  let idx = 1;

  if (featured !== undefined) {
    conditions.push(`p.is_featured = $${idx}`);
    params.push(featured === 'true');
    idx++;
  }

  const { rows } = await query(
    `SELECT p.*, sm.meta_title, sm.meta_description, sm.og_image_url
       FROM portfolio_schema.projects p
       LEFT JOIN cms_schema.seo_meta sm ON p.seo_id = sm.id
      WHERE ${conditions.join(' AND ')}
      ORDER BY p.display_order ASC`,
    params
  );
  return success(res, rows);
}));

router.get('/showcases/:slug', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT p.*, sm.meta_title, sm.meta_description, sm.og_image_url
       FROM portfolio_schema.projects p
       LEFT JOIN cms_schema.seo_meta sm ON p.seo_id = sm.id
      WHERE p.slug = $1 AND p.is_published = TRUE AND p.deleted_at IS NULL`,
    [req.params.slug]
  );
  if (!rows.length) throw new AppError('Showcase not found', 404);
  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  FAQS
// ════════════════════════════════════════════════════════════
router.get('/faqs', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const conditions = ['is_published = TRUE'];
  const params = [];
  if (category) {
    conditions.push('category = $1');
    params.push(category);
  }

  const { rows } = await query(
    `SELECT * FROM cms_schema.faqs
      WHERE ${conditions.join(' AND ')}
      ORDER BY sort_order ASC, created_at ASC`,
    params
  );
  return success(res, rows);
}));

// ════════════════════════════════════════════════════════════
//  DELIVERY PROCESS
// ════════════════════════════════════════════════════════════
router.get('/delivery-process', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM cms_schema.delivery_process
      WHERE is_active = TRUE
      ORDER BY sort_order ASC, step_number ASC`
  );
  return success(res, rows);
}));

// ════════════════════════════════════════════════════════════
//  ENGAGEMENT MODELS
// ════════════════════════════════════════════════════════════
router.get('/engagement-models', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT * FROM cms_schema.engagement_models
      WHERE is_active = TRUE
      ORDER BY sort_order ASC`
  );
  return success(res, rows);
}));

// ════════════════════════════════════════════════════════════
//  BLOG: PUBLISHED ARTICLES ONLY (EXCLUDES DRAFTS)
// ════════════════════════════════════════════════════════════
router.get('/blog', paginate, asyncHandler(async (req, res) => {
  const { category, tag, search, featured } = req.query;
  const conditions = [`p.status = 'published'`, 'p.deleted_at IS NULL'];
  const params = [];
  let idx = 1;

  if (category) {
    conditions.push(`c.slug = $${idx}`);
    params.push(category);
    idx++;
  }
  if (featured !== undefined) {
    conditions.push(`p.is_featured = $${idx}`);
    params.push(featured === 'true');
    idx++;
  }
  if (search) {
    conditions.push(`(p.title ILIKE $${idx} OR p.excerpt ILIKE $${idx})`);
    params.push(`%${search}%`);
    idx++;
  }

  const where = conditions.join(' AND ');

  const [dataRes, countRes] = await Promise.all([
    query(
      `SELECT p.id, p.title, p.slug, p.excerpt, p.cover_image_url, p.read_time_min,
              p.published_at, p.is_featured, p.view_count, p.like_count, p.metadata,
              c.name AS category_name, c.slug AS category_slug,
              u.display_name AS author_name, u.avatar_url AS author_avatar
         FROM blog_schema.posts p
         LEFT JOIN blog_schema.categories c ON p.category_id = c.id
         LEFT JOIN auth_schema.users      u ON p.author_id = u.id
        WHERE ${where}
        ORDER BY p.published_at DESC NULLS LAST
        LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, req.pagination.limit, req.pagination.offset]
    ),
    query(
      `SELECT COUNT(*) FROM blog_schema.posts p
         LEFT JOIN blog_schema.categories c ON p.category_id = c.id
        WHERE ${where}`,
      params
    ),
  ]);

  return res.json(paginateResponse(dataRes.rows, countRes.rows[0].count, req.pagination));
}));

router.get('/blog/categories', asyncHandler(async (req, res) => {
  const { rows } = await query(
    `SELECT c.*, COUNT(p.id) FILTER (WHERE p.status = 'published' AND p.deleted_at IS NULL) AS post_count
       FROM blog_schema.categories c
       LEFT JOIN blog_schema.posts p ON c.id = p.category_id
      GROUP BY c.id ORDER BY post_count DESC, c.name ASC`
  );
  return success(res, rows);
}));

router.get('/blog/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const { rows } = await query(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug,
            u.display_name AS author_name, u.avatar_url AS author_avatar,
            sm.meta_title, sm.meta_description, sm.og_image_url, sm.canonical_url
       FROM blog_schema.posts p
       LEFT JOIN blog_schema.categories c ON p.category_id = c.id
       LEFT JOIN auth_schema.users      u ON p.author_id = u.id
       LEFT JOIN cms_schema.seo_meta    sm ON p.seo_id = sm.id
      WHERE p.slug = $1 AND p.status = 'published' AND p.deleted_at IS NULL`,
    [slug]
  );

  if (!rows.length) {
    throw new AppError('Blog article not found or unpublished', 404);
  }

  // Asynchronously increment view count without blocking response
  query(`UPDATE blog_schema.posts SET view_count = view_count + 1 WHERE id = $1`, [rows[0].id]).catch(() => {});

  return success(res, rows[0]);
}));

// ════════════════════════════════════════════════════════════
//  CONTACT SUBMISSIONS / INQUIRIES
// ════════════════════════════════════════════════════════════
router.post('/contact-submissions', asyncHandler(async (req, res) => {
  // Honeypot anti-spam check
  if (req.body.website_url || req.body.honeypot || req.body.hp_company) {
    return created(res, { public_id: 'SPAM-FILTERED' }, 'Inquiry received successfully.');
  }

  let {
    name, first_name, last_name, email, phone, company, discipline, subject,
    services_needed, budget, budget_range, timeline, message, requirements,
    source = 'website'
  } = req.body;

  if (!email || (!name && !first_name)) {
    throw new AppError('Name and valid email address are required', 400);
  }

  if ((!first_name || !last_name) && name) {
    const parts = name.trim().split(/\s+/);
    first_name = first_name || parts[0] || 'Enterprise';
    last_name = last_name || (parts.length > 1 ? parts.slice(1).join(' ') : 'Partner');
  }

  const finalBudget = budget_range || budget || 'Not specified';
  const finalMessage = requirements || (subject ? `Subject: ${subject}\n\n${message || ''}` : message || '');
  const finalServices = services_needed || (discipline ? [discipline] : (subject ? [subject] : ['General Inquiry']));
  const allowedSources = ['website', 'referral', 'linkedin', 'google_ads', 'meta_ads', 'cold_outreach', 'partner', 'event', 'other'];
  const sanitizedSource = allowedSources.includes(source) ? source : 'website';
  const publicId = generatePublicId();

  // Insert into crm_schema.leads so it displays in CRM & Dashboard
  const { rows } = await query(
    `INSERT INTO crm_schema.leads
       (public_id, source, first_name, last_name, email, phone, company,
        services_needed, budget_range, requirements, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb)
     RETURNING id, public_id, first_name, last_name, email, created_at`,
    [
      publicId,
      sanitizedSource,
      first_name,
      last_name,
      email.toLowerCase().trim(),
      phone || null,
      company || null,
      finalServices,
      finalBudget,
      finalMessage,
      JSON.stringify({ subject, timeline, raw_body: req.body }),
    ]
  );

  return created(res, rows[0], 'Thank you! Your technical inquiry has been received. Our engineering lead will respond within 24 hours.');
}));

module.exports = router;
