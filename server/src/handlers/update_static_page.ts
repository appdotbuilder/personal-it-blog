import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type UpdateStaticPageInput, type StaticPage } from '../schema';
import { eq } from 'drizzle-orm';

export const updateStaticPage = async (input: UpdateStaticPageInput): Promise<StaticPage> => {
  try {
    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_at: new Date()
    };

    if (input.slug !== undefined) {
      updateData['slug'] = input.slug;
    }
    if (input.title !== undefined) {
      updateData['title'] = input.title;
    }
    if (input.content !== undefined) {
      updateData['content'] = input.content;
    }
    if (input.seo_title !== undefined) {
      updateData['seo_title'] = input.seo_title;
    }
    if (input.seo_description !== undefined) {
      updateData['seo_description'] = input.seo_description;
    }

    // Update the static page
    const result = await db.update(staticPagesTable)
      .set(updateData)
      .where(eq(staticPagesTable.id, input.id))
      .returning()
      .execute();

    // Check if static page exists
    if (result.length === 0) {
      throw new Error(`Static page with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Static page update failed:', error);
    throw error;
  }
};