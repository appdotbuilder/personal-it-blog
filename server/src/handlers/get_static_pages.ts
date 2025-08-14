import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type StaticPage } from '../schema';
import { asc } from 'drizzle-orm';

export async function getStaticPages(): Promise<StaticPage[]> {
  try {
    // Fetch all static pages ordered by slug for consistent UI display
    const results = await db.select()
      .from(staticPagesTable)
      .orderBy(asc(staticPagesTable.slug))
      .execute();

    return results;
  } catch (error) {
    console.error('Failed to fetch static pages:', error);
    throw error;
  }
}