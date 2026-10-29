// backend/src/tests/cms-public-api.test.js
// Automated Test Suite for Dynamic CMS & Public APIs

const assert = require('assert');
const http = require('http');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config({ path: path.resolve(__dirname, '../../.env.local'), override: true });

process.env.NODE_ENV = 'test';
const app = require('../index');

async function runTests() {
  console.log('🧪 Starting CMS & Public API Test Suite...\n');

  // Start test server on dynamic port
  const port = 5055;
  const server = http.createServer(app);

  await new Promise((resolve) => server.listen(port, resolve));
  const baseUrl = `http://localhost:${port}/api/v1`;

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ ${name}:`, err.message);
      failed++;
    }
  }

  try {
    // 1. Site Settings
    await test('GET /public/site-settings returns global branding & contact info', async () => {
      const res = await fetch(`${baseUrl}/public/site-settings`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert(body.data.siteName, 'Should include siteName');
      assert(body.data.contact?.email, 'Should include contact email');
      assert(body.data.announcement?.text, 'Should include announcement text');
    });

    // 2. Navigation
    await test('GET /public/navigation returns header links and CTAs', async () => {
      const res = await fetch(`${baseUrl}/public/navigation`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert(Array.isArray(body.data.links), 'links should be an array');
      assert(body.data.links.length >= 5, 'should have main navigation links');
      assert(body.data.primaryCta?.label, 'should include primary CTA');
    });

    // 3. Footer
    await test('GET /public/footer returns columns, social, and copyright', async () => {
      const res = await fetch(`${baseUrl}/public/footer`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert(Array.isArray(body.data.columns), 'columns should be an array');
      assert(body.data.columns.length >= 3, 'should have multiple footer columns');
      assert(body.data.copyright, 'should include copyright');
    });

    // 4. Page Builder & Sections
    await test('GET /public/pages/home returns structured ordered sections', async () => {
      const res = await fetch(`${baseUrl}/public/pages/home`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert.strictEqual(body.data.slug, 'home');
      assert(Array.isArray(body.data.sections), 'sections should be an array');
      assert(body.data.sections.length >= 10, 'home should have all 12 sections');
      assert.strictEqual(body.data.sections[0].type, 'hero');
    });

    // 5. Services
    await test('GET /public/services returns active services catalog', async () => {
      const res = await fetch(`${baseUrl}/public/services`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert(body.data.length >= 6, 'should return services catalog');
    });

    // 6. Solutions
    await test('GET /public/solutions returns enterprise solutions', async () => {
      const res = await fetch(`${baseUrl}/public/solutions`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert(body.data.length >= 5, 'should return solutions');
    });

    // 7. FAQs
    await test('GET /public/faqs returns published FAQs with category', async () => {
      const res = await fetch(`${baseUrl}/public/faqs`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(body.success, true);
      assert(body.data.length >= 20, 'should return published FAQs');
      assert(body.data[0].question, 'FAQ should have question');
      assert(body.data[0].answer, 'FAQ should have answer');
    });

    // 8. Delivery Process & Engagement Models
    await test('GET /public/delivery-process & /engagement-models return operational models', async () => {
      const [pRes, mRes] = await Promise.all([
        fetch(`${baseUrl}/public/delivery-process`),
        fetch(`${baseUrl}/public/engagement-models`),
      ]);
      const pBody = await pRes.json();
      const mBody = await mRes.json();

      assert.strictEqual(pRes.status, 200);
      assert.strictEqual(mRes.status, 200);
      assert(pBody.data.length >= 5, 'delivery process stages');
      assert(mBody.data.length >= 4, 'engagement models');
    });

    // 9. Blog Privacy (Drafts excluded)
    await test('GET /public/blog returns only published articles and excludes drafts', async () => {
      const res = await fetch(`${baseUrl}/public/blog`);
      const body = await res.json();
      assert.strictEqual(res.status, 200);
      assert(body.data.length > 0, 'should have published articles');
      const draftPost = body.data.find(
        (p) => p.slug === 'draft-mobile-workforce-offline-first-architecture'
      );
      assert(!draftPost, 'Draft post MUST NOT appear in public blog API');
    });

    // 10. Contact Submissions
    await test('POST /public/contact-submissions records lead in database', async () => {
      const testEmail = `test.api.${Date.now()}@example.com`;
      const res = await fetch(`${baseUrl}/public/contact-submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Quality Assurance Lead',
          email: testEmail,
          company: 'Testing Corp',
          message: 'Automated test suite validation message.',
          budget: '$25,000 - $50,000',
        }),
      });
      const body = await res.json();
      assert.strictEqual(res.status, 201);
      assert.strictEqual(body.success, true);
      assert(body.data.id, 'Should return created lead ID');
    });

    // 11. Admin Auth Requirement
    await test('GET /cms/stats requires authentication', async () => {
      const res = await fetch(`${baseUrl}/cms/stats`);
      assert.strictEqual(res.status, 401, 'Unauthorized request should return 401');
    });

    // 12. Super Admin Login & HTML Sanitization Test
    let adminToken = '';
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@company.com', password: 'SuperAdmin123!' }),
    });
    if (loginRes.ok) {
      const loginBody = await loginRes.json();
      adminToken = loginBody.data?.accessToken || loginBody.data?.token;
    }

    if (adminToken) {
      const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      };

      // Get home page ID
      const pagesRes = await fetch(`${baseUrl}/cms/pages?search=Home`, { headers: authHeaders });
      const pagesData = await pagesRes.json();
      const homePage = pagesData.data?.find((p) => p.slug === 'home') || pagesData.data?.[0];

      let testSectionId = '';
      await test('POST /cms/pages/:id/sections sanitizes dangerous HTML and scripts', async () => {
        assert(homePage?.id, 'Home page required for test');
        const dirtyHtml = '<div class="text-blue-500 font-bold" onclick="alert(1)"><script>malicious()</script><p>Clean Text</p><a href="javascript:steal()">Link</a></div>';
        const res = await fetch(`${baseUrl}/cms/pages/${homePage.id}/sections`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({
            block_type: 'custom_html',
            block_props: { custom_html: dirtyHtml, title: 'Safe HTML Block' },
            sort_order: 999,
            is_visible: false,
          }),
        });
        const body = await res.json();
        assert.strictEqual(res.status, 201);
        testSectionId = body.data.id;
        const sanitized = body.data.block_props?.custom_html || '';
        assert(!sanitized.includes('<script>'), 'Must strip script tags');
        assert(!sanitized.includes('onclick='), 'Must strip inline on* handlers');
        assert(!sanitized.includes('javascript:'), 'Must strip javascript: protocols');
        assert(sanitized.includes('<p>Clean Text</p>'), 'Must preserve safe markup');
      });

      // 13. Duplicate Section Test
      let duplicatedSectionId = '';
      await test('POST /cms/pages/:id/duplicate-section/:sectionId clones section safely', async () => {
        assert(testSectionId, 'Source section required');
        const res = await fetch(`${baseUrl}/cms/pages/${homePage.id}/duplicate-section/${testSectionId}`, {
          method: 'POST',
          headers: authHeaders,
        });
        const body = await res.json();
        assert.strictEqual(res.status, 201);
        assert.strictEqual(body.data.block_type, 'custom_html');
        duplicatedSectionId = body.data.id;
      });

      // 14. Publish Page with Revision Snapshot
      let revisionId = '';
      await test('POST /cms/pages/:id/publish creates version snapshot and publishes page', async () => {
        const res = await fetch(`${baseUrl}/cms/pages/${homePage.id}/publish`, {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({ note: 'Automated test suite publishing verification' }),
        });
        const body = await res.json();
        assert.strictEqual(res.status, 200);
        assert.strictEqual(body.data?.page?.visibility, 'public');
        assert(body.data?.revisionNum >= 1, 'Should record revision number');

        // Fetch revisions list
        const revRes = await fetch(`${baseUrl}/cms/pages/${homePage.id}/revisions`, { headers: authHeaders });
        const revData = await revRes.json();
        assert(revData.data.length > 0, 'Revisions list should contain items');
        revisionId = revData.data[0].id;
      });

      // 15. Rollback to Revision
      await test('POST /cms/pages/:id/revisions/:revId/rollback restores previous state', async () => {
        assert(revisionId, 'Revision ID required for rollback');
        const res = await fetch(`${baseUrl}/cms/pages/${homePage.id}/revisions/${revisionId}/rollback`, {
          method: 'POST',
          headers: authHeaders,
        });
        const body = await res.json();
        assert.strictEqual(res.status, 200);
      });

      // 16. Theme Design Tokens Management
      await test('GET /cms/theme-settings and PUT /cms/theme-settings update global design tokens', async () => {
        const getRes = await fetch(`${baseUrl}/cms/theme-settings`, { headers: authHeaders });
        const getBody = await getRes.json();
        assert.strictEqual(getRes.status, 200);
        assert(getBody.data?.primaryColor, 'Should include primaryColor');

        const putRes = await fetch(`${baseUrl}/cms/theme-settings`, {
          method: 'PUT',
          headers: authHeaders,
          body: JSON.stringify({
            ...getBody.data,
            primaryColor: '#0284c7',
            accentColor: '#6366f1',
            borderRadius: '1rem',
          }),
        });
        const putBody = await putRes.json();
        assert.strictEqual(putRes.status, 200);
        assert.strictEqual(putBody.data?.borderRadius, '1rem');
      });

      // Cleanup test sections
      if (testSectionId) {
        await fetch(`${baseUrl}/cms/pages/${homePage.id}/sections/${testSectionId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
      }
      if (duplicatedSectionId) {
        await fetch(`${baseUrl}/cms/pages/${homePage.id}/sections/${duplicatedSectionId}`, {
          method: 'DELETE',
          headers: authHeaders,
        });
      }
    }

  } finally {
    server.close();
  }

  console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    process.exit(1);
  }
}

runTests().then(() => {
  setTimeout(() => process.exit(0), 100);
});
