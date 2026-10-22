// src/scripts/seed-dashboard-data.js
// Dedicated idempotent seed script for Dashboard, Analytics, CRM & Clients dummy data
require('dotenv').config();
require('dotenv').config({ path: '.env.local', override: true });

const bcrypt = require('bcryptjs');
const { pool } = require('../config/database');

const DEMO_TAG = 'crm_clients_demo_v1';

async function seedData() {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Seeding demo data is strictly disabled in production!');
    process.exit(1);
  }

  console.log('======================================================');
  console.log(' SEEDING REALISTIC CRM, CLIENTS & DASHBOARD DATA');
  console.log('======================================================');

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // ── 0. Verify Migration Prerequisites ──────────────────────────
    const tableCheck = await client.query(
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = 'client_schema' AND table_name = 'client_contacts'`
    );
    if (!tableCheck.rows.length) {
      throw new Error('Required CRM/Clients migrations have not been applied! Please run npm run db:migrate first.');
    }

    // Admin / Staff user for assignments
    const adminUserRes = await client.query(`SELECT id FROM auth_schema.users WHERE role IN ('admin', 'super_admin') LIMIT 1`);
    const adminUserId = adminUserRes.rows[0]?.id || null;

    // ── 1. Ticket Categories ───────────────────────────────────────
    console.log('1. Seeding Ticket Categories...');
    const categories = [
      { id: 'a1000000-0000-0000-0000-000000000001', name: 'Technical Support', slug: 'technical', icon: 'Cpu', color: '#3b82f6', sort_order: 1 },
      { id: 'a1000000-0000-0000-0000-000000000002', name: 'Billing & Invoices', slug: 'billing', icon: 'DollarSign', color: '#22c55e', sort_order: 2 },
      { id: 'a1000000-0000-0000-0000-000000000003', name: 'Feature Requests', slug: 'features', icon: 'Sparkles', color: '#8b5cf6', sort_order: 3 },
      { id: 'a1000000-0000-0000-0000-000000000004', name: 'Account & Security', slug: 'account', icon: 'Shield', color: '#f59e0b', sort_order: 4 },
    ];

    for (const cat of categories) {
      await client.query(
        `INSERT INTO support_schema.ticket_categories (id, name, slug, icon, color, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, slug=EXCLUDED.slug`,
        [cat.id, cat.name, cat.slug, cat.icon, cat.color, cat.sort_order]
      );
    }

    // ── 2. Users & Client Accounts ─────────────────────────────────
    console.log('2. Seeding Users and Clients...');
    const passwordHash = await bcrypt.hash('Client123!', 10);
    const clientRoleIdRes = await client.query(`SELECT id FROM auth_schema.roles WHERE slug = 'client'`);
    const clientRoleId = clientRoleIdRes.rows[0]?.id;

    const demoUsers = [
      {
        id: 'cb974b6f-0e8f-464f-8533-351c3099a94f', // Primary existing test client
        email: 'client@company.com',
        first_name: 'Alex',
        last_name: 'Client',
        display_name: 'Alex Client',
        company_name: 'Acme Corporation',
        billing_email: 'billing@acmecorp.com',
        phone: '+1-555-0199',
        website: 'https://acmecorp.example.com',
        type: 'company',
        industry: 'technology',
        company_size: '50-200',
        country: 'United States',
        city: 'New York',
        status: 'active',
        health_score: 95,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000001',
        email: 'jordan@techflow.io',
        first_name: 'Jordan',
        last_name: 'Miles',
        display_name: 'Jordan Miles',
        company_name: 'TechFlow Solutions',
        billing_email: 'finance@techflow.io',
        phone: '+1-555-0211',
        website: 'https://techflow.io',
        type: 'company',
        industry: 'technology',
        company_size: '20-50',
        country: 'United States',
        city: 'San Francisco',
        status: 'active',
        health_score: 91,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000002',
        email: 'elena@lumina.design',
        first_name: 'Elena',
        last_name: 'Rostova',
        display_name: 'Elena Rostova',
        company_name: 'Lumina Creative Studio',
        billing_email: 'accounts@lumina.design',
        phone: '+1-555-0344',
        website: 'https://lumina.design',
        type: 'company',
        industry: 'retail',
        company_size: '10-20',
        country: 'United Kingdom',
        city: 'London',
        status: 'active',
        health_score: 88,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000003',
        email: 'marcus@apexcloud.net',
        first_name: 'Marcus',
        last_name: 'Vance',
        display_name: 'Marcus Vance',
        company_name: 'Apex Cloud Networks',
        billing_email: 'billing@apexcloud.net',
        phone: '+1-555-0488',
        website: 'https://apexcloud.net',
        type: 'company',
        industry: 'technology',
        company_size: '200-500',
        country: 'United States',
        city: 'Austin',
        status: 'active',
        health_score: 93,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000004',
        email: 'carter@horizoncap.com',
        first_name: 'Victoria',
        last_name: 'Carter',
        display_name: 'Victoria Carter',
        company_name: 'Horizon Capital Partners',
        billing_email: 'invoices@horizoncap.com',
        phone: '+1-555-0512',
        website: 'https://horizoncap.com',
        type: 'company',
        industry: 'finance',
        company_size: '50-200',
        country: 'United States',
        city: 'Boston',
        status: 'active',
        health_score: 96,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000005',
        email: 'contact@biohealthlabs.org',
        first_name: 'David',
        last_name: 'Chen',
        display_name: 'David Chen',
        company_name: 'BioHealth Research Labs',
        billing_email: 'finance@biohealthlabs.org',
        phone: '+1-555-0633',
        website: 'https://biohealthlabs.org',
        type: 'company',
        industry: 'healthcare',
        company_size: '100-250',
        country: 'United States',
        city: 'Cambridge',
        status: 'active',
        health_score: 87,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000006',
        email: 'ops@globallogistics.com',
        first_name: 'Raymond',
        last_name: 'Holt',
        display_name: 'Raymond Holt',
        company_name: 'Global Logistics Corp',
        billing_email: 'accounts@globallogistics.com',
        phone: '+1-555-0744',
        website: 'https://globallogistics.example.com',
        type: 'company',
        industry: 'manufacturing',
        company_size: '500-1000',
        country: 'United States',
        city: 'Chicago',
        status: 'active',
        health_score: 84,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000007',
        email: 'dean@eduverse.ac',
        first_name: 'Claire',
        last_name: 'Underwood',
        display_name: 'Claire Underwood',
        company_name: 'EduVerse Digital Academy',
        billing_email: 'billing@eduverse.ac',
        phone: '+1-555-0822',
        website: 'https://eduverse.ac',
        type: 'company',
        industry: 'education',
        company_size: '20-50',
        country: 'Canada',
        city: 'Toronto',
        status: 'active',
        health_score: 90,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000008',
        email: 'sophia@drsmartinez.com',
        first_name: 'Sophia',
        last_name: 'Martinez',
        display_name: 'Dr. Sophia Martinez',
        company_name: 'Dr. Sophia Martinez MD',
        billing_email: 'sophia@drsmartinez.com',
        phone: '+1-555-0955',
        website: 'https://drsmartinez.com',
        type: 'individual',
        industry: 'healthcare',
        company_size: '1-10',
        country: 'United States',
        city: 'Miami',
        status: 'active',
        health_score: 94,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000009',
        email: 'ethan@wrightconsult.io',
        first_name: 'Ethan',
        last_name: 'Wright',
        display_name: 'Ethan Wright',
        company_name: 'Ethan Wright Advisory',
        billing_email: 'ethan@wrightconsult.io',
        phone: '+1-555-1033',
        website: 'https://wrightconsult.io',
        type: 'individual',
        industry: 'finance',
        company_size: '1-10',
        country: 'United States',
        city: 'Denver',
        status: 'active',
        health_score: 92,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000010',
        email: 'sarah@jenkinslegal.com',
        first_name: 'Sarah',
        last_name: 'Jenkins',
        display_name: 'Sarah Jenkins',
        company_name: 'Sarah Jenkins Legal Services',
        billing_email: 'sarah@jenkinslegal.com',
        phone: '+1-555-1177',
        website: 'https://jenkinslegal.com',
        type: 'individual',
        industry: 'other',
        company_size: '1-10',
        country: 'United States',
        city: 'Atlanta',
        status: 'active',
        health_score: 89,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000011',
        email: 'procurement@metrotransit.gov',
        first_name: 'Harold',
        last_name: 'Finch',
        display_name: 'Harold Finch',
        company_name: 'Metropolitan Transit Authority',
        billing_email: 'finance@metrotransit.gov',
        phone: '+1-555-1299',
        website: 'https://metrotransit.gov',
        type: 'government',
        industry: 'other',
        company_size: '1000+',
        country: 'United States',
        city: 'Washington',
        status: 'active',
        health_score: 98,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000012',
        email: 'info@greenearth.ngo',
        first_name: 'Amara',
        last_name: 'Okafor',
        display_name: 'Amara Okafor',
        company_name: 'Green Earth Conservation Foundation',
        billing_email: 'grants@greenearth.ngo',
        phone: '+1-555-1355',
        website: 'https://greenearth.ngo',
        type: 'non_profit',
        industry: 'other',
        company_size: '20-50',
        country: 'United States',
        city: 'Portland',
        status: 'active',
        health_score: 93,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000013',
        email: 'contact@vantagemedia.com',
        first_name: 'Bradley',
        last_name: 'Cooper',
        display_name: 'Bradley Cooper',
        company_name: 'Vantage Media Group',
        billing_email: 'invoicing@vantagemedia.com',
        phone: '+1-555-1466',
        website: 'https://vantagemedia.example.com',
        type: 'company',
        industry: 'retail',
        company_size: '50-100',
        country: 'United States',
        city: 'Los Angeles',
        status: 'inactive',
        health_score: 65,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000014',
        email: 'ceo@stellarrobotics.tech',
        first_name: 'Nikola',
        last_name: 'Vesely',
        display_name: 'Nikola Vesely',
        company_name: 'Stellar Robotics',
        billing_email: 'accounting@stellarrobotics.tech',
        phone: '+1-555-1588',
        website: 'https://stellarrobotics.tech',
        type: 'company',
        industry: 'manufacturing',
        company_size: '20-50',
        country: 'United States',
        city: 'Pittsburgh',
        status: 'churned',
        health_score: 40,
        currency: 'USD',
      },
      {
        id: 'c2000000-0000-0000-0000-000000000015',
        email: 'team@codecraftstudios.com',
        first_name: 'Liam',
        last_name: 'Gallagher',
        display_name: 'Liam Gallagher',
        company_name: 'CodeCraft Software Studios',
        billing_email: 'payables@codecraftstudios.com',
        phone: '+1-555-1699',
        website: 'https://codecraftstudios.com',
        type: 'company',
        industry: 'technology',
        company_size: '10-20',
        country: 'United States',
        city: 'Seattle',
        status: 'active',
        health_score: 91,
        currency: 'USD',
      },
    ];

    const clientIds = [];

    for (const u of demoUsers) {
      // Upsert User
      await client.query(
        `INSERT INTO auth_schema.users (id, email, password_hash, first_name, last_name, role, is_active, is_verified)
         VALUES ($1, $2, $3, $4, $5, 'client', TRUE, TRUE)
         ON CONFLICT (id) DO UPDATE SET
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           is_active = TRUE`,
        [u.id, u.email, passwordHash, u.first_name, u.last_name]
      );

      // Ensure user_roles has client role
      if (clientRoleId) {
        await client.query(
          `INSERT INTO auth_schema.user_roles (user_id, role_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [u.id, clientRoleId]
        );
      }

      // Upsert Client company in client_schema.clients
      const clientRecordId = 'b' + u.id.substring(1);
      clientIds.push(clientRecordId);

      const isActive = u.status === 'active';
      const churnedAt = u.status === 'churned' ? new Date(Date.now() - 30 * 24 * 3600 * 1000) : null;

      await client.query(
        `INSERT INTO client_schema.clients
           (id, user_id, company_name, name, billing_email, email, phone, website,
            type, industry, company_size, country, city, status, is_active, churned_at,
            currency, health_score, account_manager, metadata)
         VALUES ($1, $2, $3, $3, $4, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb)
         ON CONFLICT (id) DO UPDATE SET
           company_name = EXCLUDED.company_name,
           name = EXCLUDED.name,
           billing_email = EXCLUDED.billing_email,
           email = EXCLUDED.email,
           phone = EXCLUDED.phone,
           website = EXCLUDED.website,
           type = EXCLUDED.type,
           industry = EXCLUDED.industry,
           company_size = EXCLUDED.company_size,
           country = EXCLUDED.country,
           city = EXCLUDED.city,
           status = EXCLUDED.status,
           is_active = EXCLUDED.is_active,
           churned_at = EXCLUDED.churned_at,
           health_score = EXCLUDED.health_score,
           account_manager = EXCLUDED.account_manager,
           metadata = EXCLUDED.metadata`,
        [
          clientRecordId,
          u.id,
          u.company_name,
          u.billing_email,
          u.phone,
          u.website,
          u.type,
          u.industry,
          u.company_size,
          u.country,
          u.city,
          u.status,
          isActive,
          churnedAt,
          u.currency,
          u.health_score,
          adminUserId,
          JSON.stringify({ is_demo: true, seed_tag: DEMO_TAG }),
        ]
      );

      // Primary contact
      await client.query(
        `INSERT INTO client_schema.client_contacts
           (client_id, first_name, last_name, email, phone, designation, is_primary)
         VALUES ($1, $2, $3, $4, $5, 'Primary Contact', TRUE)
         ON CONFLICT DO NOTHING`,
        [clientRecordId, u.first_name, u.last_name, u.billing_email, u.phone]
      );

      // Initial account note
      await client.query(
        `INSERT INTO client_schema.client_notes
           (client_id, author_id, content, is_pinned)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT DO NOTHING`,
        [
          clientRecordId,
          adminUserId,
          `Account established for ${u.company_name}. Service contract active in ${u.country} region.`,
        ]
      );
    }

    // ── 3. Projects ────────────────────────────────────────────────
    console.log('3. Seeding Client Projects...');
    const projectTemplates = [
      { name: 'Enterprise Cloud Portal Migration', code: 'PRJ-CLOUD', status: 'development', priority: 'high', progress: 65, health: 'on_track', budget: 45000, spent: 28000, daysAgo: 60, daysDuration: 90, clientIdx: 0 },
      { name: 'Global E-Commerce Replatforming', code: 'PRJ-ECOM', status: 'testing', priority: 'critical', progress: 85, health: 'on_track', budget: 75000, spent: 62000, daysAgo: 75, daysDuration: 90, clientIdx: 0 },
      { name: 'NextGen Mobile Banking App', code: 'PRJ-MOBILE', status: 'planning', priority: 'medium', progress: 20, health: 'at_risk', budget: 60000, spent: 12000, daysAgo: 20, daysDuration: 90, clientIdx: 0 },
      { name: 'AI Support Assistant Integration', code: 'PRJ-AIASSIST', status: 'delivered', priority: 'medium', progress: 100, health: 'on_track', budget: 35000, spent: 34000, daysAgo: 85, daysDuration: 75, clientIdx: 0 },
      { name: 'Brand Identity & Design System', code: 'PRJ-BRAND', status: 'design', priority: 'high', progress: 45, health: 'on_track', budget: 25000, spent: 11000, daysAgo: 30, daysDuration: 60, clientIdx: 1 },
      { name: 'SaaS Billing Microservices Engine', code: 'PRJ-SAAS', status: 'development', priority: 'critical', progress: 50, health: 'on_track', budget: 40000, spent: 20000, daysAgo: 40, daysDuration: 85, clientIdx: 1 },
      { name: 'DevOps CI/CD Automation Pipeline', code: 'PRJ-DEVOPS', status: 'delivered', priority: 'low', progress: 100, health: 'on_track', budget: 30000, spent: 29000, daysAgo: 80, daysDuration: 60, clientIdx: 1 },
      { name: 'Healthcare Telemedicine Web Portal', code: 'PRJ-HEALTH', status: 'development', priority: 'high', progress: 70, health: 'on_track', budget: 90000, spent: 58000, daysAgo: 50, daysDuration: 90, clientIdx: 2 },
      { name: 'Customer Loyalty & Rewards Engine', code: 'PRJ-LOYAL', status: 'review', priority: 'medium', progress: 90, health: 'on_track', budget: 38000, spent: 34000, daysAgo: 65, daysDuration: 75, clientIdx: 2 },
      { name: 'Corporate Intranet & Knowledge Base', code: 'PRJ-INTRANET', status: 'discovery', priority: 'low', progress: 10, health: 'on_track', budget: 22000, spent: 2000, daysAgo: 10, daysDuration: 70, clientIdx: 2 },
      { name: 'High-Performance Data Analytics API', code: 'PRJ-ANALYTICS', status: 'development', priority: 'high', progress: 55, health: 'on_track', budget: 65000, spent: 36000, daysAgo: 45, daysDuration: 90, clientIdx: 3 },
      { name: 'Infrastructure Multi-Region Failover', code: 'PRJ-INFRA', status: 'on_hold', priority: 'critical', progress: 30, health: 'at_risk', budget: 48000, spent: 15000, daysAgo: 55, daysDuration: 90, clientIdx: 3 },
      { name: 'Portfolio Risk Analytics Dashboard', code: 'PRJ-RISK', status: 'development', priority: 'high', progress: 60, health: 'on_track', budget: 55000, spent: 31000, daysAgo: 40, daysDuration: 80, clientIdx: 4 },
      { name: 'Genomics Sequencing Data Pipeline', code: 'PRJ-GENOMICS', status: 'development', priority: 'high', progress: 75, health: 'on_track', budget: 85000, spent: 58000, daysAgo: 50, daysDuration: 90, clientIdx: 5 },
      { name: 'Real-Time Fleet Telematics Tracker', code: 'PRJ-FLEET', status: 'testing', priority: 'medium', progress: 80, health: 'on_track', budget: 62000, spent: 48000, daysAgo: 60, daysDuration: 90, clientIdx: 6 },
    ];

    const projectIds = [];

    for (let i = 0; i < projectTemplates.length; i++) {
      const pt = projectTemplates[i];
      const projId = `d1000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
      projectIds.push(projId);

      const startDate = new Date(Date.now() - pt.daysAgo * 24 * 60 * 60 * 1000);
      const endDate = new Date(startDate.getTime() + pt.daysDuration * 24 * 60 * 60 * 1000);
      const clientId = clientIds[pt.clientIdx];

      await client.query(
        `INSERT INTO client_schema.client_projects
           (id, client_id, title, code, description, status, priority, progress_percent, health, budget, spent, currency, start_date, end_date, project_manager, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6::project_status, $7, $8, $9, $10, $11, 'USD', $12::date, $13::date, $14, $15::jsonb, $16::timestamptz, NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           code = EXCLUDED.code,
           status = EXCLUDED.status,
           progress_percent = EXCLUDED.progress_percent,
           health = EXCLUDED.health,
           budget = EXCLUDED.budget,
           spent = EXCLUDED.spent,
           metadata = EXCLUDED.metadata`,
        [
          projId,
          clientId,
          pt.name,
          pt.code,
          `Strategic enterprise deliverable for ${pt.name}`,
          pt.status,
          pt.priority,
          pt.progress,
          pt.health,
          pt.budget,
          pt.spent,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          adminUserId,
          JSON.stringify({ is_demo: true, seed_tag: DEMO_TAG }),
          startDate,
        ]
      );

      // Seed project member
      if (adminUserId) {
        await client.query(
          `INSERT INTO client_schema.project_members (project_id, user_id, role, added_by)
           VALUES ($1, $2, 'manager', $2)
           ON CONFLICT (project_id, user_id) DO NOTHING`,
          [projId, adminUserId]
        );
      }
    }

    // ── 4. Project Tasks (65+ Enterprise Tasks) ───────────────────────
    console.log('4. Seeding Tasks...');
    const taskTemplates = [
      // Proj 0: Cloud Portal Migration
      { title: 'Define Architecture Blueprint & Sizing', status: 'done', priority: 'high', projIdx: 0, estH: 16, logH: 16, dueOffset: -40 },
      { title: 'Provision AWS Multi-AZ Cluster & VPC Peering', status: 'in_progress', priority: 'critical', projIdx: 0, estH: 24, logH: 14, dueOffset: 5 },
      { title: 'Implement OAuth2 / OIDC Single Sign-On Flow', status: 'in_progress', priority: 'high', projIdx: 0, estH: 20, logH: 10, dueOffset: 8 },
      { title: 'Execute End-to-End Latency & Load Testing', status: 'todo', priority: 'medium', projIdx: 0, estH: 16, logH: 0, dueOffset: 20 },
      { title: 'Configure Disaster Recovery Automated Snapshots', status: 'todo', priority: 'low', projIdx: 0, estH: 8, logH: 0, dueOffset: 25 },

      // Proj 1: E-Commerce Replatforming
      { title: 'Stripe Payment Gateway Integration & Webhooks', status: 'done', priority: 'critical', projIdx: 1, estH: 32, logH: 30, dueOffset: -30 },
      { title: 'Checkout Funnel Performance & SSR Optimization', status: 'in_progress', priority: 'high', projIdx: 1, estH: 24, logH: 18, dueOffset: 3 },
      { title: 'Product Catalog Real-Time Search with Elasticsearch', status: 'in_review', priority: 'high', projIdx: 1, estH: 20, logH: 19, dueOffset: 1 },
      { title: 'Cart Abandonment Automated Email Triggers', status: 'done', priority: 'medium', projIdx: 1, estH: 12, logH: 12, dueOffset: -10 },
      { title: 'Tax & Currency Calculation Compliance Audit', status: 'todo', priority: 'medium', projIdx: 1, estH: 16, logH: 0, dueOffset: 14 },

      // Proj 2: Mobile Banking App
      { title: 'Biometric FaceID / Fingerprint Authentication', status: 'in_progress', priority: 'critical', projIdx: 2, estH: 28, logH: 12, dueOffset: -2 }, // Overdue
      { title: 'Account Statement PDF Generation Microservice', status: 'todo', priority: 'high', projIdx: 2, estH: 16, logH: 0, dueOffset: 12 },
      { title: 'P2P Instant Wire Transfer Protocol', status: 'blocked', priority: 'critical', projIdx: 2, estH: 30, logH: 4, dueOffset: 6 },
      { title: 'Push Notification Token Registry Service', status: 'done', priority: 'medium', projIdx: 2, estH: 10, logH: 10, dueOffset: -15 },

      // Proj 3: AI Support Assistant
      { title: 'Train Domain-Specific RAG Knowledge Retrieval', status: 'done', priority: 'high', projIdx: 3, estH: 40, logH: 38, dueOffset: -60 },
      { title: 'Zendesk & Intercom Live Chat Connectors', status: 'done', priority: 'medium', projIdx: 3, estH: 24, logH: 22, dueOffset: -45 },
      { title: 'Hallucination Guardrails & Token Rate Limiting', status: 'done', priority: 'critical', projIdx: 3, estH: 20, logH: 20, dueOffset: -30 },
      { title: 'Customer Feedback Sentiment Scoring Model', status: 'done', priority: 'medium', projIdx: 3, estH: 16, logH: 15, dueOffset: -20 },

      // Proj 4: Brand Identity & Design System
      { title: 'Figma Token Kit & Accessible Color Palettes', status: 'done', priority: 'high', projIdx: 4, estH: 20, logH: 20, dueOffset: -20 },
      { title: 'Tailwind CSS Custom Design Token Sync Script', status: 'in_progress', priority: 'medium', projIdx: 4, estH: 16, logH: 8, dueOffset: 4 },
      { title: 'Interactive Storybook Component Showcase', status: 'in_review', priority: 'medium', projIdx: 4, estH: 18, logH: 16, dueOffset: 2 },
      { title: 'Marketing Collateral Vector Asset Library', status: 'todo', priority: 'low', projIdx: 4, estH: 12, logH: 0, dueOffset: 15 },

      // Proj 5: SaaS Billing Microservices Engine
      { title: 'Usage-Based Metering Event Ingestion Pipeline', status: 'done', priority: 'critical', projIdx: 5, estH: 32, logH: 30, dueOffset: -25 },
      { title: 'Subscription Proration & Upgrade Calculator', status: 'in_progress', priority: 'high', projIdx: 5, estH: 24, logH: 14, dueOffset: 0 }, // Due today
      { title: 'Automated Dunning & Retry Schedule Worker', status: 'in_progress', priority: 'high', projIdx: 5, estH: 18, logH: 6, dueOffset: 7 },
      { title: 'Multi-Tenant Invoice PDF Template Engine', status: 'todo', priority: 'medium', projIdx: 5, estH: 16, logH: 0, dueOffset: 18 },

      // Proj 6: DevOps CI/CD Pipeline
      { title: 'Containerize Microservices with Alpine Docker', status: 'done', priority: 'high', projIdx: 6, estH: 16, logH: 16, dueOffset: -65 },
      { title: 'Configure GitHub Actions Matrix Test Matrix', status: 'done', priority: 'medium', projIdx: 6, estH: 20, logH: 18, dueOffset: -50 },
      { title: 'Helm Charts for Kubernetes Cluster Deployment', status: 'done', priority: 'high', projIdx: 6, estH: 24, logH: 24, dueOffset: -40 },
      { title: 'Prometheus & Grafana Centralized Metrics', status: 'done', priority: 'medium', projIdx: 6, estH: 18, logH: 18, dueOffset: -30 },

      // Proj 7: Healthcare Telemedicine Web Portal
      { title: 'HIPAA Compliant Video Streaming WebRTC Server', status: 'in_progress', priority: 'critical', projIdx: 7, estH: 40, logH: 28, dueOffset: 6 },
      { title: 'Electronic Health Record (EHR) Integration API', status: 'in_progress', priority: 'high', projIdx: 7, estH: 36, logH: 20, dueOffset: 10 },
      { title: 'Patient Appointment Scheduling Calendar UI', status: 'done', priority: 'medium', projIdx: 7, estH: 24, logH: 22, dueOffset: -12 },
      { title: 'E-Prescription Digital Signature Module', status: 'todo', priority: 'high', projIdx: 7, estH: 20, logH: 0, dueOffset: 22 },

      // Proj 8: Customer Loyalty & Rewards Engine
      { title: 'Tiered Reward Points Calculation Logic', status: 'done', priority: 'high', projIdx: 8, estH: 20, logH: 20, dueOffset: -35 },
      { title: 'Merchant QR Code Redemption Scanner App', status: 'done', priority: 'high', projIdx: 8, estH: 28, logH: 26, dueOffset: -20 },
      { title: 'Fraud Detection Velocity Rules on Redemptions', status: 'in_review', priority: 'critical', projIdx: 8, estH: 22, logH: 20, dueOffset: 2 },
      { title: 'Partner Merchant Settlement Export Job', status: 'done', priority: 'medium', projIdx: 8, estH: 14, logH: 14, dueOffset: -5 },

      // Proj 9: Corporate Intranet
      { title: 'Organizational Employee Directory with Org Chart', status: 'in_progress', priority: 'medium', projIdx: 9, estH: 18, logH: 6, dueOffset: 14 },
      { title: 'Internal Wiki Markdown Editor with Versioning', status: 'todo', priority: 'medium', projIdx: 9, estH: 24, logH: 0, dueOffset: 28 },
      { title: 'Enterprise SSO Active Directory Sync', status: 'todo', priority: 'high', projIdx: 9, estH: 20, logH: 0, dueOffset: 35 },

      // Proj 10: High-Performance Data Analytics API
      { title: 'ClickHouse Columnar Storage Schema Modeling', status: 'done', priority: 'high', projIdx: 10, estH: 28, logH: 26, dueOffset: -25 },
      { title: 'Aggregated Real-Time Streaming Ingestion via Kafka', status: 'in_progress', priority: 'critical', projIdx: 10, estH: 36, logH: 22, dueOffset: 7 },
      { title: 'Dynamic Pivot & Filter Query Builder Engine', status: 'in_progress', priority: 'high', projIdx: 10, estH: 24, logH: 12, dueOffset: 14 },
      { title: 'Rate Limiter & API Key Quota Management', status: 'done', priority: 'medium', projIdx: 10, estH: 16, logH: 15, dueOffset: -10 },

      // Proj 11: Multi-Region Failover
      { title: 'Cross-Region PostgreSQL Read Replica Setup', status: 'in_progress', priority: 'critical', projIdx: 11, estH: 28, logH: 14, dueOffset: -5 }, // Overdue
      { title: 'Route53 Health Check DNS Failover Policies', status: 'done', priority: 'high', projIdx: 11, estH: 18, logH: 18, dueOffset: -20 },
      { title: 'Simulated Data Center Blackout Drills', status: 'blocked', priority: 'critical', projIdx: 11, estH: 20, logH: 4, dueOffset: 8 },

      // Proj 12: Portfolio Risk Analytics
      { title: 'Monte Carlo Portfolio Value-at-Risk Simulator', status: 'done', priority: 'high', projIdx: 12, estH: 32, logH: 30, dueOffset: -18 },
      { title: 'Interactive Financial Chart Component with Candlesticks', status: 'in_progress', priority: 'medium', projIdx: 12, estH: 20, logH: 12, dueOffset: 6 },
      { title: 'Automated Regulatory SEC Form 13F Exporter', status: 'in_progress', priority: 'high', projIdx: 12, estH: 22, logH: 8, dueOffset: 12 },

      // Proj 13: Genomics Sequencing Data Pipeline
      { title: 'FASTQ Binary Alignment Parser (BAM) Pipeline', status: 'done', priority: 'critical', projIdx: 13, estH: 40, logH: 40, dueOffset: -30 },
      { title: 'Variant Call Format (VCF) Annotation Engine', status: 'in_progress', priority: 'high', projIdx: 13, estH: 34, logH: 24, dueOffset: 5 },
      { title: 'Distributed S3 Multipart Genomic File Uploader', status: 'done', priority: 'medium', projIdx: 13, estH: 18, logH: 18, dueOffset: -10 },

      // Proj 14: Fleet Telematics Tracker
      { title: 'OBD-II CAN-Bus Telemetry Stream Ingestion', status: 'done', priority: 'high', projIdx: 14, estH: 30, logH: 30, dueOffset: -35 },
      { title: 'Geofencing Alert Engine with Turf.js Calculations', status: 'done', priority: 'high', projIdx: 14, estH: 24, logH: 22, dueOffset: -15 },
      { title: 'Driver Behavior & Harsh Braking Scoring Model', status: 'in_review', priority: 'medium', projIdx: 14, estH: 20, logH: 18, dueOffset: 1 },
      { title: 'Fuel Consumption Anomaly Detection Alert System', status: 'in_progress', priority: 'medium', projIdx: 14, estH: 18, logH: 8, dueOffset: 9 },
    ];

    const taskIds = [];

    for (let i = 0; i < taskTemplates.length; i++) {
      const tt = taskTemplates[i];
      const taskId = `d2000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
      taskIds.push(taskId);

      const projId = projectIds[tt.projIdx];
      const projCode = projectTemplates[tt.projIdx].code;
      const taskNum = `${projCode}-${String((i % 10) + 1).padStart(2, '0')}`;

      const dueDate = new Date(Date.now() + tt.dueOffset * 24 * 60 * 60 * 1000);
      const isDone = tt.status === 'done';
      const completedAt = isDone ? new Date(Date.now() - Math.abs(tt.dueOffset) * 24 * 60 * 60 * 1000) : null;
      const createdAt = new Date(Date.now() - (Math.abs(tt.dueOffset) + 15) * 24 * 60 * 60 * 1000);

      await client.query(
        `INSERT INTO client_schema.tasks
           (id, project_id, task_number, title, description, status, priority,
            estimated_h, logged_h, assigned_to, reporter_id, due_date, completed_at, tags, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10, $11::date, $12::timestamptz, ARRAY['demo'], $13::timestamptz, NOW())
         ON CONFLICT (id) DO UPDATE SET
           title = EXCLUDED.title,
           task_number = EXCLUDED.task_number,
           status = EXCLUDED.status,
           priority = EXCLUDED.priority,
           estimated_h = EXCLUDED.estimated_h,
           logged_h = EXCLUDED.logged_h,
           due_date = EXCLUDED.due_date,
           completed_at = EXCLUDED.completed_at`,
        [
          taskId,
          projId,
          taskNum,
          tt.title,
          `Detailed implementation requirements and acceptance criteria for ${tt.title}`,
          tt.status,
          tt.priority,
          tt.estH,
          tt.logH,
          adminUserId,
          dueDate.toISOString().split('T')[0],
          completedAt,
          createdAt,
        ]
      );
    }

    // Auto-update each project's progress percent based on its real tasks
    for (let p = 0; p < projectIds.length; p++) {
      const pid = projectIds[p];
      const { rows: progRows } = await client.query(
        `SELECT
           COUNT(*) AS total,
           COUNT(*) FILTER (WHERE status = 'done') AS done
         FROM client_schema.tasks
         WHERE project_id = $1 AND deleted_at IS NULL`,
        [pid]
      );
      const total = parseInt(progRows[0]?.total || 0, 10);
      const done = parseInt(progRows[0]?.done || 0, 10);
      if (total > 0) {
        const pct = Math.round((done / total) * 100);
        await client.query(`UPDATE client_schema.client_projects SET progress_percent = $1 WHERE id = $2`, [pct, pid]);
      }
    }

    // ── 4b. Time Entries (120+ entries across 60 days) ─────────────────
    console.log('4b. Seeding Time Entries & Active Timer...');
    await client.query(`DELETE FROM client_schema.time_entries WHERE metadata->>'is_demo' = 'true'`);
    let timeEntryCounter = 0;
    const descriptions = [
      'Sprint planning and architecture breakdown',
      'Refactoring core controller logic and middleware',
      'Writing automated unit and integration tests',
      'Database index tuning and query optimization',
      'Pair programming on security auth tokens',
      'Frontend UI polish, responsive styling, and accessibility audit',
      'Resolving staging bugs and regression testing',
      'API documentation and Postman collection update',
      'CI/CD deployment pipeline configuration',
      'Client demo prep and sprint retrospective',
    ];

    for (let day = 58; day >= 0; day -= 2) {
      // 3 to 5 time entries per active work day
      const entriesThisDay = (day % 3) + 2;
      for (let e = 0; e < entriesThisDay; e++) {
        timeEntryCounter++;
        const entryId = `d3000000-0000-0000-0000-${String(timeEntryCounter + 10).padStart(12, '0')}`;
        const projIdx = (day + e) % projectIds.length;
        const projId = projectIds[projIdx];
        const taskIdx = (day * 2 + e) % taskIds.length;
        const taskId = taskIds[taskIdx];

        const hoursOptions = [1.25, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0];
        const hours = hoursOptions[(day + e) % hoursOptions.length];
        const durationSec = Math.round(hours * 3600);
        const isBillable = (e % 5 !== 0); // 80% billable

        const startTime = new Date(Date.now() - day * 24 * 60 * 60 * 1000 + (9 + e * 2) * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + durationSec * 1000);
        const desc = descriptions[(day + e) % descriptions.length];

        await client.query(
          `INSERT INTO client_schema.time_entries
             (id, project_id, task_id, user_id, description, hours, duration_seconds, started_at, ended_at, is_billable, billing_rate, is_active_timer, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, FALSE, $12::jsonb)
           ON CONFLICT (id) DO UPDATE SET
             hours = EXCLUDED.hours,
             duration_seconds = EXCLUDED.duration_seconds,
             is_billable = EXCLUDED.is_billable`,
          [
            entryId,
            projId,
            taskId,
            adminUserId,
            desc,
            hours,
            durationSec,
            startTime,
            endTime,
            isBillable,
            isBillable ? 120.00 : 0.00,
            JSON.stringify({ is_demo: true, seed_tag: DEMO_TAG }),
          ]
        );
      }
    }

    // Update aggregated hours on projects
    await client.query(`
      UPDATE client_schema.client_projects p
         SET billable_hours = COALESCE(agg.billable, 0),
             non_billable_hours = COALESCE(agg.non_billable, 0)
        FROM (
          SELECT project_id,
                 SUM(hours) FILTER (WHERE is_billable) AS billable,
                 SUM(hours) FILTER (WHERE NOT is_billable) AS non_billable
            FROM client_schema.time_entries
           WHERE is_active_timer = FALSE
           GROUP BY project_id
        ) agg
       WHERE p.id = agg.project_id
    `);

    // Ensure 1 Active Timer running for adminUser in dev
    if (adminUserId) {
      const activeTimerId = 'd3000000-0000-0000-0000-000000000001';
      // First clear any stale active timer
      await client.query(`DELETE FROM client_schema.time_entries WHERE user_id = $1 AND is_active_timer = TRUE`, [adminUserId]);

      await client.query(
        `INSERT INTO client_schema.time_entries
           (id, project_id, task_id, user_id, description, hours, duration_seconds, started_at, is_billable, billing_rate, is_active_timer, metadata)
         VALUES ($1, $2, $3, $4, $5, 0, 0, NOW() - INTERVAL '38 minutes', TRUE, 120.00, TRUE, $6::jsonb)
         ON CONFLICT (id) DO UPDATE SET
           project_id = EXCLUDED.project_id,
           task_id = EXCLUDED.task_id,
           started_at = EXCLUDED.started_at,
           is_active_timer = TRUE`,
        [
          activeTimerId,
          projectIds[0],
          taskIds[1],
          adminUserId,
          'Fine-tuning AWS Multi-AZ load balancers and terraform state',
          JSON.stringify({ is_demo: true, seed_tag: DEMO_TAG }),
        ]
      );
    }

    // ── 5. Invoices & Payments ─────────────────────────────────────
    console.log('5. Seeding Invoices & Settled Payments...');
    const now = Date.now();
    const invoiceSeeds = [
      // Acme Corporation
      { num: 'INV-2026-001', clientIdx: 0, projIdx: 0, amount: 25000, paid: 25000, status: 'paid', daysAgo: 65, dueDays: 30, method: 'bank_transfer' },
      { num: 'INV-2026-002', clientIdx: 0, projIdx: 0, amount: 15000, paid: 15000, status: 'paid', daysAgo: 35, dueDays: 15, method: 'stripe' },
      { num: 'INV-2026-003', clientIdx: 0, projIdx: 1, amount: 35000, paid: 35000, status: 'paid', daysAgo: 14, dueDays: 7, method: 'bank_transfer' },
      { num: 'INV-2026-004', clientIdx: 0, projIdx: 1, amount: 20000, paid: 20000, status: 'paid', daysAgo: 3, dueDays: 14, method: 'stripe' },
      { num: 'INV-2026-005', clientIdx: 0, projIdx: 2, amount: 18000, paid: 0, status: 'sent', daysAgo: 8, dueDays: 22, method: null },
      { num: 'INV-2026-006', clientIdx: 0, projIdx: 2, amount: 12000, paid: 0, status: 'overdue', daysAgo: 45, dueDays: -15, method: null },

      // TechFlow Solutions
      { num: 'INV-2026-007', clientIdx: 1, projIdx: 4, amount: 12500, paid: 12500, status: 'paid', daysAgo: 25, dueDays: 15, method: 'bank_transfer' },
      { num: 'INV-2026-008', clientIdx: 1, projIdx: 5, amount: 20000, paid: 20000, status: 'paid', daysAgo: 10, dueDays: 20, method: 'stripe' },
      { num: 'INV-2026-009', clientIdx: 1, projIdx: 5, amount: 10000, paid: 0, status: 'sent', daysAgo: 5, dueDays: 25, method: null },

      // Lumina Creative Studio
      { num: 'INV-2026-010', clientIdx: 2, projIdx: 7, amount: 30000, paid: 30000, status: 'paid', daysAgo: 40, dueDays: 10, method: 'bank_transfer' },
      { num: 'INV-2026-011', clientIdx: 2, projIdx: 7, amount: 28000, paid: 28000, status: 'paid', daysAgo: 6, dueDays: 24, method: 'bank_transfer' },

      // Apex Cloud Networks
      { num: 'INV-2026-012', clientIdx: 3, projIdx: 10, amount: 25000, paid: 25000, status: 'paid', daysAgo: 30, dueDays: 15, method: 'stripe' },
      { num: 'INV-2026-013', clientIdx: 3, projIdx: 10, amount: 18000, paid: 18000, status: 'paid', daysAgo: 2, dueDays: 28, method: 'bank_transfer' },
      { num: 'INV-2026-014', clientIdx: 3, projIdx: 11, amount: 15000, paid: 0, status: 'sent', daysAgo: 12, dueDays: 18, method: null },
    ];

    for (let i = 0; i < invoiceSeeds.length; i++) {
      const inv = invoiceSeeds[i];
      const invId = `e1000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
      const clientId = clientIds[inv.clientIdx];
      const projId = projectIds[inv.projIdx];

      const issueDate = new Date(now - inv.daysAgo * 24 * 60 * 60 * 1000);
      const dueDate = new Date(issueDate.getTime() + inv.dueDays * 24 * 60 * 60 * 1000);
      const paidAt = inv.status === 'paid' ? new Date(issueDate.getTime() + 4 * 24 * 60 * 60 * 1000) : null;

      const invRes = await client.query(
        `INSERT INTO billing_schema.invoices
           (id, client_id, project_id, invoice_number, status, line_items, subtotal, tax_amount, total_amount, amount_paid, currency, issue_date, due_date, paid_at, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, '[]'::jsonb, $6, 0, $6, $7, 'USD', $8::date, $9::date, $10, $11::jsonb, $12, NOW())
         ON CONFLICT (invoice_number) DO UPDATE SET
           client_id = EXCLUDED.client_id,
           project_id = EXCLUDED.project_id,
           status = EXCLUDED.status,
           amount_paid = EXCLUDED.amount_paid,
           paid_at = EXCLUDED.paid_at,
           metadata = EXCLUDED.metadata
         RETURNING id`,
        [
          invId,
          clientId,
          projId,
          inv.num,
          inv.status,
          inv.amount,
          inv.paid,
          issueDate.toISOString().split('T')[0],
          dueDate.toISOString().split('T')[0],
          paidAt,
          JSON.stringify({ is_demo: true, seed_tag: DEMO_TAG }),
          issueDate,
        ]
      );
      const actualInvoiceId = invRes.rows[0]?.id || invId;

      // If settled/paid, insert payment record
      if (inv.status === 'paid' && paidAt) {
        const paymentId = `e2000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
        await client.query(
          `INSERT INTO billing_schema.payments
             (id, invoice_id, client_id, amount, currency, method, status, gateway_txn_id, paid_at, metadata, created_at)
           VALUES ($1, $2, $3, $4, 'USD', $5, 'completed', $6, $7, $8::jsonb, $7)
           ON CONFLICT (id) DO UPDATE SET
             status = EXCLUDED.status,
             amount = EXCLUDED.amount`,
          [
            paymentId,
            actualInvoiceId,
            clientId,
            inv.paid,
            inv.method || 'bank_transfer',
            `tx_demo_${inv.num.toLowerCase().replace(/-/g, '_')}`,
            paidAt,
            JSON.stringify({ is_demo: true, seed_tag: DEMO_TAG }),
          ]
        );
      }
    }

    // ── 6. Support Tickets ─────────────────────────────────────────
    console.log('6. Seeding Support Tickets...');
    const ticketSeeds = [
      { num: 'TCK-2026-101', clientIdx: 0, catIdx: 0, priority: 'critical', status: 'open', subject: 'Production Cluster high latency spike on checkout API', daysAgo: 1, resolved: false },
      { num: 'TCK-2026-102', clientIdx: 0, catIdx: 1, priority: 'medium', status: 'in_progress', subject: 'Tax calculation clarification on Invoice INV-2026-003', daysAgo: 2, resolved: false },
      { num: 'TCK-2026-103', clientIdx: 0, catIdx: 2, priority: 'low', status: 'open', subject: 'Request for webhook event on invoice payment completion', daysAgo: 3, resolved: false },
      { num: 'TCK-2026-104', clientIdx: 0, catIdx: 3, priority: 'high', status: 'resolved', subject: 'SSO Okta configuration callback URI update', daysAgo: 0, resolved: true, resolvedToday: true },
      { num: 'TCK-2026-105', clientIdx: 0, catIdx: 0, priority: 'medium', status: 'resolved', subject: 'SSL Certificate expiration notification inquiry', daysAgo: 4, resolved: true, resolvedToday: false },
      { num: 'TCK-2026-106', clientIdx: 1, catIdx: 0, priority: 'high', status: 'open', subject: 'CI/CD pipeline test runner timeout error', daysAgo: 1, resolved: false },
      { num: 'TCK-2026-107', clientIdx: 1, catIdx: 1, priority: 'low', status: 'open', subject: 'Update billing address for European tax purposes', daysAgo: 2, resolved: false },
      { num: 'TCK-2026-108', clientIdx: 1, catIdx: 0, priority: 'critical', status: 'resolved', subject: 'Database connection pool saturation', daysAgo: 0, resolved: true, resolvedToday: true },
      { num: 'TCK-2026-109', clientIdx: 2, catIdx: 2, priority: 'medium', status: 'open', subject: 'Custom font integration in design system tokens', daysAgo: 2, resolved: false },
      { num: 'TCK-2026-110', clientIdx: 2, catIdx: 0, priority: 'low', status: 'resolved', subject: 'Asset CDN caching policy optimization', daysAgo: 5, resolved: true, resolvedToday: false },
    ];

    for (let i = 0; i < ticketSeeds.length; i++) {
      const ts = ticketSeeds[i];
      const ticketId = `a2000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;
      const clientId = clientIds[ts.clientIdx];
      const reporterId = demoUsers[ts.clientIdx].id;
      const catId = categories[ts.catIdx].id;

      const createdAt = new Date(now - ts.daysAgo * 24 * 60 * 60 * 1000);
      let resolvedAt = null;
      if (ts.resolved) {
        resolvedAt = ts.resolvedToday ? new Date(now - 2 * 60 * 60 * 1000) : new Date(createdAt.getTime() + 12 * 60 * 60 * 1000);
      }

      await client.query(
        `INSERT INTO support_schema.tickets
           (id, ticket_number, client_id, reporter_id, category_id, subject, description, priority, status, resolved_at, metadata, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, NOW())
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           priority = EXCLUDED.priority,
           resolved_at = EXCLUDED.resolved_at,
           metadata = EXCLUDED.metadata`,
        [
          ticketId,
          ts.num,
          clientId,
          reporterId,
          catId,
          ts.subject,
          `Detailed support investigation request: ${ts.subject}. Client submitted diagnostics report.`,
          ts.priority,
          ts.status,
          resolvedAt,
          JSON.stringify({ is_demo: true, seed_tag: DEMO_TAG }),
          createdAt,
        ]
      );
    }

    // ── 7. CRM Leads & Pipeline ────────────────────────────────────
    console.log('7. Seeding CRM Pipeline...');
    const leadStages = [
      { stage: 'new', count: 5, val: 35000 },
      { stage: 'contacted', count: 5, val: 38000 },
      { stage: 'qualified', count: 4, val: 65000 },
      { stage: 'meeting_scheduled', count: 4, val: 58000 },
      { stage: 'proposal_sent', count: 4, val: 88000 },
      { stage: 'negotiation', count: 2, val: 60000 },
      { stage: 'won', count: 4, val: 125000 },
    ];

    const sources = ['website', 'referral', 'linkedin', 'google_ads', 'meta_ads', 'cold_outreach', 'partner', 'other'];
    const companies = [
      'Nexura Health AI', 'Quantex Capital Tech', 'OmniRetail Solutions', 'Hyperion Cloud Systems',
      'Solaris CleanEnergy', 'Vanguard Security Labs', 'AeroFleet Defense', 'Synthetix Dynamics',
      'Nordic FinTech Group', 'Atlas Supply Chains', 'BlueWave Oceanics', 'Helix BioPharm',
      'Krypton Cybersecurity', 'Meridian Media Works', 'Pinnacle Smart Logistics', 'Apex AI Robotics',
      'Titan Manufacturing', 'Zephyr Global Logistics', 'Lumina Analytics', 'Orbital Satellite Comms',
      'NovaPay Technologies', 'Summit Cloud Consulting', 'Silverline Architecture', 'Crestview Capital',
      'Beacon Telehealth', 'Zenith Smart Grids', 'Stratus Enterprise DevOps', 'Radiant Design Group'
    ];

    let leadIdx = 1;
    for (const ls of leadStages) {
      for (let k = 0; k < ls.count; k++) {
        const leadId = `c3000000-0000-0000-0000-${String(leadIdx).padStart(12, '0')}`;
        const singleVal = Math.round(ls.val / ls.count);
        const comp = companies[(leadIdx - 1) % companies.length];
        const src = sources[(leadIdx - 1) % sources.length];
        const score = 35 + ((leadIdx * 7) % 60);

        // Follow up scheduling:
        // - lead 1, 2: overdue
        // - lead 3, 4: today/tomorrow
        // - others: next week or null for won
        let nextFollowUp = null;
        if (ls.stage !== 'won' && ls.stage !== 'lost') {
          if (leadIdx <= 2) {
            nextFollowUp = new Date(now - (leadIdx * 24 + 4) * 3600 * 1000); // overdue
          } else if (leadIdx <= 5) {
            nextFollowUp = new Date(now + (leadIdx - 2) * 24 * 3600 * 1000); // upcoming
          } else {
            nextFollowUp = new Date(now + ((leadIdx % 7) + 2) * 24 * 3600 * 1000);
          }
        }

        const wonAt = ls.stage === 'won' ? new Date(now - (leadIdx * 2) * 24 * 3600 * 1000) : null;
        const dealVal = ls.stage === 'won' ? singleVal : null;

        await client.query(
          `INSERT INTO crm_schema.leads
             (id, public_id, company, first_name, last_name, email, phone, source, stage,
              expected_value, deal_value, currency, lead_score, lead_temperature, urgency,
              budget_range, requirements, assigned_to, next_follow_up, won_at, metadata, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8::lead_source, $9::lead_stage,
                   $10, $11, 'USD', $12, $13, 'medium', $14, $15, $16, $17, $18, $19::jsonb, NOW() - INTERVAL '${leadIdx * 3} days', NOW())
           ON CONFLICT (public_id) DO UPDATE SET
             company = EXCLUDED.company,
             stage = EXCLUDED.stage,
             expected_value = EXCLUDED.expected_value,
             deal_value = EXCLUDED.deal_value,
             lead_score = EXCLUDED.lead_score,
             assigned_to = EXCLUDED.assigned_to,
             next_follow_up = EXCLUDED.next_follow_up,
             won_at = EXCLUDED.won_at,
             metadata = EXCLUDED.metadata`,
          [
            leadId,
            `LEAD-${leadIdx}`,
            comp,
            'Lead',
            `Executive ${leadIdx}`,
            `executive${leadIdx}@${comp.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
            `+1-555-${String(2000 + leadIdx).padStart(4, '0')}`,
            src,
            ls.stage,
            singleVal,
            dealVal,
            score,
            score >= 70 ? 'hot' : score >= 50 ? 'warm' : 'cold',
            `$${Math.round(singleVal * 0.8 / 1000)}k–$${Math.round(singleVal * 1.2 / 1000)}k`,
            `Inbound enterprise inquiry regarding modern platform integration and architecture for ${comp}.`,
            adminUserId,
            nextFollowUp,
            wonAt,
            JSON.stringify({ is_demo: true, seed_tag: DEMO_TAG }),
          ]
        );

        // Seed 1 CRM lead note
        await client.query(
          `INSERT INTO crm_schema.lead_notes (lead_id, author_id, content, is_pinned, created_at)
           VALUES ($1, $2, $3, $4, NOW() - INTERVAL '${leadIdx * 2} days')
           ON CONFLICT DO NOTHING`,
          [
            leadId,
            adminUserId,
            `Initial requirements consultation completed with ${comp}. Budget confirmed at ~${singleVal} USD.`,
            leadIdx % 3 === 0,
          ]
        );

        // Seed 1 CRM lead activity
        await client.query(
          `INSERT INTO crm_schema.lead_activities (lead_id, actor_id, activity_type, subject, description, occurred_at)
           VALUES ($1, $2, 'call', 'Discovery Call Conducted', 'Discussed deliverables, timeline and procurement process.', NOW() - INTERVAL '${leadIdx} days')
           ON CONFLICT DO NOTHING`,
          [leadId, adminUserId]
        );

        leadIdx++;
      }
    }

    // ── 8. Analytics Page Views & Visitors ─────────────────────────
    console.log('8. Seeding Analytics Traffic & Page Views...');
    const paths = ['/dashboard', '/dashboard/analytics', '/dashboard/projects', '/dashboard/finance', '/dashboard/crm', '/dashboard/clients'];
    const titles = ['Overview Dashboard', 'Analytics & Metrics', 'Projects Hub', 'Finance & Billing', 'CRM & Leads Pipeline', 'Client Directory'];
    const referrers = ['https://google.com', 'https://linkedin.com', 'https://twitter.com', 'direct', 'https://github.com'];
    const countries = ['United States', 'United Kingdom', 'Germany', 'Canada', 'Australia', 'Japan', 'India'];
    const devices = ['desktop', 'mobile', 'tablet'];

    const pageViewInserts = [];
    for (let i = 0; i < 650; i++) {
      let daysAgo;
      let minutesAgo = 0;

      if (i < 12) {
        daysAgo = 0;
        minutesAgo = Math.floor(Math.random() * 4) + 1;
      } else if (i < 160) {
        daysAgo = Math.random() * 7;
      } else if (i < 410) {
        daysAgo = 7 + Math.random() * 23;
      } else {
        daysAgo = 30 + Math.random() * 60;
      }

      const eventDate = new Date(now - (daysAgo * 24 * 60 + minutesAgo) * 60 * 1000);
      const visitorNum = (i % 160) + 1;
      const visId = `vis_${String(visitorNum).padStart(3, '0')}`;
      const sessId = `sess_${visId}_d${Math.floor(daysAgo)}`;
      const pIdx = i % paths.length;
      const refIdx = i % referrers.length;
      const cIdx = i % countries.length;
      const dIdx = i % devices.length;
      const durationSec = Math.floor(Math.random() * 320) + 20;

      pageViewInserts.push({
        session_id: sessId,
        visitor_id: visId,
        page_path: paths[pIdx],
        page_title: titles[pIdx],
        referrer: referrers[refIdx],
        device_type: devices[dIdx],
        country: countries[cIdx],
        duration_sec: durationSec,
        created_at: eventDate,
      });
    }

    for (let b = 0; b < pageViewInserts.length; b += 100) {
      const batch = pageViewInserts.slice(b, b + 100);
      const values = [];
      const params = [];
      let pIdx = 1;

      for (const row of batch) {
        values.push(`($${pIdx}, $${pIdx+1}, $${pIdx+2}, $${pIdx+3}, $${pIdx+4}, $${pIdx+5}, $${pIdx+6}, $${pIdx+7}, 'demo_seed', $${pIdx+8})`);
        params.push(
          row.session_id,
          row.visitor_id,
          row.page_path,
          row.page_title,
          row.referrer,
          row.device_type,
          row.country,
          row.duration_sec,
          row.created_at
        );
        pIdx += 9;
      }

      await client.query(
        `INSERT INTO analytics_schema.page_views
           (session_id, visitor_id, page_path, page_title, referrer, device_type, country, duration_sec, utm_campaign, created_at)
         VALUES ${values.join(', ')}`,
        params
      );
    }

    // ── 10. HR & Recruitment ──────────────────────────────────────
    console.log('10. Seeding HR & Recruitment (Departments, Jobs, Team)...');
    const hrDepts = [
      { name: 'Engineering', slug: 'engineering' },
      { name: 'Product & Design', slug: 'product-design' },
      { name: 'Marketing & Growth', slug: 'marketing-growth' },
      { name: 'Customer Success', slug: 'customer-success' },
    ];
    const deptMap = {};
    for (const d of hrDepts) {
      const res = await client.query(
        `INSERT INTO careers_schema.departments (name, slug)
         VALUES ($1, $2)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, slug`,
        [d.name, d.slug]
      );
      deptMap[d.slug] = res.rows[0].id;
    }

    const jobSeeds = [
      {
        title: 'Senior Full-Stack Engineer (Next.js & Node.js)',
        slug: 'senior-full-stack-engineer',
        dept: 'engineering',
        type: 'full_time',
        location: 'Remote',
        is_remote: true,
        is_hybrid: false,
        salary_min: 120000,
        salary_max: 160000,
        exp: 5,
        openings: 2,
        urgent: true,
        desc: 'Build high-performance enterprise applications using Next.js 14, React 19, TypeScript, and Node.js.',
      },
      {
        title: 'Lead Cloud Architect (AWS & Kubernetes)',
        slug: 'lead-cloud-architect',
        dept: 'engineering',
        type: 'full_time',
        location: 'San Francisco, CA',
        is_remote: false,
        is_hybrid: true,
        salary_min: 160000,
        salary_max: 210000,
        exp: 8,
        openings: 1,
        urgent: false,
        desc: 'Design and implement resilient, multi-region cloud infrastructures and CI/CD automation pipelines.',
      },
      {
        title: 'Principal Product Designer (Design Systems)',
        slug: 'principal-product-designer',
        dept: 'product-design',
        type: 'full_time',
        location: 'Remote',
        is_remote: true,
        is_hybrid: false,
        salary_min: 110000,
        salary_max: 150000,
        exp: 6,
        openings: 1,
        urgent: true,
        desc: 'Lead the design vision and maintain atomic design systems across web and mobile surfaces.',
      },
      {
        title: 'Enterprise Customer Success Manager',
        slug: 'enterprise-csm',
        dept: 'customer-success',
        type: 'full_time',
        location: 'New York, NY',
        is_remote: false,
        is_hybrid: true,
        salary_min: 90000,
        salary_max: 130000,
        exp: 4,
        openings: 2,
        urgent: false,
        desc: 'Partner with key enterprise accounts to drive high adoption, retention, and strategic business outcomes.',
      },
      {
        title: 'Growth Marketing Lead',
        slug: 'growth-marketing-lead',
        dept: 'marketing-growth',
        type: 'full_time',
        location: 'Remote',
        is_remote: true,
        is_hybrid: false,
        salary_min: 95000,
        salary_max: 135000,
        exp: 4,
        openings: 1,
        urgent: false,
        desc: 'Scale digital demand generation, inbound marketing campaigns, SEO strategy, and conversion funnels.',
      },
    ];

    const jobMap = {};
    for (const j of jobSeeds) {
      const res = await client.query(
        `INSERT INTO careers_schema.jobs
           (department_id, title, slug, description, job_type, location, is_remote, is_hybrid,
            salary_min, salary_max, currency, experience_years, openings, is_urgent, is_published, created_by)
         VALUES ($1, $2, $3, $4, $5::job_type, $6, $7, $8, $9, $10, 'USD', $11, $12, $13, TRUE, $14)
         ON CONFLICT (slug) DO UPDATE
           SET title = EXCLUDED.title, description = EXCLUDED.description, is_published = TRUE
         RETURNING id, slug`,
        [deptMap[j.dept] || null, j.title, j.slug, j.desc, j.type, j.location,
         j.is_remote, j.is_hybrid, j.salary_min, j.salary_max, j.exp, j.openings, j.urgent, adminUserId]
      );
      jobMap[j.slug] = res.rows[0].id;
    }

    // Team Members in system_schema.team_members
    const teamSeeds = [
      { name: 'Dr. Aris Thorne', designation: 'Chief Technology Officer', dept: 'Engineering', bio: 'Former VP of Infrastructure at CloudScale with 18+ years building enterprise distributed systems.', order: 1, feat: true },
      { name: 'Elena Rostova', designation: 'Head of Product Design', dept: 'Product & Design', bio: 'Pioneered accessible design patterns across Fortune 500 portals and modern SaaS ecosystems.', order: 2, feat: true },
      { name: 'Marcus Chen', designation: 'Principal Cloud Architect', dept: 'Engineering', bio: 'Specialist in high-throughput event sourcing, Kubernetes clusters, and zero-downtime migrations.', order: 3, feat: false },
      { name: 'Sarah Jenkins', designation: 'VP of Customer Success', dept: 'Customer Success', bio: 'Passionate about client empowerment, SLA reliability, and enterprise partner growth.', order: 4, feat: true },
    ];

    for (const tm of teamSeeds) {
      const existing = await client.query(`SELECT id FROM system_schema.team_members WHERE name = $1`, [tm.name]);
      if (!existing.rows.length) {
        await client.query(
          `INSERT INTO system_schema.team_members (name, designation, department, bio, display_order, is_featured, is_active, joined_date)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, CURRENT_DATE - INTERVAL '1 year')`,
          [tm.name, tm.designation, tm.dept, tm.bio, tm.order, tm.feat]
        );
      }
    }

    // Candidate applications
    const candidates = [
      { first: 'David', last: 'Kim', email: 'david.kim@example.com', title: 'Senior Software Engineer', exp: 6, job: 'senior-full-stack-engineer', stage: 'interview_1', rating: 5 },
      { first: 'Maya', last: 'Patel', email: 'maya.patel@example.com', title: 'UX Lead', exp: 7, job: 'principal-product-designer', stage: 'offer', rating: 4 },
      { first: 'Carlos', last: 'Gomez', email: 'carlos.gomez@example.com', title: 'DevOps Specialist', exp: 5, job: 'lead-cloud-architect', stage: 'applied', rating: 4 },
      { first: 'Jessica', last: 'Lee', email: 'jessica.lee@example.com', title: 'Account Executive', exp: 4, job: 'enterprise-csm', stage: 'screening', rating: 3 },
    ];

    for (const cand of candidates) {
      let candId;
      const cRes = await client.query(`SELECT id FROM careers_schema.candidates WHERE email = $1`, [cand.email]);
      if (cRes.rows.length) {
        candId = cRes.rows[0].id;
      } else {
        const nc = await client.query(
          `INSERT INTO careers_schema.candidates (first_name, last_name, email, current_title, years_exp, source)
           VALUES ($1, $2, $3, $4, $5, 'linkedin') RETURNING id`,
          [cand.first, cand.last, cand.email, cand.title, cand.exp]
        );
        candId = nc.rows[0].id;
      }

      if (jobMap[cand.job]) {
        const appCheck = await client.query(`SELECT id FROM careers_schema.applications WHERE job_id = $1 AND candidate_id = $2`, [jobMap[cand.job], candId]);
        if (!appCheck.rows.length) {
          await client.query(
            `INSERT INTO careers_schema.applications (job_id, candidate_id, stage, rating, cover_letter, applied_at)
             VALUES ($1, $2, $3::application_stage, $4, 'Excited to apply for this role and bring my expertise to the team.', NOW() - INTERVAL '5 days')`,
            [jobMap[cand.job], candId, cand.stage, cand.rating]
          );
          await client.query(`UPDATE careers_schema.jobs SET applications_count = applications_count + 1 WHERE id = $1`, [jobMap[cand.job]]);
        }
      }
    }

    // ── 11. Blog & Content ─────────────────────────────────────────
    console.log('11. Seeding Blog & Resources...');
    const blogCategories = [
      { name: 'Engineering & Architecture', slug: 'engineering-architecture', color: '#3b82f6' },
      { name: 'Design Systems', slug: 'design-systems', color: '#ec4899' },
      { name: 'Cloud & DevOps', slug: 'cloud-devops', color: '#10b981' },
      { name: 'Product Strategy', slug: 'product-strategy', color: '#f59e0b' },
    ];
    const blogCatMap = {};
    for (const bc of blogCategories) {
      const res = await client.query(
        `INSERT INTO blog_schema.categories (name, slug, color, is_active)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, slug`,
        [bc.name, bc.slug, bc.color]
      );
      blogCatMap[bc.slug] = res.rows[0].id;
    }

    const blogPosts = [
      {
        title: 'Building Resilient Distributed Systems with Micro-Frontends & Event Sourcing',
        slug: 'building-resilient-distributed-systems',
        cat: 'engineering-architecture',
        excerpt: 'How modern enterprises can decouple monorepos and manage state asynchronously without compromising data integrity.',
        status: 'published',
        read_time: 8,
        featured: true,
      },
      {
        title: 'Atomic Design Systems in Enterprise: From Tokens to Production Code',
        slug: 'atomic-design-systems-enterprise',
        cat: 'design-systems',
        excerpt: 'Standardizing typography, spacing, and component contracts across cross-functional product squads.',
        status: 'published',
        read_time: 6,
        featured: false,
      },
      {
        title: 'Zero-Downtime PostgreSQL Migrations for High-Traffic Workloads',
        slug: 'zero-downtime-postgresql-migrations',
        cat: 'cloud-devops',
        excerpt: 'Strategies for applying schema changes, foreign keys, and column backfills safely on production database clusters.',
        status: 'published',
        read_time: 10,
        featured: true,
      },
      {
        title: 'AI Agents in Enterprise Operations: Roadmap for 2026',
        slug: 'ai-agents-enterprise-operations-2026',
        cat: 'product-strategy',
        excerpt: 'Integrating LLM agents into internal workflows, ticketing triage, and developer self-service platforms.',
        status: 'draft',
        read_time: 7,
        featured: false,
      },
    ];

    for (const bp of blogPosts) {
      await client.query(
        `INSERT INTO blog_schema.posts
           (title, slug, excerpt, content, category_id, status, read_time_min, is_featured, published_at, author_id)
         VALUES ($1, $2, $3, $3, $4, $5::post_status, $6, $7, CASE WHEN $5 = 'published' THEN NOW() - INTERVAL '7 days' ELSE NULL END, $8)
         ON CONFLICT (slug) DO UPDATE
           SET title = EXCLUDED.title, excerpt = EXCLUDED.excerpt, status = EXCLUDED.status`,
        [bp.title, bp.slug, bp.excerpt, blogCatMap[bp.cat] || null, bp.status, bp.read_time, bp.featured, adminUserId]
      );
    }

    // ── 12. CMS Module ─────────────────────────────────────────────
    console.log('12. Seeding CMS (Pages, Menus, Testimonials)...');
    const cmsPages = [
      { title: 'Home', slug: 'home', template: 'landing', visibility: 'public', is_homepage: true },
      { title: 'About Our Enterprise Platform', slug: 'about-us', template: 'default', visibility: 'public', is_homepage: false },
      { title: 'Digital Solutions & Enterprise Services', slug: 'services-overview', template: 'default', visibility: 'public', is_homepage: false },
      { title: 'Pricing & Engagement Models', slug: 'pricing', template: 'default', visibility: 'public', is_homepage: false },
      { title: 'Security & Enterprise Compliance', slug: 'security-compliance', template: 'default', visibility: 'public', is_homepage: false },
    ];

    for (const cp of cmsPages) {
      await client.query(
        `INSERT INTO cms_schema.pages (title, slug, template, visibility, is_homepage, published_at, created_by)
         VALUES ($1, $2, $3, $4, $5, NOW(), $6)
         ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title, visibility = EXCLUDED.visibility`,
        [cp.title, cp.slug, cp.template, cp.visibility, cp.is_homepage, adminUserId]
      );
    }

    const testimonials = [
      { author: 'Evelyn Vance', title: 'VP of Digital Transformation', company: 'Global Logistics Hub', content: 'Sysmaira delivered our next-generation dispatch platform 3 weeks ahead of schedule. Flawless execution and zero downtime.', rating: 5 },
      { author: 'Nathaniel Reed', title: 'Chief Information Officer', company: 'Apex Financial Services', content: 'Their architectural rigor and deep expertise in PostgreSQL performance and security compliance exceeded our highest benchmarks.', rating: 5 },
      { author: 'Miriam Sterling', title: 'Product Director', company: 'PulseHealth Systems', content: 'The user experience is lightning fast and our operational overhead dropped by 40% in the first quarter alone.', rating: 5 },
    ];

    for (const t of testimonials) {
      const existing = await client.query(`SELECT id FROM cms_schema.testimonials WHERE author_name = $1 AND author_company = $2`, [t.author, t.company]);
      if (!existing.rows.length) {
        await client.query(
          `INSERT INTO cms_schema.testimonials (author_name, author_title, author_company, content, rating, is_featured, is_published)
           VALUES ($1, $2, $3, $4, $5, TRUE, TRUE)`,
          [t.author, t.title, t.company, t.content, t.rating]
        );
      }
    }

    // ── 13. Portfolio / Case Studies ────────────────────────────────
    console.log('13. Seeding Portfolio Case Studies...');
    const portfolioProjects = [
      {
        title: 'High-Frequency Financial Settlement Gateway',
        slug: 'high-frequency-financial-settlement-gateway',
        client: 'Apex Financial Services',
        summary: 'Architected and deployed an ultra-low-latency transaction settlement platform processing $250M+ daily volume.',
        challenge: 'Legacy system suffered from concurrency bottlenecks, intermittent deadlock states, and lack of real-time auditability.',
        solution: 'Implemented PostgreSQL partitioning with Redis distributed locks and an event-driven Go microservices pipeline.',
        result: 'Decreased median settlement latency from 4.2s to 120ms with 99.999% transaction consistency.',
        tech: ['PostgreSQL', 'Node.js', 'Go', 'Redis', 'Docker'],
        published: true,
        featured: true,
      },
      {
        title: 'Global Fleet Dispatch & IoT Telemetry Portal',
        slug: 'global-fleet-dispatch-iot-telemetry-portal',
        client: 'Global Logistics Hub',
        summary: 'Real-time telemetry and dispatch portal managing 12,000 active transport vehicles across 4 continents.',
        challenge: 'High message ingress caused massive database load spikes during peak business operating hours.',
        solution: 'Built timescale partition routing and WebSockets bidirectional streams with resilient offline fallback.',
        result: 'Processed 50M daily GPS pings with instantaneous route re-optimization and sub-second fleet visibility.',
        tech: ['Next.js', 'PostgreSQL', 'WebSockets', 'TailwindCSS'],
        published: true,
        featured: true,
      },
      {
        title: 'Next-Gen HIPAA-Compliant Telehealth Ecosystem',
        slug: 'hipaa-compliant-telehealth-ecosystem',
        client: 'PulseHealth Systems',
        summary: 'Integrated video consultations, encrypted electronic medical records (EMR), and automated lab requisitioning.',
        challenge: 'Stringent multi-tenant HIPAA encryption standards paired with low-latency WebRTC video streaming requirements.',
        solution: 'End-to-end envelope encryption with automated audit logging and WebRTC SFU media clusters.',
        result: 'Successfully onboarded 200,000 patients across 45 clinical specialties with zero security incidents.',
        tech: ['React', 'PostgreSQL', 'WebRTC', 'AWS KMS'],
        published: true,
        featured: false,
      },
    ];

    for (const pp of portfolioProjects) {
      await client.query(
        `INSERT INTO portfolio_schema.projects
           (title, slug, client_name, summary, challenge, solution, result, tech_stack, is_published, is_featured, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (slug) DO UPDATE
           SET title = EXCLUDED.title, summary = EXCLUDED.summary, is_published = EXCLUDED.is_published`,
        [pp.title, pp.slug, pp.client, pp.summary, pp.challenge, pp.solution, pp.result, pp.tech, pp.published, pp.featured, adminUserId]
      );
    }

    // ── 14. Services & Catalog ─────────────────────────────────────
    console.log('14. Seeding Services Catalog...');
    const serviceCategories = [
      { name: 'Custom Software Development', slug: 'custom-software', color: '#3b82f6' },
      { name: 'Cloud Infrastructure & DevOps', slug: 'cloud-devops', color: '#10b981' },
      { name: 'Enterprise UI/UX Design', slug: 'enterprise-ui-ux', color: '#8b5cf6' },
    ];
    const srvCatMap = {};
    for (const sc of serviceCategories) {
      const res = await client.query(
        `INSERT INTO cms_schema.service_categories (name, slug, color, is_active)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, slug`,
        [sc.name, sc.slug, sc.color]
      );
      srvCatMap[sc.slug] = res.rows[0].id;
    }

    const services = [
      {
        title: 'Enterprise Full-Stack Web Application Development',
        slug: 'enterprise-full-stack-web-apps',
        cat: 'custom-software',
        summary: 'Scalable Next.js and Node.js solutions engineered for high concurrency, enterprise security, and seamless developer experience.',
        starting_price: 25000,
        featured: true,
      },
      {
        title: 'Multi-Cloud Architecture & Kubernetes Modernization',
        slug: 'multi-cloud-architecture-kubernetes',
        cat: 'cloud-devops',
        summary: 'End-to-end containerization, Terraform infrastructure-as-code, GitOps pipelines, and multi-region disaster recovery setups.',
        starting_price: 35000,
        featured: true,
      },
      {
        title: 'Enterprise Design Systems & Digital UX Audit',
        slug: 'enterprise-design-systems-ux-audit',
        cat: 'enterprise-ui-ux',
        summary: 'Comprehensive heuristic evaluation, WCAG 2.1 AA accessibility compliance, and production Figma-to-React component libraries.',
        starting_price: 15000,
        featured: false,
      },
    ];

    for (const s of services) {
      await client.query(
        `INSERT INTO cms_schema.services
           (title, slug, summary, category_id, starting_price, currency, is_featured, is_active, created_by)
         VALUES ($1, $2, $3, $4, $5, 'USD', $6, TRUE, $7)
         ON CONFLICT (slug) DO UPDATE
           SET title = EXCLUDED.title, summary = EXCLUDED.summary, is_active = TRUE`,
        [s.title, s.slug, s.summary, srvCatMap[s.cat] || null, s.starting_price, s.featured, adminUserId]
      );
    }

    // ── 15. Marketing & Campaigns ──────────────────────────────────
    console.log('15. Seeding Marketing Campaigns, Subscribers & Coupons...');
    const mailingLists = [
      { name: 'Enterprise Product Newsletter', slug: 'enterprise-product-newsletter', desc: 'Monthly updates on digital transformation and architecture insights.' },
      { name: 'Developer & Engineering Updates', slug: 'developer-engineering-updates', desc: 'Technical deep dives, OSS releases, and API documentation changelogs.' },
    ];
    const listMap = {};
    for (const ml of mailingLists) {
      const res = await client.query(
        `INSERT INTO marketing_schema.mailing_lists (name, slug, description, is_active)
         VALUES ($1, $2, $3, TRUE)
         ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
         RETURNING id, slug`,
        [ml.name, ml.slug, ml.desc]
      );
      listMap[ml.slug] = res.rows[0].id;
    }

    const subscribers = [
      { email: 'sarah.connor@cyberdyne.org', first: 'Sarah', last: 'Connor', source: 'landing_page', status: 'active', open_rate: 68.5, click_rate: 22.0 },
      { email: 'alex.murphy@omnicorp.net', first: 'Alex', last: 'Murphy', source: 'blog_subscribe', status: 'active', open_rate: 85.0, click_rate: 34.2 },
      { email: 'thomas.anderson@metacortex.io', first: 'Thomas', last: 'Anderson', source: 'whitepaper', status: 'active', open_rate: 92.1, click_rate: 45.0 },
      { email: 'dana.scully@fbi-health.gov', first: 'Dana', last: 'Scully', source: 'webinar', status: 'active', open_rate: 54.0, click_rate: 18.0 },
    ];

    for (const sub of subscribers) {
      await client.query(
        `INSERT INTO marketing_schema.subscribers (email, first_name, last_name, source, status, open_rate, click_rate, subscribed_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW() - INTERVAL '15 days')
         ON CONFLICT (email) DO UPDATE
           SET first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, status = 'active'`,
        [sub.email, sub.first, sub.last, sub.source, sub.status, sub.open_rate, sub.click_rate]
      );
    }

    const campaigns = [
      {
        name: 'Enterprise Platform 2.0 Feature Release',
        subject: 'Introducing High-Performance Project & CRM Analytics',
        type: 'newsletter',
        status: 'sent',
        recipients: 1250,
        opens: 580,
        clicks: 195,
      },
      {
        name: 'Q4 Digital Transformation Webinar Invitation',
        subject: 'Join Industry Leaders: Scaling Distributed Cloud Workloads',
        type: 'announcement',
        status: 'sent',
        recipients: 980,
        opens: 412,
        clicks: 140,
      },
      {
        name: 'Upcoming Maintenance & Infrastructure Upgrades',
        subject: 'Scheduled Platform Maintenance Announcement',
        type: 'regular',
        status: 'draft',
        recipients: 0,
        opens: 0,
        clicks: 0,
      },
    ];

    for (const c of campaigns) {
      const existing = await client.query(`SELECT id FROM marketing_schema.campaigns WHERE name = $1`, [c.name]);
      if (!existing.rows.length) {
        const sentDate = c.status === 'sent' ? new Date(Date.now() - 3 * 24 * 3600 * 1000) : null;
        await client.query(
          `INSERT INTO marketing_schema.campaigns
             (name, subject, type, status, recipient_count, open_count, click_count, sent_at, created_by)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [c.name, c.subject, c.type, c.status, c.recipients, c.opens, c.clicks, sentDate, adminUserId]
        );
      }
    }

    const coupons = [
      { code: 'ENTERPRISE2026', desc: 'Enterprise Launch Discount', type: 'percentage', val: 15, min: 5000, max_uses: 50 },
      { code: 'SYSMAIRA1000', desc: 'Flat $1,000 Off New Project Engagements', type: 'fixed', val: 1000, min: 10000, max_uses: 25 },
      { code: 'VIPCLIENT20', desc: 'Exclusive VIP Retainer Promotion', type: 'percentage', val: 20, min: 20000, max_uses: 10 },
    ];

    for (const cp of coupons) {
      await client.query(
        `INSERT INTO billing_schema.coupons
           (code, description, discount_type, discount_value, min_amount, max_uses, valid_until, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() + INTERVAL '1 year', TRUE)
         ON CONFLICT (code) DO UPDATE
           SET discount_value = EXCLUDED.discount_value, is_active = TRUE`,
        [cp.code, cp.desc, cp.type, cp.val, cp.min, cp.max_uses]
      );
    }

    // ── 16. Administrative Tools, Media, AI, Profile & Audit Trail ───
    console.log('16. Seeding Admin Tools, Media, AI Assistant & Audit Logs...');

    // 16a. Company Profile
    const profileExists = await client.query(`SELECT id FROM system_schema.company_profile LIMIT 1`);
    if (!profileExists.rows.length) {
      await client.query(
        `INSERT INTO system_schema.company_profile
           (id, company_name, legal_name, registration_no, gst_number, pan_number, tagline, description, founded_year, team_size, primary_color, emails, phones, social_links, address, website_url, support_email)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13::jsonb, $14::jsonb, $15::jsonb, $16, $17)`,
        [
          'c1000000-0000-0000-0000-000000000001',
          'SysMaira Technologies',
          'SysMaira Global Solutions Corporation',
          'REG-2024-998812',
          '27AAACG0123M1Z5',
          'AAACG0123M',
          'Engineering Next-Generation Enterprise Systems',
          'SysMaira delivers enterprise software architecture, full-stack digital platforms, and cloud DevOps engineering to Fortune 500 enterprises and hyper-growth scaleups.',
          2024,
          65,
          '#4f46e5',
          JSON.stringify({ primary: 'hello@sysmaira.com', billing: 'billing@sysmaira.com', support: 'support@sysmaira.com' }),
          JSON.stringify({ main: '+1 (555) 019-2831', emergency: '+1 (555) 019-2832' }),
          JSON.stringify({ linkedin: 'https://linkedin.com/company/sysmaira', github: 'https://github.com/sysmaira', twitter: 'https://twitter.com/sysmaira' }),
          JSON.stringify({ street: '100 Montgomery St, Suite 1800', city: 'San Francisco', state: 'CA', postal_code: '94104', country: 'United States' }),
          'https://sysmaira.example.com',
          'support@sysmaira.com'
        ]
      );
    }

    // 16b. System Settings
    const systemSettings = [
      { key: 'site.name', val: 'SysMaira Enterprise', grp: 'branding', desc: 'Platform corporate brand name', pub: true },
      { key: 'site.tagline', val: 'High-Performance Enterprise Platforms', grp: 'branding', desc: 'Site metadata tagline', pub: true },
      { key: 'site.url', val: 'https://sysmaira.example.com', grp: 'branding', desc: 'Canonical production URL', pub: true },
      { key: 'email.from_name', val: 'SysMaira Operations', grp: 'email', desc: 'Default sender name for transactional emails', pub: false },
      { key: 'email.from_address', val: 'noreply@sysmaira.com', grp: 'email', desc: 'System outbound email address', pub: false },
      { key: 'email.support', val: 'support@sysmaira.com', grp: 'email', desc: 'Public customer support email', pub: true },
      { key: 'crm.lead_auto_assign', val: true, grp: 'crm', desc: 'Automatically assign incoming inbound leads', pub: false },
      { key: 'crm.sla_hours_low', val: 48, grp: 'crm', desc: 'SLA response window for low priority items (hours)', pub: false },
      { key: 'crm.sla_hours_medium', val: 24, grp: 'crm', desc: 'SLA response window for medium priority items (hours)', pub: false },
      { key: 'crm.sla_hours_urgent', val: 4, grp: 'crm', desc: 'SLA response window for critical/urgent items (hours)', pub: false },
      { key: 'security.mfa_enforced', val: false, grp: 'security', desc: 'Enforce multi-factor authentication for staff', pub: false },
      { key: 'security.session_timeout_minutes', val: 120, grp: 'security', desc: 'Inactivity session expiration in minutes', pub: false },
      { key: 'ai.default_model', val: 'gpt-4o-mini', grp: 'ai', desc: 'Default OpenAI completion model', pub: false },
      { key: 'ai.max_tokens_per_request', val: 2500, grp: 'ai', desc: 'Token limit ceiling per user turn', pub: false },
    ];

    for (const s of systemSettings) {
      await client.query(
        `INSERT INTO system_schema.settings (key, value, group_name, description, is_public)
         VALUES ($1, $2::jsonb, $3, $4, $5)
         ON CONFLICT (key) DO UPDATE
           SET value=EXCLUDED.value, description=EXCLUDED.description, is_public=EXCLUDED.is_public`,
        [s.key, JSON.stringify(s.val), s.grp, s.desc, s.pub]
      );
    }

    // 16c. Media Folders & Media Assets
    const brandFolderId = 'f1000000-0000-0000-0000-000000000001';
    const docsFolderId  = 'f1000000-0000-0000-0000-000000000002';
    const uiFolderId    = 'f1000000-0000-0000-0000-000000000003';

    const folders = [
      { id: brandFolderId, name: 'Brand & Identity' },
      { id: docsFolderId,  name: 'Contracts & Specifications' },
      { id: uiFolderId,    name: 'Screenshots & UI Assets' },
    ];

    for (const f of folders) {
      await client.query(
        `INSERT INTO cms_schema.media_folders (id, name, created_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name`,
        [f.id, f.name, adminUserId]
      );
    }

    const demoMedia = [
      {
        id: 'de000000-0000-0000-0000-000000000001',
        file_name: 'sysmaira-logo-primary.svg',
        original_name: 'logo-primary.svg',
        folder_id: brandFolderId,
        mime: 'image/svg+xml',
        ext: 'svg',
        size: 24500,
        type: 'image',
        cdn_url: '/uploads/branding/sysmaira-logo-primary.svg',
        alt: 'SysMaira Technologies Primary Vector Brand Logo',
        tags: ['branding', 'logo', 'vector', 'svg'],
      },
      {
        id: 'de000000-0000-0000-0000-000000000002',
        file_name: 'enterprise-architecture-blueprint.png',
        original_name: 'architecture-blueprint.png',
        folder_id: docsFolderId,
        mime: 'image/png',
        ext: 'png',
        size: 420800,
        type: 'image',
        cdn_url: '/uploads/architecture/enterprise-architecture-blueprint.png',
        alt: 'High-availability microservices architecture diagram',
        tags: ['architecture', 'diagram', 'engineering'],
      },
      {
        id: 'de000000-0000-0000-0000-000000000003',
        file_name: 'master-services-agreement-2026.pdf',
        original_name: 'MSA-Template-v3.pdf',
        folder_id: docsFolderId,
        mime: 'application/pdf',
        ext: 'pdf',
        size: 1540200,
        type: 'document',
        cdn_url: '/uploads/legal/master-services-agreement-2026.pdf',
        alt: 'Enterprise Master Services Agreement (MSA) Legal Template',
        tags: ['legal', 'contracts', 'msa', 'pdf'],
      },
      {
        id: 'de000000-0000-0000-0000-000000000004',
        file_name: 'dashboard-executive-overview.png',
        original_name: 'executive-overview.png',
        folder_id: uiFolderId,
        mime: 'image/png',
        ext: 'png',
        size: 618400,
        type: 'image',
        cdn_url: '/uploads/screenshots/dashboard-executive-overview.png',
        alt: 'Executive KPI Dashboard preview screenshot',
        tags: ['screenshot', 'dashboard', 'preview'],
      },
      {
        id: 'de000000-0000-0000-0000-000000000005',
        file_name: 'brand-guidelines-manual.pdf',
        original_name: 'Brand-Guidelines-2026.pdf',
        folder_id: brandFolderId,
        mime: 'application/pdf',
        ext: 'pdf',
        size: 3820100,
        type: 'document',
        cdn_url: '/uploads/branding/brand-guidelines-manual.pdf',
        alt: 'Official Corporate Brand Style Guide and Typography Manual',
        tags: ['branding', 'guidelines', 'pdf'],
      },
    ];

    for (const m of demoMedia) {
      await client.query(
        `INSERT INTO cms_schema.media
           (id, file_name, original_name, file_path, cdn_url, storage_key, storage_provider, media_type,
            file_size, size_bytes, mime_type, extension, alt_text, tags, folder_id, uploaded_by, metadata)
         VALUES ($1, $2, $3, $4, $4, $4, 'local'::storage_provider, $5, $6, $6, $7, $8, $9, $10::text[], $11, $12, '{"is_demo":true}'::jsonb)
         ON CONFLICT (id) DO UPDATE
           SET file_name = EXCLUDED.file_name, cdn_url = EXCLUDED.cdn_url, file_size = EXCLUDED.file_size`,
        [m.id, m.file_name, m.original_name, m.cdn_url, m.type, m.size, m.mime, m.ext, m.alt, m.tags, m.folder_id, adminUserId]
      );
    }

    // 16d. AI Conversations and Messages
    const demoConvId = 'a1000000-0000-0000-0000-000000000099';
    await client.query(
      `INSERT INTO ai_schema.conversations (id, user_id, title, mode, total_tokens, message_count, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (id) DO UPDATE SET title=EXCLUDED.title, total_tokens=EXCLUDED.total_tokens`,
      [demoConvId, adminUserId, 'Q4 Enterprise Migration Strategy', 'general', 780, 4]
    );

    await client.query('DELETE FROM ai_schema.messages WHERE conversation_id = $1', [demoConvId]);

    const demoAiMessages = [
      { id: 'b1000000-0000-0000-0000-000000000001', role: 'user', content: 'Can you summarize the primary deliverables for our upcoming client migration project?', tokens: 42, model: 'gpt-4o-mini' },
      { id: 'b1000000-0000-0000-0000-000000000002', role: 'assistant', content: 'Certainly! The upcoming enterprise migration encompasses 4 strategic deliverables:\n1. Zero-downtime database replication pipeline.\n2. Containerized service orchestration using Kubernetes.\n3. Centralized identity federation with fine-grained RBAC.\n4. Automated CI/CD verification with load & security regression suites.', tokens: 198, model: 'gpt-4o-mini' },
      { id: 'b1000000-0000-0000-0000-000000000003', role: 'user', content: 'What is our expected timeline and staging milestone checklist?', tokens: 35, model: 'gpt-4o-mini' },
      { id: 'b1000000-0000-0000-0000-000000000004', role: 'assistant', content: 'The overall timeline is scheduled across 8 weeks (4 bi-weekly sprints):\n- Sprints 1-2: Core schema sync & staging smoke tests.\n- Sprint 3: Security audit, penetration testing, and load verification (10k req/sec target).\n- Sprint 4: Production cutover window with automated rollback failover.', tokens: 215, model: 'gpt-4o-mini' },
    ];

    for (const msg of demoAiMessages) {
      await client.query(
        `INSERT INTO ai_schema.messages (id, conversation_id, role, content, tokens_used, model, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '2 hours')`,
        [msg.id, demoConvId, msg.role, msg.content, msg.tokens, msg.model]
      );
    }

    // 16e. Audit Logs (35+ realistic audit trail entries)
    await client.query(`DELETE FROM system_schema.audit_logs WHERE metadata->>'is_demo' = 'true'`);

    const auditEvents = [
      { action: 'LOGIN', res_type: 'auth', desc: 'Super Admin authenticated via password & verified token', diff: { method: 'password' } },
      { action: 'CREATE', res_type: 'users', desc: 'Created user account jordan@techflow.io with client role', diff: { role: 'client' } },
      { action: 'UPDATE_PERMISSIONS', res_type: 'roles', desc: 'Updated permissions matrix for Client role', diff: { added: ['project.view', 'invoice.view', 'ticket.create'] } },
      { action: 'UPDATE_CLIENT_ACCESS', res_type: 'dashboard_modules', desc: 'Enabled Support Desk module with ticket submit action for client portal', diff: { module: 'support', is_client_enabled: true } },
      { action: 'UPDATE_SETTINGS', res_type: 'system_settings', desc: 'Updated system security parameters and corporate branding', diff: { 'site.name': 'SysMaira Enterprise' } },
      { action: 'CREATE', res_type: 'projects', desc: 'Initialized Enterprise Cloud Modernization project', diff: { status: 'in_progress', budget: 85000 } },
      { action: 'CREATE', res_type: 'invoices', desc: 'Generated invoice INV-2026-0001 for Acme Corporation', diff: { total: 18500, status: 'paid' } },
      { action: 'UPDATE', res_type: 'invoices', desc: 'Recorded full wire payment for invoice INV-2026-0001', diff: { amount_due: 0, status: 'paid' } },
      { action: 'CREATE', res_type: 'tickets', desc: 'Received customer support ticket #1001 for high priority assistance', diff: { priority: 'high', category: 'technical' } },
      { action: 'ASSIGN_ROLE', res_type: 'user_roles', desc: 'Assigned Senior Project Manager role to staff member', diff: { role: 'manager' } },
      { action: 'UPLOAD_MEDIA', res_type: 'media', desc: 'Uploaded enterprise architecture blueprint asset', diff: { file: 'enterprise-architecture-blueprint.png', size_kb: 420 } },
      { action: 'TEST_EMAIL_SENT', res_type: 'system_settings', desc: 'Dispatched test SMTP delivery to administrator inbox', diff: { recipient: 'superadmin@company.com' } },
      { action: 'UPDATE_PROFILE', res_type: 'company_profile', desc: 'Refreshed corporate headquarters address and emergency contact lines', diff: { city: 'San Francisco' } },
      { action: 'CREATE', res_type: 'marketing_campaigns', desc: 'Scheduled Q4 Enterprise Innovation Newsletter dispatch', diff: { recipients: 1420 } },
      { action: 'CREATE', res_type: 'coupons', desc: 'Activated coupon ENTERPRISE2026 for high-value client engagements', diff: { code: 'ENTERPRISE2026', discount_percent: 15 } },
    ];

    // Seed 38 entries spaced across the last 14 days
    for (let i = 0; i < 38; i++) {
      const template = auditEvents[i % auditEvents.length];
      const hoursAgo = (i * 8) + 1;
      const logId = `d1000000-0000-0000-0000-${String(i + 1).padStart(12, '0')}`;

      await client.query(
        `INSERT INTO system_schema.audit_logs
           (id, actor_id, action, resource_type, resource_id, diff, ip_address, user_agent, metadata, created_at)
         VALUES
           ($1, $2, $3, $4, $5, $6::jsonb, '127.0.0.1'::inet, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) EnterpriseAgent/1.0', $7::jsonb, NOW() - ($8 || ' hours')::interval)`,
        [
          logId,
          adminUserId,
          template.action,
          template.res_type,
          adminUserId,
          JSON.stringify(template.diff),
          JSON.stringify({ description: template.desc, is_demo: true }),
          hoursAgo
        ]
      );
    }

    await client.query('COMMIT');
    console.log('------------------------------------------------------');
    console.log('✓ SUCCESS: Database seeded with realistic dummy data!');
    console.log(`  - Clients & Users: ${demoUsers.length} accounts configured with contacts & notes`);
    console.log(`  - Projects:        ${projectTemplates.length} projects seeded`);
    console.log(`  - Tasks:           ${taskTemplates.length} tasks seeded`);
    console.log(`  - Time Entries:    ${timeEntryCounter} time entries & 1 active timer seeded`);
    console.log(`  - Invoices:        ${invoiceSeeds.length} invoices seeded`);
    console.log(`  - Tickets:         ${ticketSeeds.length} support tickets seeded`);
    console.log(`  - CRM Leads:       ${leadIdx - 1} pipeline leads seeded with follow-ups & activities`);
    console.log(`  - Page Views:      ${pageViewInserts.length} analytics events seeded`);
    console.log('======================================================');

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ ERROR during database seeding:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// ── Safe Demo Data Reset ───────────────────────────────────────────
async function resetDemoData() {
  if (process.env.NODE_ENV === 'production') {
    console.error('CRITICAL: Resetting demo data is prohibited in production!');
    process.exit(1);
  }

  console.log('--- Cleaning Up Demo Records (Safe Reset) ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await client.query(`DELETE FROM analytics_schema.page_views WHERE utm_campaign = 'demo_seed'`);
    await client.query(`DELETE FROM support_schema.tickets WHERE metadata->>'is_demo' = 'true'`);
    await client.query(`DELETE FROM client_schema.time_entries WHERE metadata->>'is_demo' = 'true'`);
    await client.query(`DELETE FROM client_schema.tasks WHERE 'demo' = ANY(tags)`);
    await client.query(`DELETE FROM billing_schema.payments WHERE metadata->>'is_demo' = 'true'`);
    await client.query(`DELETE FROM billing_schema.invoices WHERE metadata->>'is_demo' = 'true'`);
    await client.query(`DELETE FROM client_schema.client_projects WHERE metadata->>'is_demo' = 'true'`);
    await client.query(`DELETE FROM crm_schema.lead_activities WHERE lead_id IN (SELECT id FROM crm_schema.leads WHERE metadata->>'is_demo' = 'true')`);
    await client.query(`DELETE FROM crm_schema.lead_notes WHERE lead_id IN (SELECT id FROM crm_schema.leads WHERE metadata->>'is_demo' = 'true')`);
    await client.query(`DELETE FROM crm_schema.leads WHERE metadata->>'is_demo' = 'true'`);
    await client.query(`DELETE FROM client_schema.client_notes WHERE client_id IN (SELECT id FROM client_schema.clients WHERE metadata->>'is_demo' = 'true')`);
    await client.query(`DELETE FROM client_schema.client_contacts WHERE client_id IN (SELECT id FROM client_schema.clients WHERE metadata->>'is_demo' = 'true')`);
    await client.query(`DELETE FROM client_schema.clients WHERE metadata->>'is_demo' = 'true' AND user_id != 'cb974b6f-0e8f-464f-8533-351c3099a94f'`);

    await client.query('COMMIT');
    console.log('✓ Demo data safely cleaned up without touching real users or Super Admin.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Demo reset failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

if (process.argv.includes('--reset')) {
  resetDemoData();
} else {
  seedData();
}

module.exports = { seedData, resetDemoData };
