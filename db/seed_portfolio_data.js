const { Client } = require('../backend/node_modules/pg');

async function seedPortfolio() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Admin123@localhost:5432/sysmaira'
  });
  await client.connect();

  console.log('--- Seeding & Enriching Portfolio Projects in PostgreSQL ---');

  // 1. Fetch category IDs from cms_schema.service_categories
  const catsRes = await client.query('SELECT id, slug FROM cms_schema.service_categories');
  const catMap = {};
  catsRes.rows.forEach(r => { catMap[r.slug] = r.id; });
  console.log('Available category slugs:', Object.keys(catMap));

  // 2. Define the 6 flagship enterprise case studies
  const projects = [
    {
      slug: 'high-frequency-financial-settlement-gateway',
      title: 'High-Frequency Financial Settlement Gateway',
      client_name: 'Apex Financial Services',
      category_slug: 'custom-software',
      summary: 'Architected and deployed an ultra-low-latency transaction settlement platform processing $250M+ daily volume with strict ACID compliance.',
      challenge: 'The legacy settlement pipeline suffered from concurrency bottlenecks, intermittent deadlock states during market open, and lacked real-time auditability for compliance regulators.',
      solution: 'Implemented PostgreSQL range and hash partitioning, Redis distributed lock managers, and an asynchronous event-driven Go microservices pipeline with circuit breakers and token-bucket rate limiting.',
      result: 'Decreased median settlement latency from 4.2 seconds to 120ms with 99.999% transaction consistency and zero failed reconciliations over 18 months.',
      tech_stack: ['PostgreSQL 18', 'Node.js', 'Go', 'Redis', 'Docker', 'WebSockets', 'Next.js 16'],
      tags: ['Fintech', 'High Concurrency', 'Low Latency', 'Distributed Systems'],
      budget_range: '$50,000 – $100,000',
      duration_weeks: 10,
      is_featured: true,
      display_order: 1,
      metrics: [
        { name: 'Median Settlement Latency', value: '120', suffix: 'ms', prefix: '', description: 'Down from 4.2 seconds (-97% latency reduction)' },
        { name: 'Daily Settlement Volume', value: '250', suffix: 'M+', prefix: '$', description: 'Processed daily across 4 global equity markets' },
        { name: 'Reconciliation Consistency', value: '99.999', suffix: '%', prefix: '', description: 'Zero financial reconciliations lost or corrupted' },
      ],
    },
    {
      slug: 'global-fleet-dispatch-iot-telemetry-portal',
      title: 'Global Fleet Dispatch & IoT Telemetry Portal',
      client_name: 'Global Logistics Hub',
      category_slug: 'cloud-devops',
      summary: 'Real-time telemetry and dispatch portal managing 12,000 active transport vehicles across 4 continents with sub-second route re-calculation.',
      challenge: 'High message ingress from vehicle IoT sensors (50 million pings per day) caused database connection exhaustion and dashboard freezes during peak business operating hours.',
      solution: 'Engineered Timescale partition routing, MQTT broker ingest, Redis pub/sub caching, and an automated multi-region Kubernetes cluster on AWS with horizontal pod autoscaling.',
      result: 'Maintained sub-second fleet visibility under 50,000 concurrent sensor streams with 99.995% uptime and automated fuel-route optimization saving $1.4M annually.',
      tech_stack: ['AWS EKS', 'Kubernetes', 'PostgreSQL', 'TimescaleDB', 'Node.js', 'WebSockets', 'Next.js', 'TailwindCSS'],
      tags: ['IoT', 'Cloud & DevOps', 'Logistics', 'Real-time Telemetry'],
      budget_range: '$75,000+',
      duration_weeks: 12,
      is_featured: true,
      display_order: 2,
      metrics: [
        { name: 'Daily Ingest Pings', value: '50', suffix: 'M+', prefix: '', description: 'Continuous sensor telemetry ingested without dropped frames' },
        { name: 'Cluster Availability', value: '99.995', suffix: '%', prefix: '', description: 'Multi-region failover across US-East and EU-Central' },
        { name: 'Annual Fuel Savings', value: '1.4', suffix: 'M', prefix: '$', description: 'Achieved via dynamic GPS dispatch re-routing' },
      ],
    },
    {
      slug: 'hipaa-compliant-telehealth-ecosystem',
      title: 'Next-Gen HIPAA-Compliant Telehealth Ecosystem',
      client_name: 'PulseHealth Systems',
      category_slug: 'saas-development',
      summary: 'Encrypted clinical consultation platform serving 240,000 active patients across 18 hospital networks with integrated electronic medical records (EMR).',
      challenge: 'Navigating stringent HIPAA Title II security controls, BAA multi-tenant isolation, and encrypted WebRTC video streaming while delivering instantaneous clinical record lookup.',
      solution: 'Architected end-to-end envelope encryption using AWS KMS, immutable audit logging with cryptographic hash chaining, and WebRTC Selective Forwarding Units (SFU).',
      result: 'Successfully onboarded 240,000 patients across 45 clinical specialties, reducing patient intake wait times from 35 minutes to under 4 minutes with zero security vulnerabilities.',
      tech_stack: ['Next.js 16', 'WebRTC', 'PostgreSQL', 'AWS KMS', 'Node.js', 'TailwindCSS', 'Docker'],
      tags: ['HealthTech', 'HIPAA Shield', 'WebRTC', 'Multi-Tenant SaaS'],
      budget_range: '$50,000 – $75,000',
      duration_weeks: 8,
      is_featured: false,
      display_order: 3,
      metrics: [
        { name: 'Active Patients Served', value: '240', suffix: 'k+', prefix: '', description: 'Registered across 18 regional hospital networks' },
        { name: 'Patient Wait Time', value: '4', suffix: 'min', prefix: '< ', description: 'Reduced from 35 minutes average clinic wait' },
        { name: 'HIPAA Audit Score', value: '100', suffix: '%', prefix: '', description: 'Clean third-party penetration and compliance certification' },
      ],
    },
    {
      slug: 'enterprise-ai-rag-knowledge-engine',
      title: 'Enterprise AI & RAG Knowledge Retrieval Pipeline',
      client_name: 'Veritas Intelligence Group',
      category_slug: 'ai-solutions',
      summary: 'Private enterprise LLM retrieval pipeline and semantic vector search engine indexing 14 million internal legal documents and regulatory filings.',
      challenge: 'Public cloud LLMs violated client privacy and internal data sovereignty. Existing keyword search failed to surface cross-jurisdiction legal precedents, causing weeks of research delays.',
      solution: 'Engineered a private self-hosted RAG pipeline using pgvector embeddings, hybrid dense-sparse search, and quantized open-weights models running inside an air-gapped VPC.',
      result: 'Cut regulatory research turnaround from 4 days to 3.2 seconds while achieving a 99.4% verifiable citation accuracy rate across multi-state legal corpuses.',
      tech_stack: ['PostgreSQL pgvector', 'Python', 'FastAPI', 'Next.js 16', 'Docker', 'Kubernetes', 'HuggingFace'],
      tags: ['AI Solutions', 'Private LLM', 'Vector Search', 'LegalTech'],
      budget_range: '$50,000 – $100,000',
      duration_weeks: 9,
      is_featured: true,
      display_order: 4,
      metrics: [
        { name: 'Documents Indexed', value: '14', suffix: 'M+', prefix: '', description: 'Precedent filings, contracts, and compliance rulings' },
        { name: 'Query Retrieval Time', value: '3.2', suffix: 's', prefix: '< ', description: 'Reduced from 4 hours of manual legal library research' },
        { name: 'Citation Accuracy', value: '99.4', suffix: '%', prefix: '', description: 'Hallucination-free contextual document attribution' },
      ],
    },
    {
      slug: 'multi-tenant-design-system-financial-core',
      title: 'Multi-Tenant Design System & Enterprise UI Architecture',
      client_name: 'Vanguard Global Capital',
      category_slug: 'enterprise-ui-ux',
      summary: 'Unified token-driven design system and accessible component architecture powering 12 multinational consumer and institutional fintech portals.',
      challenge: 'Inconsistent design across distributed international squads caused code duplication, brand drift, and failure to meet mandatory WCAG 2.2 AA accessibility mandates.',
      solution: 'Built an enterprise design system in Figma synced via GitHub Actions to an automated NPM package library with WCAG 2.2 AA accessibility test suites and multi-theme tokens.',
      result: 'Accelerated front-end sprint delivery by 3.8x, reduced CSS bundle sizes by 64%, and achieved 100% accessibility compliance across all 12 global web portals.',
      tech_stack: ['Figma Tokens', 'TailwindCSS', 'React', 'Storybook', 'TypeScript', 'Radix UI', 'Jest'],
      tags: ['Enterprise UI/UX', 'Design Systems', 'WCAG AA', 'Design Tokens'],
      budget_range: '$25,000 – $50,000',
      duration_weeks: 6,
      is_featured: false,
      display_order: 5,
      metrics: [
        { name: 'Feature Shipping Speed', value: '3.8', suffix: 'x', prefix: '', description: 'Faster sprint execution for engineering teams' },
        { name: 'Bundle Size Reduction', value: '64', suffix: '%', prefix: '-', description: 'Optimized via shared tree-shakeable components' },
        { name: 'Accessibility Compliance', value: '100', suffix: '%', prefix: '', description: 'Zero WCAG 2.2 AA violations in external audit' },
      ],
    },
    {
      slug: 'unified-omnichannel-api-gateway',
      title: 'Omnichannel Commerce API Gateway & Event Mesh',
      client_name: 'OmniRetail Worldwide',
      category_slug: 'api-integration',
      summary: 'High-throughput event-driven microservices API gateway synchronizing Shopify Plus, SAP ERP, Stripe Payments, and 24 fulfillment centers in real time.',
      challenge: 'Spaghetti point-to-point integrations caused inventory discrepancies, double-booking during flash sales, and complete checkout stalls during peak holiday periods.',
      solution: 'Architected an idempotent Kafka-backed API event mesh with Redis read caches, circuit breaker fallbacks, and webhook replay engines deployed across redundant Docker nodes.',
      result: 'Processed 45,000 orders per minute peak volume without a single dropped transaction or inventory discrepancy, reducing API response times to sub-80ms.',
      tech_stack: ['Node.js', 'PostgreSQL', 'Apache Kafka', 'Redis', 'Docker', 'Stripe API', 'GraphQL'],
      tags: ['API Integration', 'Microservices', 'Event-Driven', 'High Throughput'],
      budget_range: '$35,000 – $75,000',
      duration_weeks: 7,
      is_featured: false,
      display_order: 6,
      metrics: [
        { name: 'Peak Orders Throughput', value: '45,000', suffix: '/min', prefix: '', description: 'Handled during holiday peak without server strain' },
        { name: 'P99 API Latency', value: '78', suffix: 'ms', prefix: '< ', description: 'Sub-100ms response across distributed inventory hubs' },
        { name: 'Inventory Accuracy', value: '100', suffix: '%', prefix: '', description: 'Zero overselling or inventory sync discrepancies' },
      ],
    },
  ];

  for (const p of projects) {
    const categoryId = catMap[p.category_slug] || null;

    // Check if project exists
    const existing = await client.query('SELECT id FROM portfolio_schema.projects WHERE slug = $1', [p.slug]);
    let projectId;

    if (existing.rows.length > 0) {
      projectId = existing.rows[0].id;
      await client.query(`
        UPDATE portfolio_schema.projects SET
          title = $1,
          client_name = $2,
          category_id = $3,
          summary = $4,
          challenge = $5,
          solution = $6,
          result = $7,
          tech_stack = $8,
          tags = $9,
          budget_range = $10,
          duration_weeks = $11,
          is_featured = $12,
          is_published = TRUE,
          display_order = $13,
          updated_at = NOW()
        WHERE id = $14
      `, [
        p.title, p.client_name, categoryId, p.summary, p.challenge, p.solution, p.result,
        p.tech_stack, p.tags, p.budget_range, p.duration_weeks, p.is_featured, p.display_order,
        projectId
      ]);
      console.log(`Updated project: ${p.title}`);
    } else {
      const insertRes = await client.query(`
        INSERT INTO portfolio_schema.projects (
          title, slug, client_name, category_id, summary, challenge, solution, result,
          tech_stack, tags, budget_range, duration_weeks, is_featured, is_published, display_order
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, TRUE, $14
        ) RETURNING id
      `, [
        p.title, p.slug, p.client_name, categoryId, p.summary, p.challenge, p.solution, p.result,
        p.tech_stack, p.tags, p.budget_range, p.duration_weeks, p.is_featured, p.display_order
      ]);
      projectId = insertRes.rows[0].id;
      console.log(`Inserted new project: ${p.title} (${projectId})`);
    }

    // Insert or update project_metrics
    await client.query('DELETE FROM portfolio_schema.project_metrics WHERE project_id = $1', [projectId]);
    for (let i = 0; i < p.metrics.length; i++) {
      const m = p.metrics[i];
      await client.query(`
        INSERT INTO portfolio_schema.project_metrics (
          project_id, metric_name, value, prefix, suffix, description, sort_order
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [projectId, m.name, m.value, m.prefix, m.suffix, m.description, i + 1]);
    }
  }

  // Verify count
  const count = await client.query('SELECT COUNT(*) FROM portfolio_schema.projects WHERE is_published = TRUE');
  console.log(`\nSuccessfully enriched projects! Total published in DB: ${count.rows[0].count}`);

  const metricsCount = await client.query('SELECT COUNT(*) FROM portfolio_schema.project_metrics');
  console.log(`Total project metrics in DB: ${metricsCount.rows[0].count}`);

  await client.end();
}

seedPortfolio().catch(console.error);

