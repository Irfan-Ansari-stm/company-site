// backend/src/scripts/seed-cms-content.js
// Content Migration: Migrates all website content from frontend/data into PostgreSQL database.

import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env.local'), override: true });

// Import all frontend data modules
import { LANDING_DATA } from '../../../frontend/data/landingData.ts';
import { ABOUT_PAGE_DATA } from '../../../frontend/data/aboutPageData.ts';
import { SERVICES_PAGE_DATA } from '../../../frontend/data/servicesData.ts';
import { SOLUTIONS_PAGE_DATA } from '../../../frontend/data/solutionsData.ts';
import { SHOWCASES_DATA } from '../../../frontend/data/showcasesData.ts';
import { BLOG_PAGE_DATA, BLOG_ARTICLES } from '../../../frontend/data/blogData.ts';
import { FAQ_PAGE_DATA } from '../../../frontend/data/faqPageData.ts';
import { PROCESS_DATA } from '../../../frontend/data/processData.ts';
import { ENGAGEMENT_MODELS_DATA } from '../../../frontend/data/engagementModelsData.ts';

const pool = new pg.Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'sysmaira',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Admin123',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function seedContent() {
  console.log('🚀 Starting Comprehensive CMS & Website Content Migration...');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // 1. SITE SETTINGS & BRANDING
    console.log('📦 1/9 Migrating Global Site Settings & Branding...');
    const settingsEntries = [
      { key: 'site.name', val: 'Sysmaira Software Solutions', grp: 'branding', pub: true },
      { key: 'site.tagline', val: 'Custom Software Development & IT Services', grp: 'branding', pub: true },
      { key: 'site.url', val: 'https://sysmaira.com', grp: 'branding', pub: true },
      { key: 'site.logo_url', val: '/images/logo.webp', grp: 'branding', pub: true },
      { key: 'site.favicon_url', val: '/favicon.ico', grp: 'branding', pub: true },
      { key: 'contact.email', val: 'hello@sysmaira.com', grp: 'contact', pub: true },
      { key: 'contact.phone', val: '+1 (555) 019-2831', grp: 'contact', pub: true },
      { key: 'company.address', val: '100 Montgomery St, Suite 1800, San Francisco, CA, 94104', grp: 'contact', pub: true },
      { key: 'contact.working_hours', val: 'Mon - Fri: 9:00 AM - 6:00 PM PST', grp: 'contact', pub: true },
      { key: 'site.announcement', val: LANDING_DATA.announcement, grp: 'announcement', pub: true },
      { key: 'site.social', val: LANDING_DATA.footer.social, grp: 'social', pub: true },
      { key: 'site.copyright', val: LANDING_DATA.footer.copyright, grp: 'branding', pub: true },
      {
        key: 'site.default_seo',
        val: {
          title: 'Sysmaira Software Solutions | Custom Software Development & IT Services',
          description: 'End-to-end custom software development, modern web applications, mobile app engineering, UI/UX design, API integrations, and ongoing software maintenance.',
          ogImage: '/images/og-preview.png',
        },
        grp: 'branding',
        pub: true,
      },
    ];

    for (const s of settingsEntries) {
      await client.query(
        `INSERT INTO system_schema.settings (key, value, group_name, is_public)
         VALUES ($1, $2::jsonb, $3, $4)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [s.key, JSON.stringify(s.val), s.grp, s.pub]
      );
    }

    // 2. HEADER & FOOTER MENUS
    console.log('📦 2/9 Migrating Header & Footer Navigation Menus...');
    await client.query(
      `INSERT INTO cms_schema.menus (name, slug, location, items, is_active)
       VALUES ($1, $2, $3, $4::jsonb, TRUE)
       ON CONFLICT (slug) DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
      [
        'Main Header Navigation',
        'main-header-navigation',
        'header',
        JSON.stringify(LANDING_DATA.navigation),
      ]
    );

    await client.query(
      `INSERT INTO cms_schema.menus (name, slug, location, items, is_active)
       VALUES ($1, $2, $3, $4::jsonb, TRUE)
       ON CONFLICT (slug) DO UPDATE SET items = EXCLUDED.items, updated_at = NOW()`,
      [
        'Main Site Footer',
        'main-site-footer',
        'footer',
        JSON.stringify(LANDING_DATA.footer),
      ]
    );

    // 3. PAGES INVENTORY
    console.log('📦 3/9 Migrating Pages & SEO Metadata...');
    const pages = [
      {
        slug: 'home',
        title: 'Home | Sysmaira Software Solutions',
        template: 'landing',
        is_homepage: true,
        excerpt: 'Custom software development, modern web applications, mobile app engineering, and API integrations.',
      },
      {
        slug: 'about-us',
        title: 'About Us | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: ABOUT_PAGE_DATA.hero.description,
      },
      {
        slug: 'services',
        title: 'Software Development Services | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: SERVICES_PAGE_DATA.hero.description,
      },
      {
        slug: 'solutions',
        title: 'Enterprise Software Solutions | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: SOLUTIONS_PAGE_DATA.hero.description,
      },
      {
        slug: 'process',
        title: 'Software Delivery Process | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: PROCESS_DATA.hero.description,
      },
      {
        slug: 'engagement-models',
        title: 'Software Engagement Models | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: ENGAGEMENT_MODELS_DATA.hero.description,
      },
      {
        slug: 'faq',
        title: 'Frequently Asked Questions | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: FAQ_PAGE_DATA.hero.description,
      },
      {
        slug: 'showcases',
        title: 'Client Showcases & Portfolio | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: SHOWCASES_DATA.hero.description,
      },
      {
        slug: 'blog',
        title: 'Software Engineering Insights & Blog | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: BLOG_PAGE_DATA.hero.supportingText,
      },
      {
        slug: 'contact',
        title: 'Contact Us & Technical Consultation | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: 'Initiate a confidential software development consultation with our engineering leads.',
      },
      {
        slug: 'privacy',
        title: 'Privacy Policy & Data Protection | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: 'Our binding commitment to client confidentiality, data privacy, and secure engineering practices.',
      },
      {
        slug: 'terms',
        title: 'Terms of Service & Master Services Agreement | Sysmaira Software Solutions',
        template: 'default',
        is_homepage: false,
        excerpt: 'Legal operating framework and commercial terms governing all client software development services.',
      },
    ];

    const pageIdMap = {};

    for (let i = 0; i < pages.length; i++) {
      const p = pages[i];
      const { rows } = await client.query(
        `INSERT INTO cms_schema.pages (title, slug, template, excerpt, is_homepage, visibility, sort_order, published_at)
         VALUES ($1, $2, $3, $4, $5, 'public', $6, NOW())
         ON CONFLICT (slug) DO UPDATE
            SET title = EXCLUDED.title,
                template = EXCLUDED.template,
                excerpt = EXCLUDED.excerpt,
                is_homepage = EXCLUDED.is_homepage,
                visibility = 'public',
                deleted_at = NULL,
                updated_at = NOW()
         RETURNING id`,
        [p.title, p.slug, p.template, p.excerpt, p.is_homepage, i + 1]
      );
      pageIdMap[p.slug] = rows[0].id;
    }

    // 4. PAGE SECTIONS (STRUCTURED DYNAMIC CONTENT BUILDER)
    console.log('📦 4/9 Migrating Reusable Page Sections for All Pages...');

    // Define sections per page
    const sectionsByPage = {
      home: [
        { type: 'hero', props: LANDING_DATA.hero },
        { type: 'trust_proof', props: LANDING_DATA.trust },
        { type: 'problem_solution', props: LANDING_DATA.problemSolution },
        { type: 'features_benefits', props: { features: LANDING_DATA.features } },
        { type: 'showcase', props: LANDING_DATA.showcase },
        { type: 'how_it_works', props: LANDING_DATA.howItWorks },
        { type: 'benefits_differentiators', props: LANDING_DATA.differentiators },
        { type: 'results_metrics', props: LANDING_DATA.caseStudies },
        { type: 'testimonials', props: LANDING_DATA.testimonials },
        { type: 'pricing_models', props: LANDING_DATA.pricing },
        { type: 'faq', props: LANDING_DATA.faq },
        { type: 'final_cta', props: LANDING_DATA.finalCta },
      ],
      'about-us': [
        { type: 'about_hero', props: ABOUT_PAGE_DATA.hero },
        { type: 'about_who_we_are', props: ABOUT_PAGE_DATA.whoWeAre },
        { type: 'about_mission_vision', props: ABOUT_PAGE_DATA.missionVision },
        { type: 'about_what_we_do', props: ABOUT_PAGE_DATA.whatWeDo },
        { type: 'about_approach', props: ABOUT_PAGE_DATA.approach },
        { type: 'about_core_values', props: ABOUT_PAGE_DATA.coreValues },
        { type: 'about_process', props: ABOUT_PAGE_DATA.process },
        { type: 'about_who_we_work_with', props: ABOUT_PAGE_DATA.whoWeWorkWith },
        { type: 'about_why_us', props: ABOUT_PAGE_DATA.whyUs },
        { type: 'about_team_expertise', props: ABOUT_PAGE_DATA.teamExpertise },
        { type: 'about_faq_preview', props: ABOUT_PAGE_DATA.faqPreview },
        { type: 'about_closing_cta', props: ABOUT_PAGE_DATA.closingCta },
      ],
      services: [
        { type: 'services_hero', props: SERVICES_PAGE_DATA.hero },
        { type: 'services_overview', props: SERVICES_PAGE_DATA.overview },
        { type: 'services_core_grid', props: SERVICES_PAGE_DATA.coreServices },
        { type: 'services_technologies', props: SERVICES_PAGE_DATA.technologies },
        { type: 'services_industry_use_cases', props: SERVICES_PAGE_DATA.industryUseCases },
        { type: 'services_business_challenges', props: SERVICES_PAGE_DATA.businessChallenges },
        { type: 'services_project_scenarios', props: SERVICES_PAGE_DATA.projectScenarios },
        { type: 'services_faqs', props: SERVICES_PAGE_DATA.faqs },
        { type: 'services_cta', props: SERVICES_PAGE_DATA.cta },
      ],
      solutions: [
        { type: 'solutions_hero', props: SOLUTIONS_PAGE_DATA.hero },
        { type: 'solutions_challenges', props: SOLUTIONS_PAGE_DATA.challenges },
        { type: 'solutions_directory', props: SOLUTIONS_PAGE_DATA.directory },
        { type: 'solutions_flagship', props: SOLUTIONS_PAGE_DATA.flagshipDeepDive },
        { type: 'solutions_by_function', props: SOLUTIONS_PAGE_DATA.byFunction },
        { type: 'solutions_by_industry', props: SOLUTIONS_PAGE_DATA.byIndustry },
        { type: 'solutions_how_it_works', props: SOLUTIONS_PAGE_DATA.howSolutionsWork },
        { type: 'solutions_capabilities', props: SOLUTIONS_PAGE_DATA.capabilities },
        { type: 'solutions_use_cases', props: SOLUTIONS_PAGE_DATA.exampleUseCases },
        { type: 'solutions_case_studies', props: SOLUTIONS_PAGE_DATA.caseStudies },
        { type: 'solutions_why_choose_us', props: SOLUTIONS_PAGE_DATA.whyChooseUs },
        { type: 'solutions_faq', props: SOLUTIONS_PAGE_DATA.faq },
        { type: 'solutions_final_cta', props: SOLUTIONS_PAGE_DATA.finalCta },
      ],
      process: [
        { type: 'process_hero', props: PROCESS_DATA.hero },
        { type: 'process_stages', props: PROCESS_DATA.stages },
        { type: 'process_principles', props: PROCESS_DATA.principles },
        { type: 'process_faqs', props: PROCESS_DATA.faqs },
        { type: 'process_cta', props: PROCESS_DATA.cta },
      ],
      'engagement-models': [
        { type: 'engagement_hero', props: ENGAGEMENT_MODELS_DATA.hero },
        { type: 'engagement_models_list', props: ENGAGEMENT_MODELS_DATA.models },
        { type: 'engagement_comparison_table', props: ENGAGEMENT_MODELS_DATA.comparisonTable },
        { type: 'engagement_selection_guidance', props: ENGAGEMENT_MODELS_DATA.selectionGuidance },
        { type: 'engagement_faqs', props: ENGAGEMENT_MODELS_DATA.faqs },
        { type: 'engagement_cta', props: ENGAGEMENT_MODELS_DATA.cta },
      ],
      faq: [
        { type: 'faq_hero', props: FAQ_PAGE_DATA.hero },
        { type: 'faq_categories_list', props: FAQ_PAGE_DATA.categories },
        { type: 'faq_cta', props: FAQ_PAGE_DATA.cta },
      ],
      showcases: [
        { type: 'showcases_hero', props: SHOWCASES_DATA.hero },
        { type: 'showcases_featured', props: SHOWCASES_DATA.featuredProject },
        { type: 'showcases_projects', props: SHOWCASES_DATA.projects },
        { type: 'showcases_tech_stack', props: SHOWCASES_DATA.techStack },
        { type: 'showcases_faq', props: SHOWCASES_DATA.faq },
        { type: 'showcases_cta', props: SHOWCASES_DATA.finalCta },
      ],
      blog: [
        { type: 'blog_hero', props: BLOG_PAGE_DATA.hero },
        { type: 'blog_featured_label', props: { label: BLOG_PAGE_DATA.featuredLabel } },
        { type: 'blog_latest_heading', props: { heading: BLOG_PAGE_DATA.latestHeading } },
        { type: 'blog_empty_state', props: BLOG_PAGE_DATA.emptyState },
        { type: 'blog_cta', props: BLOG_PAGE_DATA.cta },
      ],
      contact: [
        {
          type: 'contact_details',
          props: {
            eyebrow: 'Direct Architecture Inquiry',
            title: 'Technical Consultation & Project Scoping',
            description: 'Connect with a Principal Systems Architect. Review high-level requirements, obtain architectural feasibility assessments, and receive transparent estimates.',
          },
        },
      ],
      privacy: [
        {
          type: 'legal_privacy',
          props: {
            title: 'Privacy Policy & Data Protection Standards',
            lastUpdated: 'October 20, 2026',
          },
        },
      ],
      terms: [
        {
          type: 'legal_terms',
          props: {
            title: 'Master Services Agreement & Terms of Service',
            lastUpdated: 'October 20, 2026',
          },
        },
      ],
    };

    for (const [slug, sections] of Object.entries(sectionsByPage)) {
      const pageId = pageIdMap[slug];
      if (!pageId) continue;

      // Delete existing sections to recreate cleanly and idempotently
      await client.query(`DELETE FROM cms_schema.page_sections WHERE page_id = $1`, [pageId]);

      for (let sIdx = 0; sIdx < sections.length; sIdx++) {
        const sec = sections[sIdx];
        await client.query(
          `INSERT INTO cms_schema.page_sections (page_id, block_type, block_props, sort_order, is_visible)
           VALUES ($1, $2, $3::jsonb, $4, TRUE)`,
          [pageId, sec.type, JSON.stringify(sec.props || {}), sIdx + 1]
        );
      }
    }

    // 5. SERVICES CATALOG (CMS_SCHEMA.SERVICES)
    console.log('📦 5/9 Migrating Core Services Catalog...');
    for (let i = 0; i < SERVICES_PAGE_DATA.coreServices.length; i++) {
      const svc = SERVICES_PAGE_DATA.coreServices[i];
      await client.query(
        `INSERT INTO cms_schema.services
           (title, slug, tagline, summary, description, cover_image_url, delivery_items, tech_stack, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, $9, TRUE)
         ON CONFLICT (slug) DO UPDATE
            SET title = EXCLUDED.title,
                tagline = EXCLUDED.tagline,
                summary = EXCLUDED.summary,
                description = EXCLUDED.description,
                cover_image_url = EXCLUDED.cover_image_url,
                delivery_items = EXCLUDED.delivery_items,
                tech_stack = EXCLUDED.tech_stack,
                sort_order = EXCLUDED.sort_order,
                is_active = TRUE,
                deleted_at = NULL,
                updated_at = NOW()`,
        [
          svc.title,
          svc.slug,
          svc.eyebrow,
          svc.shortDescription,
          svc.detailedDescription,
          svc.imagePlaceholder?.url || null,
          JSON.stringify({
            capabilities: svc.capabilities || [],
            practicalUseScenario: svc.practicalUseScenario || '',
            ctaText: svc.ctaText || 'Discuss Your Project',
            ctaHref: svc.ctaHref || '#contact',
          }),
          svc.capabilities ? svc.capabilities.slice(0, 5) : [],
          i + 1,
        ]
      );
    }

    // 6. SOLUTIONS CATALOG (CMS_SCHEMA.SOLUTIONS)
    console.log('📦 6/9 Migrating Solutions Catalog...');
    const solList = SOLUTIONS_PAGE_DATA.directory?.categories || [];
    for (let i = 0; i < solList.length; i++) {
      const sol = solList[i];
      await client.query(
        `INSERT INTO cms_schema.solutions
           (name, slug, eyebrow, tagline, description, features, use_cases, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7::jsonb, $8, TRUE)
         ON CONFLICT (slug) DO UPDATE
            SET name = EXCLUDED.name,
                eyebrow = EXCLUDED.eyebrow,
                tagline = EXCLUDED.tagline,
                description = EXCLUDED.description,
                features = EXCLUDED.features,
                use_cases = EXCLUDED.use_cases,
                sort_order = EXCLUDED.sort_order,
                is_active = TRUE,
                updated_at = NOW()`,
        [
          sol.title,
          sol.slug,
          sol.subtitle || 'Operational Solution',
          sol.subtitle || '',
          sol.description,
          JSON.stringify(sol.useCases || []),
          JSON.stringify(sol.useCases || []),
          i + 1,
        ]
      );
    }

    // 7. FAQS (CMS_SCHEMA.FAQS)
    console.log('📦 7/9 Migrating FAQs Collection...');
    await client.query(`DELETE FROM cms_schema.faqs`);
    let faqSort = 1;
    for (const q of FAQ_PAGE_DATA.questions) {
      await client.query(
        `INSERT INTO cms_schema.faqs (category, question, answer, sort_order, is_featured, is_published)
         VALUES ($1, $2, $3, $4, $5, TRUE)`,
        [q.categoryLabel || q.category || 'General', q.question, q.answer, faqSort++, faqSort <= 6]
      );
    }

    // 8. DELIVERY PROCESS & ENGAGEMENT MODELS
    console.log('📦 8/9 Migrating Process Stages & Engagement Models...');
    await client.query(`DELETE FROM cms_schema.delivery_process`);
    for (let i = 0; i < PROCESS_DATA.stages.length; i++) {
      const stg = PROCESS_DATA.stages[i];
      await client.query(
        `INSERT INTO cms_schema.delivery_process
           (step_number, title, slug, description, deliverables, client_involvement, tools_methods, badge, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7::jsonb, $8, $9, TRUE)`,
        [
          i + 1,
          stg.title,
          stg.id,
          stg.summary,
          JSON.stringify(stg.deliverables || []),
          stg.clientInvolvement || null,
          JSON.stringify(stg.toolsMethods || []),
          stg.durationBadge || `Phase 0${i + 1}`,
          i + 1,
        ]
      );
    }

    await client.query(`DELETE FROM cms_schema.engagement_models`);
    for (let i = 0; i < ENGAGEMENT_MODELS_DATA.models.length; i++) {
      const mdl = ENGAGEMENT_MODELS_DATA.models[i];
      await client.query(
        `INSERT INTO cms_schema.engagement_models
           (name, slug, tagline, description, suitable_for, key_features, client_responsibilities, our_responsibilities, badge, sort_order, is_active)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10, TRUE)`,
        [
          mdl.name,
          mdl.id,
          mdl.tagline,
          mdl.overview,
          JSON.stringify(mdl.bestSuitedFor || []),
          JSON.stringify(mdl.keyCharacteristics || []),
          JSON.stringify(mdl.clientResponsibilities || []),
          JSON.stringify(mdl.ourResponsibilities || []),
          mdl.badge || null,
          i + 1,
        ]
      );
    }

    // 9. SHOWCASES & BLOG ARTICLES
    console.log('📦 9/9 Migrating Portfolio Showcases & Blog Articles...');

    // Showcases
    for (let i = 0; i < SHOWCASES_DATA.projects.length; i++) {
      const p = SHOWCASES_DATA.projects[i];
      await client.query(
        `INSERT INTO portfolio_schema.projects
           (title, slug, client_name, summary, challenge, solution, result, cover_image_url, tech_stack, tags, is_featured, is_published, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, $12)
         ON CONFLICT (slug) DO UPDATE
            SET title = EXCLUDED.title,
                client_name = EXCLUDED.client_name,
                summary = EXCLUDED.summary,
                challenge = EXCLUDED.challenge,
                solution = EXCLUDED.solution,
                result = EXCLUDED.result,
                cover_image_url = EXCLUDED.cover_image_url,
                tech_stack = EXCLUDED.tech_stack,
                tags = EXCLUDED.tags,
                is_featured = EXCLUDED.is_featured,
                is_published = TRUE,
                deleted_at = NULL,
                display_order = EXCLUDED.display_order,
                updated_at = NOW()`,
        [
          p.title,
          p.slug,
          p.client || 'Enterprise Client',
          p.summary,
          p.challenge || p.summary,
          p.solution || p.summary,
          p.results ? p.results.map(r => `${r.metric}: ${r.label}`).join('; ') : 'Production deployment achieved on time.',
          p.imageUrl || null,
          p.techStack || [],
          p.servicesProvided || [],
          p.featured || false,
          i + 1,
        ]
      );
    }

    // Blog Articles
    for (let i = 0; i < BLOG_ARTICLES.length; i++) {
      const a = BLOG_ARTICLES[i];

      // Ensure blog category exists
      let categoryId = null;
      if (a.category) {
        const catSlug = a.category.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const catRes = await client.query(
          `INSERT INTO blog_schema.categories (name, slug, description)
           VALUES ($1, $2, $3)
           ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
           RETURNING id`,
          [a.category, catSlug, `${a.category} engineering insights`]
        );
        categoryId = catRes.rows[0].id;
      }

      const readMin = parseInt(a.readingTime) || 6;
      const status = a.status === 'published' ? 'published' : 'draft';

      await client.query(
        `INSERT INTO blog_schema.posts
           (title, slug, excerpt, content, cover_image_url, read_time_min, category_id, status, is_featured, published_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::post_status, $9, $10, $11::jsonb)
         ON CONFLICT (slug) DO UPDATE
            SET title = EXCLUDED.title,
                excerpt = EXCLUDED.excerpt,
                content = EXCLUDED.content,
                cover_image_url = EXCLUDED.cover_image_url,
                read_time_min = EXCLUDED.read_time_min,
                category_id = EXCLUDED.category_id,
                status = EXCLUDED.status,
                is_featured = EXCLUDED.is_featured,
                published_at = EXCLUDED.published_at,
                metadata = EXCLUDED.metadata,
                deleted_at = NULL,
                updated_at = NOW()`,
        [
          a.title,
          a.slug,
          a.excerpt,
          a.intro + '\n\n' + (a.sections ? a.sections.map(s => `## ${s.heading}\n${s.body ? s.body.join('\n\n') : ''}`).join('\n\n') : '') + '\n\n' + (a.conclusion || ''),
          a.coverImage || null,
          readMin,
          categoryId,
          status,
          a.featured || false,
          a.publishedAt ? new Date(a.publishedAt) : new Date(),
          JSON.stringify({
            author: a.author,
            tags: a.tags,
            sections: a.sections,
            conclusion: a.conclusion,
            intro: a.intro,
          }),
        ]
      );
    }

    await client.query('COMMIT');
    console.log('✅ Content migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Content migration error:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

seedContent().catch(err => {
  console.error(err);
  process.exit(1);
});
