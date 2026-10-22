const { Client } = require('../backend/node_modules/pg');

async function seedBlog() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Admin123@localhost:5432/sysmaira'
  });
  await client.connect();

  console.log('--- Enhancing blog_schema & Seeding Editorial Articles ---');

  // 1. Add cover_image_url column if not present
  await client.query(`
    ALTER TABLE blog_schema.posts 
    ADD COLUMN IF NOT EXISTS cover_image_url text;
  `);

  // 2. Fetch categories
  const catRes = await client.query('SELECT id, slug FROM blog_schema.categories');
  const catMap = {};
  catRes.rows.forEach(c => { catMap[c.slug] = c.id; });
  console.log('Categories found:', Object.keys(catMap));

  // 3. Ensure tags exist
  const tagsToCreate = [
    { name: 'Distributed Systems', slug: 'distributed-systems' },
    { name: 'PostgreSQL', slug: 'postgresql' },
    { name: 'Design Systems', slug: 'design-systems' },
    { name: 'Cloud Architecture', slug: 'cloud-architecture' },
    { name: 'Next.js & Edge', slug: 'nextjs-edge' },
    { name: 'AI & Automation', slug: 'ai-automation' },
    { name: 'DevOps & SRE', slug: 'devops-sre' },
    { name: 'Compliance & SOC2', slug: 'compliance-soc2' }
  ];

  const tagMap = {};
  for (const t of tagsToCreate) {
    const res = await client.query(
      `INSERT INTO blog_schema.tags (name, slug) 
       VALUES ($1, $2) 
       ON CONFLICT (slug) DO UPDATE SET name=$1 
       RETURNING id, slug`,
      [t.name, t.slug]
    );
    tagMap[res.rows[0].slug] = res.rows[0].id;
  }
  console.log('Tags populated:', Object.keys(tagMap).length);

  // 4. Update primary author user profile
  await client.query(`
    UPDATE auth_schema.users 
    SET first_name = 'Elena',
        last_name = 'Rostova',
        avatar_url = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
        bio = 'Principal Distributed Systems Architect at SysMaira. Specializes in multi-region PostgreSQL clusters, event-driven architectures, and high-throughput financial settlements.'
    WHERE id = '478971d7-3014-42b1-a3c1-9a287bd32235';
  `);

  const authorId = '478971d7-3014-42b1-a3c1-9a287bd32235';

  // 5. Define rich editorial articles
  const articles = [
    {
      slug: 'building-resilient-distributed-systems',
      title: 'Building Resilient Distributed Systems with Micro-Frontends & Event Sourcing',
      category_slug: 'engineering-architecture',
      excerpt: 'How modern engineering organizations decouple legacy monoliths into distributed micro-frontends and event-sourced backends without sacrificing transactional consistency.',
      cover_image_url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=85',
      read_time_min: 8,
      view_count: 2480,
      like_count: 142,
      is_featured: true,
      status: 'published',
      published_at: new Date('2026-10-18T10:00:00Z'),
      tags: ['distributed-systems', 'cloud-architecture', 'nextjs-edge'],
      content: `
        <p class="lead-text">
          As enterprise engineering organizations grow past three hundred engineers, the traditional monolithic web application and centralized relational database inevitably become coordination bottlenecks. When twelve squads attempt to deploy to a shared codebase simultaneously, mean-time-to-recovery (MTTR) increases exponentially and regression risks skyrocket.
        </p>

        <h2>The Micro-Frontend Decoupling Paradigm</h2>
        <p>
          Micro-frontends decompose the presentation layer into autonomous, independently deployable client applications that collaborate seamlessly in the browser. However, naive implementations that stitch disparate iframes or load redundant copies of vendor dependencies degrade bundle size and ruin Core Web Vitals.
        </p>
        <p>
          At SysMaira, we leverage a unified <strong>Module Federation</strong> and Next.js multi-zone architectural contract. Under this model:
        </p>
        <ul>
          <li><strong>Autonomous Boundary:</strong> Each core business vertical (Checkout, Portfolio, CRM, Account Management) owns its dedicated build and release lifecycle.</li>
          <li><strong>Shared Design Token Layer:</strong> CSS design tokens, typography scales, and foundational atomic components are distributed via an immutable design system package.</li>
          <li><strong>Distributed Client Bus:</strong> Cross-application communication is strictly asynchronous, utilizing strongly typed CustomEvent contracts and session state cache keys.</li>
        </ul>

        <div class="callout-box">
          <div class="callout-title">Architectural Rule of Thumb</div>
          <p class="callout-body">
            Never allow micro-frontends to share direct database connections or mutate shared browser global objects. Communication must always pass through documented API contracts or message events.
          </p>
        </div>

        <h2>Event Sourcing for Immutable State Transitions</h2>
        <p>
          On the backend, replacing traditional CRUD state mutations with event sourcing preserves a complete, cryptographically verifiable ledger of every domain transition. Instead of mutating a row in a customer ledger table:
        </p>

        <pre><code class="language-typescript">// Domain Event Contract Example
interface SettlementTransferredEvent {
  eventId: string;
  aggregateId: string;
  eventType: 'PAYMENT_SETTLED_V2';
  timestamp: string;
  payload: {
    sourceAccount: string;
    targetAccount: string;
    amountCents: number;
    currency: 'USD';
    clearingHouse: 'FEDWIRE';
  };
  metadata: {
    actorId: string;
    clientIp: string;
    correlationId: string;
  };
}</code></pre>

        <h2>Zero-Data-Loss Projections with PostgreSQL & Kafka</h2>
        <p>
          Events are published to distributed Apache Kafka topics with idempotency keys, while read models are projected asynchronously into optimized PostgreSQL read replicas. If a projection requires rebuilding due to a schema enhancement, the entire event stream can be replayed in minutes without touching production live ingestion.
        </p>

        <h2>Key Takeaways for Enterprise Engineering Teams</h2>
        <ol>
          <li><strong>Separate Write Ingestion from Analytical Queries:</strong> Command Query Responsibility Segregation (CQRS) eliminates locking contention under heavy workloads.</li>
          <li><strong>Standardize Edge Routing:</strong> Route traffic at the CDN or reverse-proxy boundary to achieve sub-120ms initial byte delivery globally.</li>
          <li><strong>Automate Synthetic Contract Testing:</strong> Pact-driven consumer contract testing guarantees that frontend release cycles never break upstream schema expectations.</li>
        </ol>
      `
    },
    {
      slug: 'zero-downtime-postgresql-migrations',
      title: 'Zero-Downtime PostgreSQL Migrations for High-Traffic Workloads',
      category_slug: 'cloud-devops',
      excerpt: 'Battle-tested strategies for applying schema changes, composite foreign keys, and massive column backfills safely on production database clusters handling 10,000+ writes/second.',
      cover_image_url: 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?auto=format&fit=crop&w=1600&q=85',
      read_time_min: 10,
      view_count: 3820,
      like_count: 215,
      is_featured: true,
      status: 'published',
      published_at: new Date('2026-10-15T14:30:00Z'),
      tags: ['postgresql', 'devops-sre', 'cloud-architecture'],
      content: `
        <p class="lead-text">
          Running <code>ALTER TABLE ADD COLUMN</code> or <code>CREATE INDEX</code> on a production relational database with millions of active rows can instantly lock out concurrent web requests, spike connection pool queues, and cause catastrophic cascading outages across your distributed API fleet.
        </p>

        <h2>The Silent Killer: AccessExclusiveLock</h2>
        <p>
          In PostgreSQL, acquiring an <code>AccessExclusiveLock</code> blocks all other queries—including simple <code>SELECT</code> statements. If an analytical query is already running when your migration attempts to acquire an exclusive lock, every subsequent read and write request waits behind it in the queue until the database exhausts its maximum connection pool.
        </p>

        <div class="callout-box">
          <div class="callout-title">The Five Golden Rules of PostgreSQL Migrations</div>
          <ul>
            <li>Always set a strict <code>lock_timeout</code> (e.g. 2000ms) before executing DDL.</li>
            <li>Create indexes exclusively with <code>CREATE INDEX CONCURRENTLY</code>.</li>
            <li>Add columns as nullable first; never supply non-constant column defaults in legacy engines.</li>
            <li>Validate constraints in two phases: <code>NOT VALID</code> followed by <code>VALIDATE CONSTRAINT</code>.</li>
            <li>Perform massive data backfills in small, throttled batched background workers.</li>
          </ul>
        </div>

        <h2>Two-Phase Constraint Validation Pattern</h2>
        <p>
          When introducing a new foreign key or <code>CHECK</code> constraint on a 50-million row table, running standard validation will hold locks for several minutes while scanning every row. The safe two-phase approach avoids this:
        </p>

        <pre><code class="language-sql">-- Phase 1: Attach constraint instantly without table scan
ALTER TABLE orders_schema.line_items 
ADD CONSTRAINT check_positive_price 
CHECK (unit_price_cents > 0) NOT VALID;

-- Phase 2: Validate existing rows in background with ShareUpdateExclusiveLock
-- (Allows concurrent SELECT, INSERT, UPDATE, and DELETE operations)
ALTER TABLE orders_schema.line_items 
VALIDATE CONSTRAINT check_positive_price;</code></pre>

        <h2>Safe Column Renaming via Expand and Contract</h2>
        <p>
          Renaming a column directly in production will instantly break old application containers during rolling kubernetes deployments. Instead, follow the <strong>Expand / Contract</strong> pattern:
        </p>
        <ol>
          <li><strong>Expand:</strong> Add the new column alongside the legacy column. Use an automatic trigger to replicate writes between both columns.</li>
          <li><strong>Backfill:</strong> Run an asynchronous worker to copy historical values in 5,000-row chunks.</li>
          <li><strong>Migrate Code:</strong> Deploy application versions that write to both and read exclusively from the new column.</li>
          <li><strong>Contract:</strong> Drop the database trigger and safely deprecate the old column once all services are upgraded.</li>
        </ol>

        <h2>Conclusion</h2>
        <p>
          Zero-downtime database maintenance is not about luck; it is a discipline of strict timeout management, non-blocking lock acquisition, and multi-stage rolling cutovers.
        </p>
      `
    },
    {
      slug: 'atomic-design-systems-enterprise',
      title: 'Atomic Design Systems in Enterprise: From Tokens to Production Code',
      category_slug: 'design-systems',
      excerpt: 'Standardizing multi-brand typography, semantic color tokens, and strict component contracts across distributed cross-functional product squads.',
      cover_image_url: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=1600&q=85',
      read_time_min: 6,
      view_count: 1890,
      like_count: 98,
      is_featured: false,
      status: 'published',
      published_at: new Date('2026-10-12T09:15:00Z'),
      tags: ['design-systems', 'nextjs-edge'],
      content: `
        <p class="lead-text">
          Enterprise products often suffer from "design drift"—subtle inconsistencies in spacing, button borders, modal animations, and accessible color contrast that accumulate across disparate team codebases. A resilient Design System treats UI foundations as versioned software packages.
        </p>

        <h2>Design Tokens: The Single Source of Truth</h2>
        <p>
          Rather than hardcoding hexadecimal values or arbitrary Tailwind pixel classes across hundreds of components, tokens define UI values semantically:
        </p>

        <pre><code class="language-json">{
  "color": {
    "surface": {
      "primary": { "value": "{color.slate.950}", "type": "color" },
      "secondary": { "value": "{color.slate.900}", "type": "color" },
      "accent": { "value": "{color.cyan.400}", "type": "color" }
    },
    "interaction": {
      "focus-ring": { "value": "{color.cyan.500}", "type": "color" }
    }
  }
}</code></pre>

        <h2>Enforcing Strict TypeScript Component Contracts</h2>
        <p>
          Components must be open for extension but closed for arbitrary CSS overrides. Exposing a <code>variant</code> and <code>size</code> prop with exhaustive TypeScript union checks prevents engineers from inventing non-standard brand styling in pull requests.
        </p>

        <h2>Automating WCAG 2.2 AA Contrast Compliance</h2>
        <p>
          Every build in our CI pipeline runs automated accessibility audits using axe-core and Storybook visual regression testing, ensuring that dynamic dark-mode transitions always meet a minimum 4.5:1 contrast ratio for normal body text.
        </p>
      `
    },
    {
      slug: 'ai-agents-enterprise-operations-2026',
      title: 'AI Agents in Enterprise Operations: A Pragmatic Blueprint for 2026',
      category_slug: 'product-strategy',
      excerpt: 'Pragmatic implementation blueprints for integrating autonomous LLM agents into internal ticketing triage, automated code review, and developer self-service workflows.',
      cover_image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=85',
      read_time_min: 7,
      view_count: 2940,
      like_count: 167,
      is_featured: false,
      status: 'published',
      published_at: new Date('2026-10-10T16:45:00Z'),
      tags: ['ai-automation', 'distributed-systems', 'compliance-soc2'],
      content: `
        <p class="lead-text">
          While the initial hype around autonomous AI agents focused on open-ended chatbots, enterprise engineering leaders are finding genuine business value in constrained, deterministic agentic workflows: ticket triage, incident response synthesis, and automated compliance verification.
        </p>

        <h2>Constrained Tooling & Sandboxed Execution</h2>
        <p>
          An autonomous agent without strict permission boundaries is an unacceptable operational risk. In our enterprise implementations:
        </p>
        <ul>
          <li><strong>Read-Only First:</strong> Agents gather telemetry, inspect logs, and formulate hypotheses without mutation permissions.</li>
          <li><strong>Human-in-the-Loop Gateways:</strong> Destructive or mutating operations (deploying code, applying schema changes, sending customer communications) require explicit human approval via signed webhooks.</li>
          <li><strong>Vectorized Knowledge Graphs:</strong> RAG retrieval pipelines index internal architecture decision records (ADRs) with hybrid semantic and lexical keyword matching.</li>
        </ul>

        <h2>Deterministic Guardrails Over Raw Prompting</h2>
        <p>
          We employ Pydantic and JSON schema validation on all LLM tool calls. If an agent returns an invalid schema, the call is rejected immediately at the application gateway before executing any database or infrastructure side effects.
        </p>
      `
    },
    {
      slug: 'sub-120ms-edge-latency-nextjs-redis',
      title: 'Sub-120ms Edge Latency: Next.js 16 Server Components & Redis Cache Tiering',
      category_slug: 'engineering-architecture',
      excerpt: 'Architectural patterns for combining Next.js Server Components, streaming SSR, and multi-region Redis cluster replication for instantaneous global page loads.',
      cover_image_url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&q=85',
      read_time_min: 9,
      view_count: 2150,
      like_count: 138,
      is_featured: false,
      status: 'published',
      published_at: new Date('2026-10-08T11:20:00Z'),
      tags: ['nextjs-edge', 'cloud-architecture', 'devops-sre'],
      content: `
        <p class="lead-text">
          In high-volume B2B enterprise applications, every 100 milliseconds of latency directly degrades user conversion and operator efficiency. Delivering sub-120ms P95 response times across North America, Europe, and Asia-Pacific requires a tiered edge caching strategy.
        </p>

        <h2>Streaming SSR & React Suspense Boundaries</h2>
        <p>
          Rather than waiting for slow third-party API dependencies or complex aggregation queries before sending the initial HTML payload, Next.js 16 Server Components allow us to stream the critical document head, navigation shell, and hero content in under 40ms.
        </p>
        <p>
          Heavy data tables and real-time analytical charts stream into the client progressively within isolated Suspense boundaries, completely eliminating client-side layout shifts (CLS).
        </p>

        <h2>Distributed Redis Stale-While-Revalidate Caching</h2>
        <p>
          By pairing an edge Redis cluster with cryptographic cache-tag invalidation, database reads for catalog listings, blog articles, and team profiles drop from 60ms PostgreSQL network roundtrips to sub-4ms in-memory lookups.
        </p>
      `
    },
    {
      slug: 'enterprise-security-posture-zero-trust',
      title: 'Enterprise Security Posture: SOC2 Type II, HIPAA & Zero Trust in Modern Cloud Stacks',
      category_slug: 'cloud-devops',
      excerpt: 'Complete checklist and infrastructure-as-code automation for passing strict SOC2 Type II and HIPAA compliance audits without slowing engineering velocity.',
      cover_image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1600&q=85',
      read_time_min: 8,
      view_count: 1760,
      like_count: 112,
      is_featured: false,
      status: 'published',
      published_at: new Date('2026-10-05T08:00:00Z'),
      tags: ['compliance-soc2', 'cloud-architecture', 'devops-sre'],
      content: `
        <p class="lead-text">
          For enterprise SaaS and digital platform providers, security compliance is no longer a checklist deferred until enterprise procurement asks for a SOC2 report. It must be codified into your Terraform definitions and GitHub Actions deployment pipelines from day one.
        </p>

        <h2>Zero Trust Network Architecture (ZTNA)</h2>
        <p>
          Perimeter-based security (VPNs) is obsolete. Under Zero Trust principles, every service-to-service communication is mutually authenticated via mTLS with ephemeral certificates issued by HashiCorp Vault. No microservice implicitly trusts another simply because both reside within the same virtual private cloud (VPC).
        </p>

        <h2>Immutable Cryptographic Audit Logging</h2>
        <p>
          All administrative operations, CRM modifications, and sensitive financial data queries write append-only audit records to an isolated Amazon S3 bucket with Object Lock enabled in Compliance Mode. Once written, audit records cannot be altered or deleted by any administrative credential for a minimum of 7 years.
        </p>
      `
    }
  ];

  // 6. Insert / Update Articles
  for (const art of articles) {
    const catId = catMap[art.category_slug] || Object.values(catMap)[0];
    
    // Check if exists by slug
    const existing = await client.query('SELECT id FROM blog_schema.posts WHERE slug=$1', [art.slug]);
    let postId;

    if (existing.rows.length > 0) {
      postId = existing.rows[0].id;
      await client.query(`
        UPDATE blog_schema.posts
        SET title = $1,
            excerpt = $2,
            content = $3,
            category_id = $4,
            author_id = $5,
            cover_image_url = $6,
            read_time_min = $7,
            view_count = $8,
            like_count = $9,
            is_featured = $10,
            status = 'published'::post_status,
            published_at = $11,
            updated_at = NOW()
        WHERE id = $12
      `, [
        art.title,
        art.excerpt,
        art.content,
        catId,
        authorId,
        art.cover_image_url,
        art.read_time_min,
        art.view_count,
        art.like_count,
        art.is_featured,
        art.published_at,
        postId
      ]);
      console.log('Updated article:', art.slug);
    } else {
      const insRes = await client.query(`
        INSERT INTO blog_schema.posts (
          title, slug, excerpt, content, category_id, author_id,
          cover_image_url, read_time_min, view_count, like_count,
          is_featured, status, published_at, locale, metadata
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'published'::post_status, $12, 'en', '{}'::jsonb
        ) RETURNING id
      `, [
        art.title,
        art.slug,
        art.excerpt,
        art.content,
        catId,
        authorId,
        art.cover_image_url,
        art.read_time_min,
        art.view_count,
        art.like_count,
        art.is_featured,
        art.published_at
      ]);
      postId = insRes.rows[0].id;
      console.log('Inserted article:', art.slug);
    }

    // Link tags
    await client.query('DELETE FROM blog_schema.post_tags WHERE post_id=$1', [postId]);
    for (const tagSlug of art.tags) {
      const tagId = tagMap[tagSlug];
      if (tagId) {
        await client.query(
          'INSERT INTO blog_schema.post_tags (post_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [postId, tagId]
        );
      }
    }
  }

  // 7. Establish related posts relations
  const allPosts = await client.query("SELECT id, slug FROM blog_schema.posts WHERE status='published' AND deleted_at IS NULL");
  console.log('Total published posts:', allPosts.rows.length);

  for (let i = 0; i < allPosts.rows.length; i++) {
    const curPost = allPosts.rows[i];
    await client.query('DELETE FROM blog_schema.post_relations WHERE post_id=$1', [curPost.id]);

    // Relate to 2 other posts in round-robin fashion
    const rel1 = allPosts.rows[(i + 1) % allPosts.rows.length];
    const rel2 = allPosts.rows[(i + 2) % allPosts.rows.length];

    if (rel1 && rel1.id !== curPost.id) {
      await client.query(
        'INSERT INTO blog_schema.post_relations (post_id, related_post_id, sort_order) VALUES ($1, $2, 0) ON CONFLICT DO NOTHING',
        [curPost.id, rel1.id]
      );
    }
    if (rel2 && rel2.id !== curPost.id) {
      await client.query(
        'INSERT INTO blog_schema.post_relations (post_id, related_post_id, sort_order) VALUES ($1, $2, 1) ON CONFLICT DO NOTHING',
        [curPost.id, rel2.id]
      );
    }
  }

  await client.end();
  console.log('--- Blog Seed Completed Successfully ---');
}

seedBlog().catch(err => {
  console.error('Seed Error:', err);
  process.exit(1);
});
