import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput, type CreateStaticPageInput } from '../schema';
import { deleteStaticPage } from '../handlers/delete_static_page';

const testPageInput: CreateStaticPageInput = {
  slug: 'test-page',
  title: 'Test Page',
  content: 'This is test page content',
  seo_title: 'Test Page SEO Title',
  seo_description: 'Test page for SEO testing'
};

describe('deleteStaticPage', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully delete an existing static page', async () => {
    // Create a test static page first
    const createResult = await db.insert(staticPagesTable)
      .values({
        slug: testPageInput.slug,
        title: testPageInput.title,
        content: testPageInput.content,
        seo_title: testPageInput.seo_title,
        seo_description: testPageInput.seo_description
      })
      .returning()
      .execute();

    const staticPageId = createResult[0].id;

    // Delete the static page
    const deleteInput: DeleteInput = { id: staticPageId };
    const result = await deleteStaticPage(deleteInput);

    expect(result.success).toBe(true);
  });

  it('should remove static page from database after deletion', async () => {
    // Create a test static page first
    const createResult = await db.insert(staticPagesTable)
      .values({
        slug: testPageInput.slug,
        title: testPageInput.title,
        content: testPageInput.content,
        seo_title: testPageInput.seo_title,
        seo_description: testPageInput.seo_description
      })
      .returning()
      .execute();

    const staticPageId = createResult[0].id;

    // Delete the static page
    const deleteInput: DeleteInput = { id: staticPageId };
    await deleteStaticPage(deleteInput);

    // Verify it's removed from database
    const pages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, staticPageId))
      .execute();

    expect(pages).toHaveLength(0);
  });

  it('should return false when trying to delete non-existent static page', async () => {
    const nonExistentId = 99999;
    const deleteInput: DeleteInput = { id: nonExistentId };
    
    const result = await deleteStaticPage(deleteInput);

    expect(result.success).toBe(false);
  });

  it('should not affect other static pages when deleting one', async () => {
    // Create two test static pages
    const page1Result = await db.insert(staticPagesTable)
      .values({
        slug: 'page-1',
        title: 'Page 1',
        content: 'Content 1',
        seo_title: 'SEO Title 1',
        seo_description: 'SEO Description 1'
      })
      .returning()
      .execute();

    const page2Result = await db.insert(staticPagesTable)
      .values({
        slug: 'page-2',
        title: 'Page 2',
        content: 'Content 2',
        seo_title: 'SEO Title 2',
        seo_description: 'SEO Description 2'
      })
      .returning()
      .execute();

    const page1Id = page1Result[0].id;
    const page2Id = page2Result[0].id;

    // Delete only the first page
    const deleteInput: DeleteInput = { id: page1Id };
    const result = await deleteStaticPage(deleteInput);

    expect(result.success).toBe(true);

    // Verify first page is deleted
    const deletedPages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, page1Id))
      .execute();

    expect(deletedPages).toHaveLength(0);

    // Verify second page still exists
    const remainingPages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, page2Id))
      .execute();

    expect(remainingPages).toHaveLength(1);
    expect(remainingPages[0].title).toEqual('Page 2');
    expect(remainingPages[0].slug).toEqual('page-2');
  });

  it('should handle deletion of static pages with all nullable fields', async () => {
    // Create a minimal static page with only required fields
    const minimalPageResult = await db.insert(staticPagesTable)
      .values({
        slug: 'minimal-page',
        title: 'Minimal Page',
        content: 'Minimal content',
        seo_title: null,
        seo_description: null
      })
      .returning()
      .execute();

    const pageId = minimalPageResult[0].id;

    // Delete the minimal page
    const deleteInput: DeleteInput = { id: pageId };
    const result = await deleteStaticPage(deleteInput);

    expect(result.success).toBe(true);

    // Verify it's removed from database
    const pages = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, pageId))
      .execute();

    expect(pages).toHaveLength(0);
  });
});