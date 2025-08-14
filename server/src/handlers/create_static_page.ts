import { db } from '../db';
import { staticPagesTable } from '../db/schema';
import { type CreateStaticPageInput, type StaticPage } from '../schema';

export const createStaticPage = async (input: CreateStaticPageInput): Promise<StaticPage> => {
  try {
    // Insert static page record
    const result = await db.insert(staticPagesTable)
      .values({
        slug: input.slug,
        title: input.title,
        content: input.content,
        seo_title: input.seo_title,
        seo_description: input.seo_description
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Static page creation failed:', error);
    throw error;
  }
};