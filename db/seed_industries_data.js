const { Client } = require('../backend/node_modules/pg');

async function seedIndustries() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Admin123@localhost:5432/sysmaira'
  });
  await client.connect();

  console.log('--- Enhancing cms_schema.industries & Seeding Industry Data ---');

  // 1. Add rich columns if not present
  await client.query(`
    ALTER TABLE cms_schema.industries 
    ADD COLUMN IF NOT EXISTS challenges jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS solutions jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS deliverables jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS compliance_standards text[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS stats jsonb DEFAULT '{}'::jsonb;
  `);

  // 2. Define the 6 core industries
  const industries = [
    {
      slug: 'fintech-financial-services',
      name: 'Financial Services & FinTech',
      description: 'High-frequency transactional systems, algorithmic order execution, and low-latency settlement engines engineered for zero financial reconciliation loss.',
      icon: 'ShieldCheck',
      sort_order: 1,
      compliance_standards: ['SOC2 Type II', 'PCI-DSS Level 1', 'GLBA', 'FINRA Audit Trail'],
      stats: {
        metric_value: '$250M+',
        metric_label: 'Daily Transaction Volume Processed',
        sla: '99.999% ACID Consistency'
      },
      challenges: [
        'Concurrency deadlocks and execution bottlenecks during market open windows.',
        'Strict regulatory requirements for cryptographic audit trails and deterministic latency.',
        'Legacy monolithic banking systems unable to interface with modern WebSocket streams.'
      ],
      solutions: [
        'PostgreSQL range & hash partitioning with connection pooling and Redis distributed locks.',
        'Asynchronous event-driven Go and Node.js microservices with idempotency keys.',
        'Sub-120ms P95 global order routing with automated circuit-breakers.'
      ],
      deliverables: [
        'High-Frequency Transaction Settlement Gateway',
        'Cryptographic Real-Time Audit Ledger & Reporting Engine',
        'Institutional Trading Dashboard with WebSocket Live Books',
        'Disaster Recovery Multi-Region Automated Failover'
      ],
      project_slug: 'high-frequency-financial-settlement-gateway'
    },
    {
      slug: 'logistics-supply-chain',
      name: 'Logistics, Transportation & IoT',
      description: 'Real-time telemetry portals, dynamic route optimization engines, and asset-tracking architectures sustaining millions of concurrent sensor events.',
      icon: 'Truck',
      sort_order: 2,
      compliance_standards: ['ISO 27001', 'SOC2 Type II', 'GDPR Telemetry Guard'],
      stats: {
        metric_value: '50M+',
        metric_label: 'Daily GPS & Telemetry Events Ingested',
        sla: '99.995% Cluster Availability'
      },
      challenges: [
        'Massive message ingress from vehicular IoT beacons overwhelming relational databases.',
        'Real-time fleet route re-calculation required across unstable cellular networks.',
        'Siloed warehouse and dispatch systems creating operational blind spots.'
      ],
      solutions: [
        'TimescaleDB time-series partition routing with MQTT broker ingest.',
        'WebSocket bidirectional telemetry streaming with client-side offline reconciliation.',
        'Automated Kubernetes autoscaling on AWS EKS with horizontal pod replication.'
      ],
      deliverables: [
        'Real-Time Vehicle Dispatch & Global Telemetry Map Portal',
        'Dynamic Fuel & Route Optimization AI Pipeline',
        'Driver Mobile Web App with Resilient Offline Mode',
        'Automated Maintenance & Telemetry Alarm System'
      ],
      project_slug: 'global-fleet-dispatch-iot-telemetry-portal'
    },
    {
      slug: 'healthcare-life-sciences',
      name: 'Healthcare, Telehealth & Life Sciences',
      description: 'HIPAA-compliant patient portals, encrypted telehealth consultation platforms, and clinical diagnostic systems with automated EMR integrations.',
      icon: 'HeartPulse',
      sort_order: 3,
      compliance_standards: ['HIPAA Title II', 'HITECH', 'SOC2 Type II', 'FDA 21 CFR Part 11'],
      stats: {
        metric_value: '240k+',
        metric_label: 'Active Clinical Patients Onboarded',
        sla: '100% Cryptographic Audit Pass'
      },
      challenges: [
        'Strict BAA data isolation and patient record encryption mandates.',
        'High latency and jitter in video consultations during peak telehealth clinic hours.',
        'Complex HL7 / FHIR protocol bridges required for legacy hospital EMR databases.'
      ],
      solutions: [
        'End-to-end envelope encryption utilizing AWS KMS with immutable audit logs.',
        'WebRTC Selective Forwarding Units (SFU) delivering sub-200ms latency video.',
        'FHIR-compliant REST and GraphQL adapters for automated clinical intake.'
      ],
      deliverables: [
        'HIPAA-Compliant Patient Consultation & Scheduling Portal',
        'Encrypted Video Telehealth Engine with WebRTC SFU',
        'Electronic Medical Records (EMR) Synchronization Service',
        'Cryptographic Access Logging & Audit Verification Tool'
      ],
      project_slug: 'hipaa-compliant-telehealth-ecosystem'
    },
    {
      slug: 'ai-legaltech-knowledge',
      name: 'LegalTech, Compliance & Knowledge Systems',
      description: 'Private enterprise LLM pipelines, autonomous RAG retrieval systems, and semantic vector indexing engineered for strict corporate data sovereignty.',
      icon: 'Brain',
      sort_order: 4,
      compliance_standards: ['Air-Gapped VPC', 'SOC2 Type II', 'ISO 27001', 'Private LLM Guard'],
      stats: {
        metric_value: '14M+',
        metric_label: 'Legal Filings & Precedents Indexed',
        sla: '99.4% Verifiable Citation Accuracy'
      },
      challenges: [
        'Public cloud LLMs exposing confidential client documents to external training loops.',
        'High hallucination rates and inability to verify citations in regulatory proceedings.',
        'Keyword search failing to surface nuanced cross-jurisdiction legal precedents.'
      ],
      solutions: [
        'Private self-hosted vector databases using PostgreSQL pgvector in an isolated VPC.',
        'Hybrid dense-sparse retrieval combining vector similarity with BM25 keyword matching.',
        'Hallucination-free document attribution pipeline with verifiable paragraph citations.'
      ],
      deliverables: [
        'Private Enterprise Knowledge Retrieval (RAG) System',
        'Regulatory Filing Analyzer & Precedent Search Engine',
        'Autonomous Contract Clause Comparison Tool',
        'Air-Gapped LLM Inference Cluster Deployment'
      ],
      project_slug: 'enterprise-ai-rag-knowledge-engine'
    },
    {
      slug: 'enterprise-saas',
      name: 'Enterprise SaaS & Cloud Platforms',
      description: 'Multi-tenant cloud architectures, accessible design systems, and role-based operational portals designed for rapid international scale.',
      icon: 'Cloud',
      sort_order: 5,
      compliance_standards: ['WCAG 2.2 AA', 'SOC2 Type II', 'GDPR', 'Multi-Tenant RBAC'],
      stats: {
        metric_value: '3.8x',
        metric_label: 'Accelerated Front-End Feature Delivery',
        sla: '100% WCAG 2.2 AA Compliance'
      },
      challenges: [
        'Fragmented UI components across multinational teams causing high maintenance costs.',
        'Tenant data isolation risks and cross-tenant query leaks in high-load multi-tenant SaaS.',
        'Slow feature release cycles resulting from redundant code implementations.'
      ],
      solutions: [
        'Automated design token engine in Figma synced with a shared Next.js component system.',
        'Row-Level Security (RLS) and schema-isolated multi-tenant databases in PostgreSQL.',
        'Automated WCAG accessibility linting in GitHub Actions CI/CD pipelines.'
      ],
      deliverables: [
        'Multi-Tenant SaaS Foundation Architecture',
        'Token-Driven Enterprise UI/UX Design System',
        'Role-Based Access Control (RBAC) & Audit Dashboard',
        'Automated Component Documentation Library (Storybook)'
      ],
      project_slug: 'multi-tenant-design-system-financial-core'
    },
    {
      slug: 'retail-ecommerce',
      name: 'Omnichannel Retail & Global E-Commerce',
      description: 'High-throughput commerce event meshes, real-time inventory gateways, and global headless checkouts built to sustain holiday traffic surges.',
      icon: 'ShoppingBag',
      sort_order: 6,
      compliance_standards: ['PCI-DSS Level 1', 'SOC2 Type II', 'GDPR', 'Stripe Verified'],
      stats: {
        metric_value: '45k/min',
        metric_label: 'Peak Orders Processed Without Data Loss',
        sla: '< 78ms P99 API Response Latency'
      },
      challenges: [
        'Inventory desynchronization across 20+ distribution centers during flash sales.',
        'Third-party ERP integration timeouts causing dropped consumer checkout orders.',
        'Point-to-point spaghetti integrations failing under peak holiday load.'
      ],
      solutions: [
        'Idempotent Kafka-backed event mesh synchronizing warehouse inventory in real time.',
        'Redis distributed read-replicas handling product catalog views with sub-10ms response.',
        'Asynchronous Stripe webhook ingestion with automated retry dead-letter queues.'
      ],
      deliverables: [
        'Omnichannel Commerce API Gateway & Event Mesh',
        'Real-Time Multi-Warehouse Inventory Synchronizer',
        'High-Speed Headless Next.js Checkout Experience',
        'Resilient Payment Webhook Replay & Reconciliation Engine'
      ],
      project_slug: 'unified-omnichannel-api-gateway'
    }
  ];

  for (const ind of industries) {
    // 1. Insert or update industry
    const existing = await client.query('SELECT id FROM cms_schema.industries WHERE slug = $1', [ind.slug]);
    let industryId;

    if (existing.rows.length > 0) {
      industryId = existing.rows[0].id;
      await client.query(`
        UPDATE cms_schema.industries SET
          name = $1,
          description = $2,
          icon = $3,
          sort_order = $4,
          is_active = TRUE,
          challenges = $5::jsonb,
          solutions = $6::jsonb,
          deliverables = $7::jsonb,
          compliance_standards = $8,
          stats = $9::jsonb
        WHERE id = $10
      `, [
        ind.name, ind.description, ind.icon, ind.sort_order,
        JSON.stringify(ind.challenges), JSON.stringify(ind.solutions), JSON.stringify(ind.deliverables),
        ind.compliance_standards, JSON.stringify(ind.stats),
        industryId
      ]);
      console.log(`Updated industry: ${ind.name}`);
    } else {
      const insertRes = await client.query(`
        INSERT INTO cms_schema.industries (
          name, slug, description, icon, sort_order, is_active,
          challenges, solutions, deliverables, compliance_standards, stats
        ) VALUES (
          $1, $2, $3, $4, $5, TRUE, $6::jsonb, $7::jsonb, $8::jsonb, $9, $10::jsonb
        ) RETURNING id
      `, [
        ind.name, ind.slug, ind.description, ind.icon, ind.sort_order,
        JSON.stringify(ind.challenges), JSON.stringify(ind.solutions), JSON.stringify(ind.deliverables),
        ind.compliance_standards, JSON.stringify(ind.stats)
      ]);
      industryId = insertRes.rows[0].id;
      console.log(`Inserted industry: ${ind.name} (${industryId})`);
    }

    // 2. Link corresponding project in portfolio_schema.projects
    if (ind.project_slug) {
      const projUpdate = await client.query(`
        UPDATE portfolio_schema.projects
        SET industry_id = $1
        WHERE slug = $2
      `, [industryId, ind.project_slug]);
      if (projUpdate.rowCount > 0) {
        console.log(`  -> Linked case study '${ind.project_slug}' to industry '${ind.name}'`);
      }
    }
  }

  const finalCount = await client.query('SELECT COUNT(*) FROM cms_schema.industries WHERE is_active = TRUE');
  console.log(`\nSuccessfully enriched industries! Total active in DB: ${finalCount.rows[0].count}`);

  await client.end();
}

seedIndustries().catch(console.error);

