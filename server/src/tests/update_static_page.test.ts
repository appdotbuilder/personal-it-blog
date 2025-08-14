import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type UpdateStaticPageInput, type CreateStaticPageInput } from '../schema';
import { updateStaticPage } from '../handlers/update_static_page';
import { eq } from 'drizzle-orm';

// Helper function to create a test static page
const createTestStaticPage = async (): Promise<number> => {
  const testPage: CreateStaticPageInput = {
    slug: 'test-page',
    title: 'Test Page',
    content: 'Test content for the page',
    seo_title: 'Test SEO Title',
    seo_description: 'Test SEO description'
  };

  const result = await db.insert(staticPagesTable)
    .values({
      ...testPage,
      created_at: new Date(),
      updated_at: new Date()
    })
    .returning()
    .execute();

  return result[0].id;
};

describe('updateStaticPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should update a static page with all fields', async () => {
    const pageId = await createTestStaticPage();

    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      slug: 'updated-test-page',
      title: 'Updated Test Page',
      content: 'Updated test content for the page',
      seo_title: 'Updated Test SEO Title',
      seo_description: 'Updated test SEO description'
    };

    const result = await updateStaticPage(updateInput);

    expect(result.id).toEqual(pageId);
    expect(result.slug).toEqual('updated-test-page');
    expect(result.title).toEqual('Updated Test Page');
    expect(result.content).toEqual('Updated test content for the page');
    expect(result.seo_title).toEqual('Updated Test SEO Title');
    expect(result.seo_description).toEqual('Updated test SEO description');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    expect(result.updated_at > result.created_at).toBe(true);
  });

  it('should update a static page with partial fields', async () => {
    const pageId = await createTestStaticPage();

    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      title: 'Partially Updated Title',
      content: 'Partially updated content'
    };

    const result = await updateStaticPage(updateInput);

    expect(result.id).toEqual(pageId);
    expect(result.slug).toEqual('test-page'); // Should remain unchanged
    expect(result.title).toEqual('Partially Updated Title');
    expect(result.content).toEqual('Partially updated content');
    expect(result.seo_title).toEqual('Test SEO Title'); // Should remain unchanged
    expect(result.seo_description).toEqual('Test SEO description'); // Should remain unchanged
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should update null fields correctly', async () => {
    const pageId = await createTestStaticPage();

    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      seo_title: null,
      seo_description: null
    };

    const result = await updateStaticPage(updateInput);

    expect(result.id).toEqual(pageId);
    expect(result.slug).toEqual('test-page'); // Should remain unchanged
    expect(result.title).toEqual('Test Page'); // Should remain unchanged
    expect(result.content).toEqual('Test content for the page'); // Should remain unchanged
    expect(result.seo_title).toBeNull();
    expect(result.seo_description).toBeNull();
  });

  it('should save updated static page to database', async () => {
    const pageId = await createTestStaticPage();

    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      title: 'Database Updated Title',
      slug: 'database-updated-slug'
    };

    await updateStaticPage(updateInput);

    // Verify the update was saved to database
    const pages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, pageId))
      .execute();

    expect(pages).toHaveLength(1);
    expect(pages[0].title).toEqual('Database Updated Title');
    expect(pages[0].slug).toEqual('database-updated-slug');
    expect(pages[0].content).toEqual('Test content for the page'); // Should remain unchanged
    expect(pages[0].updated_at).toBeInstanceOf(Date);
  });

  it('should throw error when static page does not exist', async () => {
    const updateInput: UpdateStaticPageInput = {
      id: 99999, // Non-existent ID
      title: 'This should fail'
    };

    await expect(updateStaticPage(updateInput)).rejects.toThrow(/Static page with id 99999 not found/);
  });

  it('should throw error on unique constraint violation for slug', async () => {
    // Create two test static pages
    const pageId1 = await createTestStaticPage();
    
    await db.insert(staticPagesTable)
      .values({
        slug: 'another-page',
        title: 'Another Page',
        content: 'Another page content',
        seo_title: null,
        seo_description: null,
        created_at: new Date(),
        updated_at: new Date()
      })
      .execute();

    const updateInput: UpdateStaticPageInput = {
      id: pageId1,
      slug: 'another-page' // This slug already exists
    };

    await expect(updateStaticPage(updateInput)).rejects.toThrow();
  });

  it('should handle updating only slug', async () => {
    const pageId = await createTestStaticPage();

    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      slug: 'brand-new-slug'
    };

    const result = await updateStaticPage(updateInput);

    expect(result.id).toEqual(pageId);
    expect(result.slug).toEqual('brand-new-slug');
    expect(result.title).toEqual('Test Page'); // Should remain unchanged
    expect(result.content).toEqual('Test content for the page'); // Should remain unchanged
    expect(result.seo_title).toEqual('Test SEO Title'); // Should remain unchanged
    expect(result.seo_description).toEqual('Test SEO description'); // Should remain unchanged
  });

  it('should update the updated_at timestamp', async () => {
    const pageId = await createTestStaticPage();

    // Get original timestamps
    const originalPage = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, pageId))
      .execute();

    // Wait a small amount to ensure timestamp difference
    await new Promise(resolve => setTimeout(resolve, 10));

    const updateInput: UpdateStaticPageInput = {
      id: pageId,
      title: 'Updated to check timestamp'
    };

    const result = await updateStaticPage(updateInput);

    expect(result.updated_at > originalPage[0].updated_at).toBe(true);
    expect(result.created_at).toEqual(originalPage[0].created_at); // Should remain unchanged
  });
});