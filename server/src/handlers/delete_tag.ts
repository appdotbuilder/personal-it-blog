import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type DeleteInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteTag = async (input: DeleteInput): Promise<{ success: boolean }> => {
  try {
    // Check if tag exists first
    const existingTag = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, input.id))
      .execute();

    if (existingTag.length === 0) {
      return { success: false };
    }

    // Delete the tag
    // The articleTagsTable has ON DELETE CASCADE, so related records will be automatically deleted
    const result = await db.delete(tagsTable)
      .where(eq(tagsTable.id, input.id))
      .returning()
      .execute();

    return { success: result.length > 0 };
  } catch (error) {
    console.error('Tag deletion failed:', error);
    throw error;
  }
};