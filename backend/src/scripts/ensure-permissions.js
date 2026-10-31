require('dotenv').config();
const { query } = require('../config/database');

async function ensurePermissions() {
  const permsToEnsure = [
    { name: 'Manage Marketing', slug: 'marketing.manage', module: 'marketing', action: 'manage' },
    { name: 'Manage HR', slug: 'hr.manage', module: 'careers', action: 'manage' },
    { name: 'Edit Invoice', slug: 'invoice.edit', module: 'billing', action: 'edit' },
    { name: 'Delete Invoice', slug: 'invoice.delete', module: 'billing', action: 'delete' },
    { name: 'Create Payment', slug: 'payment.create', module: 'billing', action: 'create' },
    { name: 'Read Payment', slug: 'payment.read', module: 'billing', action: 'read' },
    { name: 'Read Finance', slug: 'finance.read', module: 'billing', action: 'read' },
    { name: 'Create Client', slug: 'client.create', module: 'clients', action: 'create' },
    { name: 'Edit Client', slug: 'client.edit', module: 'clients', action: 'edit' },
    { name: 'Delete Client', slug: 'client.delete', module: 'clients', action: 'delete' },
    { name: 'Manage Tickets', slug: 'ticket.manage', module: 'support', action: 'manage' },
    { name: 'Create Ticket', slug: 'ticket.create', module: 'support', action: 'create' },
    { name: 'Delete Ticket', slug: 'ticket.delete', module: 'support', action: 'delete' }
  ];

  for (const p of permsToEnsure) {
    await query(
      `INSERT INTO auth_schema.permissions (name, slug, module, action)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (slug) DO NOTHING`,
      [p.name, p.slug, p.module, p.action]
    );
  }

  const adminRole = await query(`SELECT id FROM auth_schema.roles WHERE name = 'Admin'`);
  if (adminRole.rows.length) {
    const roleId = adminRole.rows[0].id;
    for (const p of permsToEnsure) {
      const pRow = await query(`SELECT id FROM auth_schema.permissions WHERE slug = $1`, [p.slug]);
      if (pRow.rows.length) {
        await query(
          `INSERT INTO auth_schema.role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT DO NOTHING`,
          [roleId, pRow.rows[0].id]
        );
      }
    }
  }

  console.log('✅ Permissions ensured and granted to Admin role.');
  process.exit(0);
}

ensurePermissions().catch(err => {
  console.error('Failed to ensure permissions:', err);
  process.exit(1);
});

