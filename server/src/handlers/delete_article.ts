import { db } from '../db';
import { articlesTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export async function deleteArticle(input: DeleteInput): Promise<{ success: boolean }> {
  try {
    // Delete the article - cascade deletion will handle article-tag relationships
    const result = await db.delete(articlesTable)
      .where(eq(articlesTable.id, input.id))
      .returning()
      .execute();

    // Return success based on whether any rows were deleted
    return { success: result.length > 0 };
  } catch (error) {
    console.error('Article deletion failed:', error);
    throw error;
  }
}