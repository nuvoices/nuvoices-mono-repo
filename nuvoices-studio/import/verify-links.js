const { chromium } = require('playwright');
const { client } = require('../sanity.cli');

async function verifyLinks() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    console.log('Fetching sample posts from Sanity...\n');

    // Fetch a few posts to test
    const posts = await client.fetch(`
      *[_type == "post"] | order(publishedAt desc)[0...10] {
        _id,
        title,
        slug,
        body[] {
          ...,
          markDefs[] {
            ...,
            _type == "link" => {
              href
            }
          }
        }
      }
    `);

    console.log(`Testing links in ${posts.length} posts...\n`);

    let totalLinks = 0;
    let brokenLinks = 0;
    const brokenLinksList = [];

    for (const post of posts) {
      console.log(`Checking: "${post.title}"`);

      // Extract links from body
      const links = [];
      if (post.body) {
        post.body.forEach(block => {
          if (block.markDefs) {
            block.markDefs.forEach(mark => {
              if (mark._type === 'link' && mark.href) {
                links.push(mark.href);
              }
            });
          }
        });
      }

      if (links.length === 0) {
        console.log(`  No links found\n`);
        continue;
      }

      console.log(`  Found ${links.length} link(s)`);

      // Test each link
      for (const link of links) {
        totalLinks++;

        // Skip internal links and anchors
        if (link.startsWith('/') || link.startsWith('#')) {
          console.log(`  ✓ ${link} (internal link, skipped)`);
          continue;
        }

        try {
          const response = await page.goto(link, {
            waitUntil: 'domcontentloaded',
            timeout: 10000
          });

          if (response.status() >= 400) {
            console.log(`  ✗ ${link} - HTTP ${response.status()}`);
            brokenLinks++;
            brokenLinksList.push({
              post: post.title,
              link: link,
              status: response.status()
            });
          } else {
            console.log(`  ✓ ${link} - HTTP ${response.status()}`);
          }
        } catch (error) {
          console.log(`  ✗ ${link} - Error: ${error.message}`);
          brokenLinks++;
          brokenLinksList.push({
            post: post.title,
            link: link,
            error: error.message
          });
        }
      }

      console.log('');
    }

    console.log('\n=== Summary ===');
    console.log(`Total links tested: ${totalLinks}`);
    console.log(`Working links: ${totalLinks - brokenLinks}`);
    console.log(`Broken links: ${brokenLinks}`);

    if (brokenLinks > 0) {
      console.log('\n=== Broken Links ===');
      brokenLinksList.forEach((item, index) => {
        console.log(`${index + 1}. Post: "${item.post}"`);
        console.log(`   Link: ${item.link}`);
        if (item.status) {
          console.log(`   Status: HTTP ${item.status}`);
        } else {
          console.log(`   Error: ${item.error}`);
        }
        console.log('');
      });
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

verifyLinks();
