import { db } from '../db';
import { tagsTable } from '../db/schema';
import { type UpdateTagInput, type Tag } from '../schema';
import { eq } from 'drizzle-orm';

export const updateTag = async (input: UpdateTagInput): Promise<Tag> => {
  try {
    // Check if tag exists first
    const existingTag = await db.select()
      .from(tagsTable)
      .where(eq(tagsTable.id, input.id))
      .execute();

    if (existingTag.length === 0) {
      throw new Error(`Tag with id ${input.id} not found`);
    }

    // Build the update object with only provided fields
    const updateData: any = {
      updated_at: new Date()
    };

    if (input.name !== undefined) {
      updateData.name = input.name;
    }

    if (input.slug !== undefined) {
      updateData.slug = input.slug;
    }

    // Update the tag
    const result = await db.update(tagsTable)
      .set(updateData)
      .where(eq(tagsTable.id, input.id))
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Tag update failed:', error);
    throw error;
  }
};