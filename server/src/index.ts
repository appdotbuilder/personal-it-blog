import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import {
  createCategoryInputSchema,
  updateCategoryInputSchema,
  deleteInputSchema,
  createTagInputSchema,
  updateTagInputSchema,
  createArticleInputSchema,
  updateArticleInputSchema,
  getArticleBySlugInputSchema,
  searchArticlesInputSchema,
  createStaticPageInputSchema,
  updateStaticPageInputSchema,
  getStaticPageBySlugInputSchema
} from './schema';

// Import handlers
import { createCategory } from './handlers/create_category';
import { getCategories } from './handlers/get_categories';
import { updateCategory } from './handlers/update_category';
import { deleteCategory } from './handlers/delete_category';
import { createTag } from './handlers/create_tag';
import { getTags } from './handlers/get_tags';
import { updateTag } from './handlers/update_tag';
import { deleteTag } from './handlers/delete_tag';
import { createArticle } from './handlers/create_article';
import { getArticles } from './handlers/get_articles';
import { getArticleBySlug } from './handlers/get_article_by_slug';
import { searchArticles } from './handlers/search_articles';
import { updateArticle } from './handlers/update_article';
import { deleteArticle } from './handlers/delete_article';
import { createStaticPage } from './handlers/create_static_page';
import { getStaticPages } from './handlers/get_static_pages';
import { getStaticPageBySlug } from './handlers/get_static_page_by_slug';
import { updateStaticPage } from './handlers/update_static_page';
import { deleteStaticPage } from './handlers/delete_static_page';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Category management
  createCategory: publicProcedure
    .input(createCategoryInputSchema)
    .mutation(({ input }) => createCategory(input)),
  
  getCategories: publicProcedure
    .query(() => getCategories()),
  
  updateCategory: publicProcedure
    .input(updateCategoryInputSchema)
    .mutation(({ input }) => updateCategory(input)),
  
  deleteCategory: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteCategory(input)),

  // Tag management
  createTag: publicProcedure
    .input(createTagInputSchema)
    .mutation(({ input }) => createTag(input)),
  
  getTags: publicProcedure
    .query(() => getTags()),
  
  updateTag: publicProcedure
    .input(updateTagInputSchema)
    .mutation(({ input }) => updateTag(input)),
  
  deleteTag: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteTag(input)),

  // Article management
  createArticle: publicProcedure
    .input(createArticleInputSchema)
    .mutation(({ input }) => createArticle(input)),
  
  getArticles: publicProcedure
    .query(() => getArticles()),
  
  getArticleBySlug: publicProcedure
    .input(getArticleBySlugInputSchema)
    .query(({ input }) => getArticleBySlug(input)),
  
  searchArticles: publicProcedure
    .input(searchArticlesInputSchema)
    .query(({ input }) => searchArticles(input)),
  
  updateArticle: publicProcedure
    .input(updateArticleInputSchema)
    .mutation(({ input }) => updateArticle(input)),
  
  deleteArticle: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteArticle(input)),

  // Static page management
  createStaticPage: publicProcedure
    .input(createStaticPageInputSchema)
    .mutation(({ input }) => createStaticPage(input)),
  
  getStaticPages: publicProcedure
    .query(() => getStaticPages()),
  
  getStaticPageBySlug: publicProcedure
    .input(getStaticPageBySlugInputSchema)
    .query(({ input }) => getStaticPageBySlug(input)),
  
  updateStaticPage: publicProcedure
    .input(updateStaticPageInputSchema)
    .mutation(({ input }) => updateStaticPage(input)),
  
  deleteStaticPage: publicProcedure
    .input(deleteInputSchema)
    .mutation(({ input }) => deleteStaticPage(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();