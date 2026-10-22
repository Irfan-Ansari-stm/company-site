const { Pool } = require('../backend/node_modules/pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sysmaira',
  user: 'postgres',
  password: 'Admin123'
});

async function seedServices() {
  console.log('--- Enriching Services Data in PostgreSQL ---');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Get Categories
    const catRes = await client.query('SELECT id, slug FROM cms_schema.service_categories');
    const catMap = {};
    catRes.rows.forEach(r => catMap[r.slug] = r.id);

    // Get Admin User
    const userRes = await client.query("SELECT id FROM auth_schema.users WHERE role = 'super_admin' LIMIT 1");
    const adminId = userRes.rows[0]?.id || null;

    const services = [
      {
        title: 'Enterprise Full-Stack Web Application Development',
        slug: 'enterprise-full-stack-web-apps',
        catSlug: 'custom-software',
        tagline: 'High-concurrency digital platforms engineered with Next.js 16, Node.js & PostgreSQL.',
        summary: 'Scalable Next.js and Node.js solutions engineered for high concurrency, enterprise security, and seamless developer experience.',
        description: 'We design and construct mission-critical web applications built for millions of concurrent users. From sophisticated role-based dashboards to customer-facing transaction portals, every solution is backed by clean TypeScript architectures, isolated relational schemas, automated testing suites, and containerized deployment manifests.',
        starting_price: 25000,
        currency: 'USD',
        duration_min: 6,
        duration_max: 10,
        is_featured: true,
        tech_stack: ['Next.js 16', 'TypeScript', 'Node.js', 'PostgreSQL 18', 'Redis', 'Docker', 'Tailwind CSS'],
        delivery_items: JSON.stringify([
          'Production-grade Next.js App Router codebase with strict TypeScript typing',
          'Normalized PostgreSQL relational schema with automated migration scripts',
          'JWT authentication, session management, and granular RBAC permission matrix',
          'Comprehensive Jest & Playwright integration and E2E test suites',
          'Docker container configurations and automated GitHub Actions CI/CD pipelines',
          'WCAG 2.2 AA accessibility audit report and zero-defect signoff'
        ]),
        process_steps: JSON.stringify([
          { step: '01', title: 'Architecture & Schema Mapping', desc: 'Define domain boundaries, database models, API contracts, and user roles.' },
          { step: '02', title: 'Sprint Implementation', desc: 'Two-week agile sprints with bi-weekly staging deployments and stakeholder demos.' },
          { step: '03', title: 'Security Hardening & QA', desc: 'Penetration testing, accessibility audits, and concurrency load benchmarking.' },
          { step: '04', title: 'Production Rollout & SLA', desc: 'Zero-downtime deployment, DNS migration, telemetry setup, and 30-day warranty.' }
        ]),
        faq_items: JSON.stringify([
          { q: 'What is the standard delivery timeline?', a: 'Core web application platforms are delivered in 6 to 10 weeks across structured two-week sprints.' },
          { q: 'Who owns the repository and code?', a: 'You retain 100% full intellectual property and source code ownership upon milestone delivery.' },
          { q: 'How is ongoing maintenance handled?', a: 'We provide SLA-backed maintenance retainers covering security updates, database tuning, and feature expansion.' }
        ]),
        features: [
          { title: 'Server-Rendered Velocity', description: 'Next.js 16 streaming server components delivering sub-second First Contentful Paint.', icon: 'Zap' },
          { title: 'PostgreSQL Relational Rigor', description: 'ACID-compliant transactions with partitioned schemas and connection pooling.', icon: 'Database' },
          { title: 'Enterprise RBAC Security', description: '55+ platform permissions with token rotation and immutable audit logging.', icon: 'ShieldCheck' },
          { title: 'Zero-Downtime CI/CD', description: 'Automated GitHub Actions pipelines deploying to Docker or Kubernetes.', icon: 'Cpu' }
        ],
        packages: [
          { name: 'Core Web Platform', slug: 'core-web-platform', description: 'Turnkey full-stack application with auth, CMS, and CRM integration.', price: 25000, billing_period: 'one-time', is_popular: true, features: JSON.stringify(['Custom Next.js Frontend', 'Express / Node.js API', 'PostgreSQL Schema & Migrations', 'Standard Admin Dashboard', '30-Day Launch Warranty']) },
          { name: 'Enterprise Scaled Edition', slug: 'enterprise-scaled-edition', description: 'High-availability multi-tenant platform with microservices.', price: 45000, billing_period: 'one-time', is_popular: false, features: JSON.stringify(['Multi-Region Deployment', 'Redis Distributed Caching', 'Custom Analytics Pipeline', 'SLA 99.99% Uptime Guarantee', 'Dedicated Technical Lead']) }
        ]
      },
      {
        title: 'Multi-Cloud Architecture & Kubernetes Modernization',
        slug: 'multi-cloud-architecture-kubernetes',
        catSlug: 'cloud-devops',
        tagline: 'Resilient cloud infrastructure, Terraform IaC, and zero-downtime Kubernetes deployments.',
        summary: 'End-to-end containerization, Terraform infrastructure-as-code, GitOps pipelines, and multi-region disaster recovery setups.',
        description: 'Modernize legacy infrastructure with cloud-native architectures designed for fault tolerance and cost efficiency. We architect AWS, GCP, and hybrid Kubernetes environments with automated autoscaling, multi-region failover, infrastructure-as-code (Terraform), and real-time observability pipelines (Prometheus & Grafana).',
        starting_price: 35000,
        currency: 'USD',
        duration_min: 8,
        duration_max: 12,
        is_featured: true,
        tech_stack: ['Kubernetes', 'Docker', 'Terraform', 'AWS', 'Google Cloud', 'Prometheus', 'Grafana', 'ArgoCD'],
        delivery_items: JSON.stringify([
          'Declarative Terraform IaC repositories for 100% reproducible environments',
          'Production Kubernetes cluster manifests with ingress controllers and cert-manager',
          'GitOps deployment pipelines with ArgoCD and automated canary releases',
          'Prometheus metrics, Grafana dashboards, and PagerDuty alert integrations',
          'Automated database backup replication and disaster recovery runbooks',
          'Cloud cost optimization audit delivering typical 25-40% compute savings'
        ]),
        process_steps: JSON.stringify([
          { step: '01', title: 'Infrastructure Audit', desc: 'Assess existing servers, network topologies, and egress/ingress bottlenecks.' },
          { step: '02', title: 'IaC & Staging Cluster', desc: 'Codify infrastructure with Terraform and configure staging Kubernetes pods.' },
          { step: '03', title: 'Canary Migration', desc: 'Shift traffic progressively with weighted DNS and zero production interruption.' },
          { step: '04', title: 'Observability & Runbooks', desc: 'Configure 24/7 alerting, chaos testing drills, and engineer handover sessions.' }
        ]),
        faq_items: JSON.stringify([
          { q: 'Which cloud providers do you support?', a: 'We specialize in AWS, Google Cloud Platform (GCP), Microsoft Azure, and bare-metal hybrid clusters.' },
          { q: 'Will migration cause system downtime?', a: 'Zero downtime. We employ blue/green and canary routing strategies to cut over traffic without packet loss.' }
        ]),
        features: [
          { title: 'Declarative Terraform IaC', description: 'Manage compute, VPCs, and storage safely via version-controlled code.', icon: 'Layers' },
          { title: 'Automated Horizontal Scaling', description: 'Scale pods instantly based on CPU, memory, or custom business metrics.', icon: 'TrendingUp' },
          { title: 'Multi-Region High Availability', description: 'Automated failover routes traffic seamlessly if a primary zone degrades.', icon: 'Globe' },
          { title: 'Real-Time Telemetry', description: 'Centralized log aggregation and tracing with OpenTelemetry and Grafana.', icon: 'Activity' }
        ],
        packages: [
          { name: 'Cloud Migration Sprint', slug: 'cloud-migration-sprint', description: 'Containerize monolithic services and deploy to managed Kubernetes.', price: 35000, billing_period: 'one-time', is_popular: true, features: JSON.stringify(['Dockerization of Core Services', 'EKS or GKE Cluster Setup', 'Terraform Infrastructure Code', 'CI/CD Pipeline Integration', 'Disaster Recovery Setup']) },
          { name: 'Multi-Region High-Availability', slug: 'multi-region-ha', description: 'Complete enterprise disaster-tolerant infrastructure.', price: 65000, billing_period: 'one-time', is_popular: false, features: JSON.stringify(['Active-Active Multi-Region', 'Global Traffic Management', 'Zero-Downtime Data Replication', 'Enterprise Security Hardening', '24/7 SRE Incident SLA']) }
        ]
      },
      {
        title: 'Enterprise Design Systems & Digital UX Audit',
        slug: 'enterprise-design-systems-ux-audit',
        catSlug: 'enterprise-ui-ux',
        tagline: 'Production component libraries, WCAG 2.2 AA accessibility, and Figma token synchronization.',
        summary: 'Comprehensive heuristic evaluation, WCAG 2.1 AA accessibility compliance, and production Figma-to-React component libraries.',
        description: 'Bridge the gap between design vision and frontend execution with an unified enterprise design system. We audit existing application interfaces, eliminate visual debt, enforce WCAG 2.2 AA compliance standards, and deliver production-ready React component libraries built on Tailwind CSS and Framer Motion with Storybook documentation.',
        starting_price: 15000,
        currency: 'USD',
        duration_min: 3,
        duration_max: 6,
        is_featured: false,
        tech_stack: ['Figma Tokens', 'Tailwind CSS v4', 'React 19', 'Framer Motion', 'Storybook', 'WCAG 2.2 AA'],
        delivery_items: JSON.stringify([
          'Master Figma UI kit synchronized with design token JSON repositories',
          'Modular, accessible React/TypeScript component library in Storybook',
          'WCAG 2.2 AA compliance audit certification with screen-reader verification',
          'Comprehensive design guidelines covering typography, color roles, and spacing',
          'Motion choreography guidelines with respect for prefers-reduced-motion',
          'Developer onboarding documentation and Figma-to-code workflow setup'
        ]),
        process_steps: JSON.stringify([
          { step: '01', title: 'Heuristic & Accessibility Audit', desc: 'Inspect existing screens for contrast, hierarchy, and usability friction.' },
          { step: '02', title: 'Token Architecture', desc: 'Define semantic design tokens across colors, typography, surfaces, and spacing.' },
          { step: '03', title: 'Component Engineering', desc: 'Build and test reusable React components with Storybook and automated visual diffs.' },
          { step: '04', title: 'System Handoff', desc: 'Integrate the component library into your repositories and train product teams.' }
        ]),
        faq_items: JSON.stringify([
          { q: 'Is the design system framework-agnostic?', a: 'While we specialize in React/Next.js and Tailwind CSS, our token definitions can be consumed by Vue, Angular, or iOS/Android design tokens.' },
          { q: 'How do you test accessibility?', a: 'We test with axe-core automated audits, keyboard navigation sweeps, and real screen readers (NVDA, VoiceOver).' }
        ]),
        features: [
          { title: 'Figma-to-Code Sync', description: 'Automated token pipelines syncing color, radius, and font updates to GitHub.', icon: 'Palette' },
          { title: 'WCAG 2.2 AA Certified', description: 'Guaranteed contrast, keyboard navigation, and aria attributes across every component.', icon: 'CheckCircle' },
          { title: 'Living Storybook Catalog', description: 'Interactive visual documentation of every component variant and state.', icon: 'Sparkles' },
          { title: 'Fluid Responsive Grids', description: 'Deliberate layouts engineered for seamless rendering on mobile, tablet, and 4K displays.', icon: 'Layers3' }
        ],
        packages: [
          { name: 'Design System Sprint', slug: 'design-system-sprint', description: 'Core component library and token architecture for fast-growing teams.', price: 15000, billing_period: 'one-time', is_popular: true, features: JSON.stringify(['Figma Token Architecture', '30+ Accessible React Components', 'Storybook Documentation', 'WCAG 2.2 AA Audit', 'Tailwind CSS Configuration']) },
          { name: 'Complete UI/UX Overhaul', slug: 'complete-ui-ux-overhaul', description: 'End-to-end redesign and engineering of complex enterprise software suites.', price: 32000, billing_period: 'one-time', is_popular: false, features: JSON.stringify(['Full Application Redesign', '60+ Production Components', 'User Testing & Heuristics', 'Design Token CI Automation', 'Team Training Workshops']) }
        ]
      },
      {
        title: 'Enterprise AI Solutions & RAG Knowledge Automation',
        slug: 'ai-solutions-rag-automation',
        catSlug: 'ai-solutions',
        tagline: 'Private LLM agents, retrieval-augmented generation (RAG), and workflow automation.',
        summary: 'Architect custom LLM pipelines, autonomous internal knowledge retrieval, and automated business workflows with strict data privacy.',
        description: 'Harness the transformative power of generative AI without exposing proprietary company data. We build secure retrieval-augmented generation (RAG) pipelines, domain-specific autonomous agents, and intelligent document processing workflows integrated directly into your existing PostgreSQL database and internal enterprise dashboard.',
        starting_price: 30000,
        currency: 'USD',
        duration_min: 6,
        duration_max: 8,
        is_featured: true,
        tech_stack: ['OpenAI / Anthropic', 'pgvector', 'LangChain', 'Python', 'FastAPI', 'Node.js', 'PostgreSQL'],
        delivery_items: JSON.stringify([
          'Private RAG pipeline using pgvector and high-dimensional semantic search',
          'Autonomous agent orchestrators for complex multi-step workflows',
          'Admin dashboard interface for prompt management, guardrails, and telemetry',
          'Automated data ingestion pipelines for PDFs, EMRs, contracts, and knowledge bases',
          'Strict data isolation ensuring zero customer data is used for model training',
          'Evaluation test harnesses measuring retrieval accuracy and hallucination rates'
        ]),
        process_steps: JSON.stringify([
          { step: '01', title: 'Data & Security Review', desc: 'Identify knowledge sources, compliance requirements, and privacy barriers.' },
          { step: '02', title: 'Vector Embeddings Setup', desc: 'Chunk and vectorize documents into pgvector tables with semantic indexes.' },
          { step: '03', title: 'Agent Engineering', desc: 'Build tool-calling agents, guardrails, and fallback handlers in FastAPI/Node.' },
          { step: '04', title: 'Dashboard Integration', desc: 'Connect AI agents to your internal dashboard with full usage analytics.' }
        ]),
        faq_items: JSON.stringify([
          { q: 'Is our corporate data safe from LLM training?', a: 'Yes. We utilize enterprise zero-data-retention APIs and self-hosted open models where data never leaves your VPC.' },
          { q: 'How do you prevent hallucinations?', a: 'We employ rigorous retrieval grounding with pgvector, strict system prompts, and deterministic validation stages.' }
        ]),
        features: [
          { title: 'pgvector Semantic Search', description: 'Lightning-fast hybrid vector search embedded natively in your PostgreSQL database.', icon: 'Brain' },
          { title: 'Tool-Calling Agents', description: 'Autonomous agents capable of executing SQL queries, calling APIs, and generating reports.', icon: 'Cpu' },
          { title: 'Air-Gapped & VPC Privacy', description: 'Deploy models securely within your own AWS/GCP boundary with zero external leakage.', icon: 'Lock' },
          { title: 'Real-Time Streaming UI', description: 'Smooth, token-by-token WebSocket and Server-Sent Event streaming interfaces.', icon: 'Zap' }
        ],
        packages: [
          { name: 'Enterprise RAG Pipeline', slug: 'enterprise-rag-pipeline', description: 'Intelligent document retrieval and conversational search over private data.', price: 30000, billing_period: 'one-time', is_popular: true, features: JSON.stringify(['pgvector Database Integration', 'Document Ingestion Workers', 'Conversational Assistant UI', 'Hallucination Guardrails', 'Usage & Token Analytics']) },
          { name: 'Autonomous Agent Platform', slug: 'autonomous-agent-platform', description: 'Multi-agent system that automates complex multi-step operational workflows.', price: 55000, billing_period: 'one-time', is_popular: false, features: JSON.stringify(['Custom Agent Swarms', 'ERP & CRM Tool Calling', 'Human-in-the-Loop Review', 'Air-Gapped VPC Deployment', '24/7 Monitoring & Fine-Tuning']) }
        ]
      },
      {
        title: 'Multi-Tenant SaaS Product Engineering',
        slug: 'saas-product-engineering',
        catSlug: 'saas-development',
        tagline: 'Turnkey SaaS platform architecture with subscription billing, tenant isolation, and RBAC.',
        summary: 'End-to-end B2B SaaS engineering from database schema tenancy to Stripe billing, team seats, and analytics.',
        description: 'Accelerate your SaaS time-to-market with an enterprise-ready foundation. We build multi-tenant SaaS platforms featuring schema-isolated database tenancy, automated Stripe and Razorpay subscription metering, team seat invitations, granular RBAC permissions, and comprehensive administration panels.',
        starting_price: 40000,
        currency: 'USD',
        duration_min: 8,
        duration_max: 12,
        is_featured: true,
        tech_stack: ['Next.js 16', 'PostgreSQL 18', 'Stripe Billing', 'Redis', 'WebSockets', 'Tailwind CSS'],
        delivery_items: JSON.stringify([
          'Multi-tenant architecture with tenant-isolated database routing',
          'Stripe Billing & Invoicing integration with webhooks and customer portal',
          'Team workspace management, seat assignments, and role permission guards',
          'Super-admin analytics dashboard with MRR, churn, and active usage metrics',
          'Transactional email automation via SendGrid/Postmark with custom templates',
          'Production security compliance audit and automated daily data snapshots'
        ]),
        process_steps: JSON.stringify([
          { step: '01', title: 'Product Scoping & Modeling', desc: 'Define monetization tiers, tenant isolation strategy, and core user workflows.' },
          { step: '02', title: 'Core Engine Build', desc: 'Implement multi-tenant auth, workspace switching, and billing webhooks.' },
          { step: '03', title: 'Feature Development', desc: 'Build the primary SaaS application value proposition in structured sprints.' },
          { step: '04', title: 'Beta & Public Launch', desc: 'Onboard pilot customers, gather feedback, and scale billing automation.' }
        ]),
        faq_items: JSON.stringify([
          { q: 'How is tenant data isolated?', a: 'We support row-level security (RLS) with tenant_id foreign keys or separate database schemas for strict enterprise compliance.' },
          { q: 'What billing models are supported?', a: 'Per-seat pricing, flat subscriptions, usage-based metering, and bespoke enterprise invoice billing.' }
        ]),
        features: [
          { title: 'Tenant Isolation Guarantee', description: 'Cryptographically segregated data access ensuring zero cross-tenant contamination.', icon: 'ShieldCheck' },
          { title: 'Stripe Billing Automation', description: 'Subscriptions, trials, proration, discounts, and customer billing portals out of the box.', icon: 'CreditCard' },
          { title: 'Team Workspaces', description: 'Invite teammates, manage permissions, and switch between multiple organizations.', icon: 'Users' },
          { title: 'Executive MRR Dashboard', description: 'Real-time visibility into revenue, churn, active users, and platform health.', icon: 'TrendingUp' }
        ],
        packages: [
          { name: 'MVP SaaS Foundation', slug: 'mvp-saas-foundation', description: 'Launch-ready SaaS platform built for rapid market validation.', price: 40000, billing_period: 'one-time', is_popular: true, features: JSON.stringify(['Multi-Tenant Architecture', 'Stripe Subscription Billing', 'Team Invites & Roles', 'Standard Admin Dashboard', 'Launch QA & Security Audit']) },
          { name: 'Enterprise Scale SaaS', slug: 'enterprise-scale-saas', description: 'High-volume platform with advanced enterprise features.', price: 70000, billing_period: 'one-time', is_popular: false, features: JSON.stringify(['Schema-Level Tenancy', 'SSO & SAML Integration', 'Audit Logging & Webhooks', 'Custom Domain Routing', 'Priority SLA & SRE Support']) }
        ]
      },
      {
        title: 'Event-Driven API Integration & Microservices',
        slug: 'api-integration-microservices',
        catSlug: 'api-integration',
        tagline: 'High-throughput REST, gRPC, and message queues connecting third-party systems.',
        summary: 'Connect disparate enterprise software, ERPs, CRMs, and payment gateways through resilient event-driven architectures.',
        description: 'Eliminate data silos across your organization. We engineer high-throughput API gateways and event-driven microservices pipelines using RabbitMQ, Kafka, Redis streams, and gRPC. We connect your web platform seamlessly to SAP, Salesforce, HubSpot, Stripe, and legacy internal databases with automated retry policies and dead-letter queues.',
        starting_price: 20000,
        currency: 'USD',
        duration_min: 4,
        duration_max: 8,
        is_featured: false,
        tech_stack: ['Go', 'Node.js', 'Redis Streams', 'RabbitMQ', 'PostgreSQL', 'Docker', 'OpenAPI'],
        delivery_items: JSON.stringify([
          'Unified API gateway with rate limiting, token authentication, and schema validation',
          'Bi-directional synchronization connectors for Salesforce, HubSpot, and ERPs',
          'Message broker cluster setup with automated failover and dead-letter queues',
          'Interactive OpenAPI (Swagger) documentation and Postman collections',
          'Real-time webhook ingestion engine with signature verification and idempotency',
          'Full distributed tracing and latency benchmarking reports'
        ]),
        process_steps: JSON.stringify([
          { step: '01', title: 'API & Protocol Discovery', desc: 'Catalog third-party APIs, authentication protocols, and sync frequencies.' },
          { step: '02', title: 'Contract & Pipeline Design', desc: 'Define OpenAPI schemas, idempotency keys, and queue buffering rules.' },
          { step: '03', title: 'Service Implementation', desc: 'Develop microservices in Go or Node.js with distributed tracing.' },
          { step: '04', title: 'Load Simulation & Sign-off', desc: 'Stress test endpoints under extreme message bursts and verify idempotency.' }
        ]),
        faq_items: JSON.stringify([
          { q: 'How do you handle API outages from external vendors?', a: 'We implement circuit breakers, asynchronous message queues, and exponential backoff retries to prevent data loss.' },
          { q: 'Is payload data encrypted during transit and rest?', a: 'Yes. All data uses TLS 1.3 in transit and AES-256 envelope encryption at rest.' }
        ]),
        features: [
          { title: 'Sub-Millisecond gRPC', description: 'Ultra-low-latency binary serialization for internal microservices communication.', icon: 'Zap' },
          { title: 'Idempotent Webhooks', description: 'Prevent duplicate transaction processing through cryptographic deduplication.', icon: 'CheckCircle' },
          { title: 'Resilient Dead-Letter Queues', description: 'Ensure zero message loss when third-party endpoints experience downtime.', icon: 'Layers' },
          { title: 'Unified Swagger Docs', description: 'Comprehensive interactive OpenAPI specifications for internal engineering teams.', icon: 'FileText' }
        ],
        packages: [
          { name: 'Core API Integration', slug: 'core-api-integration', description: 'Connect up to 4 major third-party platforms with automated sync.', price: 20000, billing_period: 'one-time', is_popular: true, features: JSON.stringify(['API Gateway Setup', '4 Third-Party Connectors', 'Webhook Ingestion Engine', 'Swagger Documentation', 'Logging & Error Monitoring']) },
          { name: 'Enterprise Event Pipeline', slug: 'enterprise-event-pipeline', description: 'Distributed message broker pipeline for massive data throughput.', price: 42000, billing_period: 'one-time', is_popular: false, features: JSON.stringify(['RabbitMQ/Kafka Cluster', 'Unlimited Data Connectors', 'Distributed Tracing', 'Dead-Letter Queue Alerts', 'High-Concurrency Tuning']) }
        ]
      }
    ];

    for (const s of services) {
      const catId = catMap[s.catSlug] || null;
      const res = await client.query(
        `INSERT INTO cms_schema.services
           (title, slug, tagline, summary, description, category_id, starting_price, currency,
            duration_min, duration_max, is_featured, is_active, tech_stack, delivery_items, process_steps, faq_items, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, TRUE, $12, $13::jsonb, $14::jsonb, $15::jsonb, $16)
         ON CONFLICT (slug) DO UPDATE
           SET title = EXCLUDED.title,
               tagline = EXCLUDED.tagline,
               summary = EXCLUDED.summary,
               description = EXCLUDED.description,
               category_id = EXCLUDED.category_id,
               starting_price = EXCLUDED.starting_price,
               currency = EXCLUDED.currency,
               duration_min = EXCLUDED.duration_min,
               duration_max = EXCLUDED.duration_max,
               is_featured = EXCLUDED.is_featured,
               is_active = TRUE,
               tech_stack = EXCLUDED.tech_stack,
               delivery_items = EXCLUDED.delivery_items,
               process_steps = EXCLUDED.process_steps,
               faq_items = EXCLUDED.faq_items
         RETURNING id`,
        [s.title, s.slug, s.tagline, s.summary, s.description, catId, s.starting_price, s.currency,
         s.duration_min, s.duration_max, s.is_featured, s.tech_stack, s.delivery_items, s.process_steps, s.faq_items, adminId]
      );

      const serviceId = res.rows[0].id;

      // Seed Features
      await client.query('DELETE FROM cms_schema.service_features WHERE service_id = $1', [serviceId]);
      for (let i = 0; i < s.features.length; i++) {
        const f = s.features[i];
        await client.query(
          `INSERT INTO cms_schema.service_features (service_id, title, description, icon, sort_order)
           VALUES ($1, $2, $3, $4, $5)`,
          [serviceId, f.title, f.description, f.icon, i]
        );
      }

      // Seed Packages
      await client.query('DELETE FROM cms_schema.service_packages WHERE service_id = $1', [serviceId]);
      for (let j = 0; j < s.packages.length; j++) {
        const p = s.packages[j];
        await client.query(
          `INSERT INTO cms_schema.service_packages
             (service_id, name, slug, description, price, currency, billing_period, features, is_popular, is_active, sort_order)
           VALUES ($1, $2, $3, $4, $5, 'USD', $6, $7::jsonb, $8, TRUE, $9)`,
          [serviceId, p.name, p.slug, p.description, p.price, p.billing_period, p.features, p.is_popular, j]
        );
      }
    }

    await client.query('COMMIT');
    console.log('✓ Successfully enriched all 6 enterprise services, packages, and features in PostgreSQL!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('✗ Seeding services failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedServices();

