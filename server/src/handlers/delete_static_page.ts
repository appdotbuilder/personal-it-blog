import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type DeleteInput } from '../schema';

export async function deleteStaticPage(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Check if static page exists
    const existingPage = await db.select()
      .from(staticPagesTable)
      .where(eq(staticPagesTable.id, input.id))
      .execute();

    if (existingPage.length === 0) {
      return { success: false };
    }

    // Delete the static page
    const result = await db.delete(staticPagesTable)
      .where(eq(staticPagesTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Static page deletion failed:', error);
    throw error;
  }
}