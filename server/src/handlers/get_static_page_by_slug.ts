import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type GetStaticPageBySlugInput, type StaticPage } from '../schema';
import { eq } from 'drizzle-orm';

export async function getStaticPageBySlug(input: GetStaticPageBySlugInput): Promise<StaticPage | null> {
  try {
    // Query static page by slug
    const results = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.slug, input.slug))
      .limit(1)
      .execute();

    // Return null if not found, otherwise return the first result
    return results.length > 0 ? results[0] : null;
  } catch (error) {
    console.error('Static page fetch failed:', error);
    throw error;
  }
}