const { Client } = require('../backend/node_modules/pg');

async function inspect() {
  const client = new Client({
    connectionString: 'postgresql://postgres:Admin123@localhost:5432/sysmaira'
  });
  await client.connect();

  const tables = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'portfolio_schema'
  `);
  console.log('Tables in portfolio_schema:', tables.rows.map(r => r.table_name));

  for (const t of tables.rows) {
    const cols = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'portfolio_schema' AND table_name = $1
    `, [t.table_name]);
    console.log(`\nColumns in ${t.table_name}:`, cols.rows.map(c => `${c.column_name} (${c.data_type})`).join(', '));
  }

  const projects = await client.query(`
    SELECT p.id, p.title, p.slug, p.client_name, p.is_featured, p.is_published, p.category_id,
           c.name as category_name, c.slug as category_slug
    FROM portfolio_schema.projects p
    LEFT JOIN portfolio_schema.categories c ON p.category_id = c.id
  `);
  console.log('\nProjects in database:');
  console.log(JSON.stringify(projects.rows, null, 2));

  const metrics = await client.query(`SELECT * FROM portfolio_schema.project_metrics`);
  console.log('\nMetrics count:', metrics.rows.length);

  const gallery = await client.query(`SELECT * FROM portfolio_schema.project_gallery`);
  console.log('\nGallery count:', gallery.rows.length);

  await client.end();
}

inspect().catch(console.error);

