const { Client } = require('../backend/node_modules/pg');

async function checkProjects() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Admin123@localhost:5432/sysmaira'
  });
  await client.connect();

  const res = await client.query(`
    SELECT p.id, p.title, p.slug, p.client_name, p.summary, p.tech_stack, p.is_featured, p.is_published,
           sc.name as category_name, sc.slug as category_slug
    FROM portfolio_schema.projects p
    LEFT JOIN cms_schema.service_categories sc ON p.category_id = sc.id
  `);
  console.log('Total projects in DB:', res.rows.length);
  res.rows.forEach((p, i) => {
    console.log(`\n[${i+1}] ${p.title} (${p.slug})`);
    console.log(`    Client: ${p.client_name} | Category: ${p.category_name} (${p.category_slug})`);
    console.log(`    Tech: ${(p.tech_stack || []).join(', ')} | Featured: ${p.is_featured} | Published: ${p.is_published}`);
  });

  const categories = await client.query(`SELECT id, name, slug FROM cms_schema.service_categories`);
  console.log('\nService Categories in DB:', categories.rows);

  await client.end();
}

checkProjects().catch(console.error);

