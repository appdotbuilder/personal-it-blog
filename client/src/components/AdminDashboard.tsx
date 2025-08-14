import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { 
  Plus, 
  FileText, 
  Folder, 
  Tag, 
  Edit, 
  Trash2, 
  Eye, 
  Settings,
  BarChart3,
  Clock,
  FileType
} from 'lucide-react';
import type { ArticleWithRelations, Category, Tag as TagType, StaticPage } from '../../../server/src/schema';

interface AdminDashboardProps {
  onNavigate: (route: any) => void;
}

export function AdminDashboard({ onNavigate }: AdminDashboardProps) {
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [staticPages, setStaticPages] = useState<StaticPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [articlesData, categoriesData, tagsData, staticPagesData] = await Promise.all([
        trpc.getArticles.query(),
        trpc.getCategories.query(),
        trpc.getTags.query(),
        trpc.getStaticPages.query()
      ]);
      
      setArticles(articlesData);
      setCategories(categoriesData);
      setTags(tagsData);
      setStaticPages(staticPagesData);
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteArticle = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus artikel ini?')) return;
    
    try {
      await trpc.deleteArticle.mutate({ id });
      setArticles((prev: ArticleWithRelations[]) => prev.filter((article: ArticleWithRelations) => article.id !== id));
    } catch (error) {
      console.error('Failed to delete article:', error);
      alert('Gagal menghapus artikel');
    }
  };

  const handleDeleteStaticPage = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus halaman ini?')) return;
    
    try {
      await trpc.deleteStaticPage.mutate({ id });
      setStaticPages((prev: StaticPage[]) => prev.filter((page: StaticPage) => page.id !== id));
    } catch (error) {
      console.error('Failed to delete static page:', error);
      alert('Gagal menghapus halaman');
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-muted-foreground">Memuat data admin...</p>
        </div>
      </div>
    );
  }

  const publishedCount = articles.filter((article: ArticleWithRelations) => article.status === 'published').length;
  const draftCount = articles.filter((article: ArticleWithRelations) => article.status === 'draft').length;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Settings className="h-8 w-8" />
            <span>🛠️ Admin Dashboard</span>
          </h1>
          <p className="text-muted-foreground mt-2">Kelola konten blog Anda</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Artikel</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{articles.length}</div>
            <p className="text-xs text-muted-foreground">
              {publishedCount} published, {draftCount} draft
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kategori</CardTitle>
            <Folder className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">kategori aktif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tag</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tags.length}</div>
            <p className="text-xs text-muted-foreground">tag tersedia</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Halaman Statis</CardTitle>
            <FileType className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{staticPages.length}</div>
            <p className="text-xs text-muted-foreground">halaman statis</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="cursor-pointer hover:shadow-lg transition-shadow" 
              onClick={() => onNavigate({ type: 'create-article' })}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Buat Artikel Baru</span>
            </CardTitle>
            <CardDescription>
              Tulis artikel baru untuk blog Anda
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate({ type: 'manage-categories' })}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Folder className="h-5 w-5" />
              <span>Kelola Kategori</span>
            </CardTitle>
            <CardDescription>
              Tambah, edit, atau hapus kategori
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => onNavigate({ type: 'manage-tags' })}>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Tag className="h-5 w-5" />
              <span>Kelola Tag</span>
            </CardTitle>
            <CardDescription>
              Tambah, edit, atau hapus tag
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      {/* Recent Articles */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Artikel Terbaru</span>
            </span>
            <Button
              onClick={() => onNavigate({ type: 'create-article' })}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Baru
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {articles.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada artikel. Buat artikel pertama Anda!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {articles.slice(0, 5).map((article: ArticleWithRelations) => (
                <div key={article.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-medium truncate">{article.title}</h3>
                      <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                        {article.status === 'published' ? '✅ Published' : '📝 Draft'}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-muted-foreground">
                      <span className="flex items-center space-x-1">
                        <Folder className="h-3 w-3" />
                        <span>{article.category.name}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{formatDate(article.created_at)}</span>
                      </span>
                      {article.tags.length > 0 && (
                        <span className="flex items-center space-x-1">
                          <Tag className="h-3 w-3" />
                          <span>{article.tags.length} tag</span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate({ type: 'article', slug: article.slug })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate({ type: 'edit-article', id: article.id })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteArticle(article.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Static Pages Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <FileType className="h-5 w-5" />
              <span>Halaman Statis</span>
            </span>
            <Button
              onClick={() => onNavigate({ type: 'create-static-page' })}
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Buat Halaman
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {staticPages.length === 0 ? (
            <div className="text-center py-8">
              <FileType className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Belum ada halaman statis. Buat halaman seperti "Tentang" atau "Kontak"!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {staticPages.map((page: StaticPage) => (
                <div key={page.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate">{page.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      Slug: /{page.slug} • Updated: {formatDate(page.updated_at)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate({ type: 'static-page', slug: page.slug })}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onNavigate({ type: 'edit-static-page', id: page.id })}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteStaticPage(page.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}