import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type CreateStaticPageInput } from '../schema';
import { getStaticPages } from '../handlers/get_static_pages';

describe('getStaticPages', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no static pages exist', async () => {
    const result = await getStaticPages();
    expect(result).toEqual([]);
  });

  it('should fetch all static pages', async () => {
    // Create test static pages
    const testPages: CreateStaticPageInput[] = [
      {
        slug: 'about',
        title: 'About Us',
        content: 'About page content',
        seo_title: 'About Us - SEO Title',
        seo_description: 'About page description'
      },
      {
        slug: 'contact',
        title: 'Contact Us',
        content: 'Contact page content',
        seo_title: null,
        seo_description: null
      },
      {
        slug: 'privacy',
        title: 'Privacy Policy',
        content: 'Privacy policy content',
        seo_title: 'Privacy Policy',
        seo_description: 'Privacy policy description'
      }
    ];

    // Insert test pages
    for (const page of testPages) {
      await db.insert(staticPagesTable)
        .values({
          slug: page.slug,
          title: page.title,
          content: page.content,
          seo_title: page.seo_title,
          seo_description: page.seo_description
        })
        .execute();
    }

    const result = await getStaticPages();

    // Should return all pages
    expect(result).toHaveLength(3);

    // Verify basic properties
    expect(result[0].slug).toBeDefined();
    expect(result[0].title).toBeDefined();
    expect(result[0].content).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
    expect(result[0].updated_at).toBeInstanceOf(Date);
    expect(result[0].id).toBeDefined();
  });

  it('should return static pages ordered by slug', async () => {
    // Create test static pages with different slug order
    const testPages = [
      { slug: 'zzzz-last', title: 'Last Page', content: 'Last content' },
      { slug: 'aaaa-first', title: 'First Page', content: 'First content' },
      { slug: 'mmmm-middle', title: 'Middle Page', content: 'Middle content' }
    ];

    // Insert pages in random order
    for (const page of testPages) {
      await db.insert(staticPagesTable)
        .values({
          slug: page.slug,
          title: page.title,
          content: page.content,
          seo_title: null,
          seo_description: null
        })
        .execute();
    }

    const result = await getStaticPages();

    // Should be ordered by slug alphabetically
    expect(result).toHaveLength(3);
    expect(result[0].slug).toEqual('aaaa-first');
    expect(result[1].slug).toEqual('mmmm-middle');
    expect(result[2].slug).toEqual('zzzz-last');
  });

  it('should handle nullable fields correctly', async () => {
    // Create page with null values
    await db.insert(staticPagesTable)
      .values({
        slug: 'test-page',
        title: 'Test Page',
        content: 'Test content',
        seo_title: null,
        seo_description: null
      })
      .execute();

    const result = await getStaticPages();

    expect(result).toHaveLength(1);
    expect(result[0].slug).toEqual('test-page');
    expect(result[0].title).toEqual('Test Page');
    expect(result[0].content).toEqual('Test content');
    expect(result[0].seo_title).toBeNull();
    expect(result[0].seo_description).toBeNull();
  });

  it('should return pages with all required properties', async () => {
    // Create a comprehensive test page
    await db.insert(staticPagesTable)
      .values({
        slug: 'full-page',
        title: 'Full Page',
        content: 'Full page content with all fields',
        seo_title: 'SEO Title',
        seo_description: 'SEO Description'
      })
      .execute();

    const result = await getStaticPages();

    expect(result).toHaveLength(1);
    const page = result[0];

    // Verify all schema fields are present
    expect(page.id).toBeDefined();
    expect(typeof page.id).toBe('number');
    expect(page.slug).toEqual('full-page');
    expect(page.title).toEqual('Full Page');
    expect(page.content).toEqual('Full page content with all fields');
    expect(page.seo_title).toEqual('SEO Title');
    expect(page.seo_description).toEqual('SEO Description');
    expect(page.created_at).toBeInstanceOf(Date);
    expect(page.updated_at).toBeInstanceOf(Date);
  });
});