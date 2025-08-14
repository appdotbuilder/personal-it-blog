import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { Search, Clock, Tag, Folder, ChevronRight } from 'lucide-react';
import type { ArticleWithRelations, Category, Tag as TagType } from '../../../server/src/schema';

interface HomePageProps {
  onNavigate: (route: any) => void;
}

export function HomePage({ onNavigate }: HomePageProps) {
  const [articles, setArticles] = useState<ArticleWithRelations[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredArticles, setFilteredArticles] = useState<ArticleWithRelations[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [articlesData, categoriesData, tagsData] = await Promise.all([
        trpc.getArticles.query(),
        trpc.getCategories.query(),
        trpc.getTags.query()
      ]);
      
      // Only show published articles on homepage
      const publishedArticles = articlesData.filter((article: ArticleWithRelations) => article.status === 'published');
      setArticles(publishedArticles);
      setFilteredArticles(publishedArticles);
      setCategories(categoriesData);
      setTags(tagsData);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let filtered = articles;

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((article: ArticleWithRelations) =>
        article.title.toLowerCase().includes(query) ||
        article.content.toLowerCase().includes(query) ||
        article.tags.some((tag: TagType) => tag.name.toLowerCase().includes(query))
      );
    }

    // Filter by category
    if (selectedCategory) {
      filtered = filtered.filter((article: ArticleWithRelations) => article.category_id === selectedCategory);
    }

    setFilteredArticles(filtered);
  }, [searchQuery, selectedCategory, articles]);

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-muted-foreground">Memuat artikel...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12 py-12 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/50 dark:to-indigo-950/50 rounded-lg">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
          🚀 IT Blog Pribadi
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Catatan seputar teknologi, programming, dan pengembangan software
        </p>
      </div>

      {/* Search & Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="🔍 Cari artikel..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Categories Filter */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant={selectedCategory === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              Semua Kategori
            </Button>
            {categories.map((category: Category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(selectedCategory === category.id ? null : category.id)}
                className="flex items-center space-x-1"
              >
                <Folder className="h-3 w-3" />
                <span>{category.name}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Articles Grid */}
      {filteredArticles.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-xl font-semibold mb-2">
            {searchQuery || selectedCategory ? 'Tidak ada artikel yang ditemukan' : 'Belum ada artikel'}
          </h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedCategory 
              ? 'Coba ubah kata kunci pencarian atau filter kategori' 
              : 'Artikel pertama sedang dalam persiapan 🚀'}
          </p>
          {(searchQuery || selectedCategory) && (
            <Button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(null);
              }}
              variant="outline"
            >
              Reset Filter
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredArticles.map((article: ArticleWithRelations) => (
            <Card key={article.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader>
                {/* Cover Image Placeholder */}
                {article.cover_image ? (
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-md mb-4 overflow-hidden">
                    <img 
                      src={article.cover_image} 
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-blue-400 to-purple-500 rounded-md mb-4 flex items-center justify-center">
                    <span className="text-white text-2xl">💻</span>
                  </div>
                )}
                
                <CardTitle className="line-clamp-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </CardTitle>
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatDate(article.created_at)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Folder className="h-3 w-3" />
                    <span>{article.category.name}</span>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <CardDescription className="line-clamp-3">
                  {article.excerpt || truncateContent(article.content)}
                </CardDescription>

                {article.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {article.tags.slice(0, 3).map((tag: TagType) => (
                      <Badge key={tag.id} variant="secondary" className="text-xs">
                        <Tag className="h-2 w-2 mr-1" />
                        {tag.name}
                      </Badge>
                    ))}
                    {article.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{article.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <Separator />
                
                <Button
                  variant="ghost"
                  className="w-full justify-between group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => onNavigate({ type: 'article', slug: article.slug })}
                >
                  <span>Baca Selengkapnya</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sidebar Info */}
      {(categories.length > 0 || tags.length > 0) && (
        <div className="mt-16 grid gap-6 md:grid-cols-2">
          {/* Popular Categories */}
          {categories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Folder className="h-5 w-5" />
                  <span>Kategori</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.slice(0, 5).map((category: Category) => (
                    <Button
                      key={category.id}
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      <Folder className="h-4 w-4 mr-2" />
                      {category.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Popular Tags */}
          {tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Tag className="h-5 w-5" />
                  <span>Tag Populer</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {tags.slice(0, 10).map((tag: TagType) => (
                    <Badge 
                      key={tag.id} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                      onClick={() => setSearchQuery(tag.name)}
                    >
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}