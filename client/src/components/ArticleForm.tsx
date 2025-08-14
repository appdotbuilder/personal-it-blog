import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { Save, ArrowLeft, Eye, X } from 'lucide-react';
import type { 
  CreateArticleInput, 
  UpdateArticleInput, 
  ArticleWithRelations,
  Category, 
  Tag as TagType,
  ArticleStatus 
} from '../../../server/src/schema';

interface ArticleFormProps {
  articleId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function ArticleForm({ articleId, onSuccess, onCancel }: ArticleFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagType[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  
  const [formData, setFormData] = useState<CreateArticleInput>({
    title: '',
    slug: '',
    content: '',
    excerpt: null,
    cover_image: null,
    status: 'draft',
    category_id: 0,
    tag_ids: [],
    seo_title: null,
    seo_description: null
  });

  const isEditing = Boolean(articleId);

  const loadData = useCallback(async () => {
    try {
      const [categoriesData, tagsData] = await Promise.all([
        trpc.getCategories.query(),
        trpc.getTags.query()
      ]);
      
      setCategories(categoriesData);
      setTags(tagsData);

      if (isEditing && articleId) {
        // For editing, we need to get the article data
        // Since we don't have a direct getArticle query, we'll use getArticles and find the one
        const articlesData = await trpc.getArticles.query();
        const article = articlesData.find((a: ArticleWithRelations) => a.id === articleId);
        
        if (article) {
          setFormData({
            title: article.title,
            slug: article.slug,
            content: article.content,
            excerpt: article.excerpt,
            cover_image: article.cover_image,
            status: article.status,
            category_id: article.category_id,
            tag_ids: article.tags.map((tag: TagType) => tag.id),
            seo_title: article.seo_title,
            seo_description: article.seo_description
          });
          setSelectedTags(article.tags.map((tag: TagType) => tag.id));
        }
      }
    } catch (error) {
      console.error('Failed to load form data:', error);
    }
  }, [isEditing, articleId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev: CreateArticleInput) => ({
      ...prev,
      title,
      slug: generateSlug(title) // Auto-generate slug
    }));
  };

  const handleTagToggle = (tagId: number) => {
    const updatedTags = selectedTags.includes(tagId)
      ? selectedTags.filter((id: number) => id !== tagId)
      : [...selectedTags, tagId];
    
    setSelectedTags(updatedTags);
    setFormData((prev: CreateArticleInput) => ({
      ...prev,
      tag_ids: updatedTags
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.content.trim() || !formData.category_id) {
      alert('Mohon lengkapi judul, konten, dan kategori artikel');
      return;
    }

    setIsLoading(true);
    try {
      if (isEditing && articleId) {
        const updateData: UpdateArticleInput = {
          id: articleId,
          ...formData
        };
        await trpc.updateArticle.mutate(updateData);
      } else {
        await trpc.createArticle.mutate(formData);
      }
      onSuccess();
    } catch (error) {
      console.error('Failed to save article:', error);
      alert('Gagal menyimpan artikel');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveDraft = async () => {
    const draftData = { ...formData, status: 'draft' as ArticleStatus };
    setFormData(draftData);
    
    // Submit as draft
    const form = document.getElementById('article-form') as HTMLFormElement;
    if (form) {
      const event = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(event);
    }
  };

  const handlePublish = async () => {
    const publishData = { ...formData, status: 'published' as ArticleStatus };
    setFormData(publishData);
    
    // Submit as published
    setTimeout(() => {
      const form = document.getElementById('article-form') as HTMLFormElement;
      if (form) {
        const event = new Event('submit', { bubbles: true, cancelable: true });
        form.dispatchEvent(event);
      }
    }, 0);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <h1 className="text-2xl font-bold">
            {isEditing ? '✏️ Edit Artikel' : '📝 Buat Artikel Baru'}
          </h1>
        </div>
      </div>

      <form id="article-form" onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Konten Artikel</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Judul Artikel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleTitleChange(e.target.value)}
                    placeholder="Masukkan judul artikel..."
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData((prev: CreateArticleInput) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="url-artikel-ini"
                    required
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    URL: /article/{formData.slug}
                  </p>
                </div>

                <div>
                  <Label htmlFor="excerpt">Ringkasan</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setFormData((prev: CreateArticleInput) => ({ ...prev, excerpt: e.target.value || null }))
                    }
                    placeholder="Ringkasan singkat artikel (opsional)"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="content">Konten Artikel *</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setFormData((prev: CreateArticleInput) => ({ ...prev, content: e.target.value }))
                    }
                    placeholder="Tulis konten artikel Anda di sini..."
                    rows={12}
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* SEO Section */}
            <Card>
              <CardHeader>
                <CardTitle>🔍 SEO Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    value={formData.seo_title || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData((prev: CreateArticleInput) => ({ ...prev, seo_title: e.target.value || null }))
                    }
                    placeholder="Custom SEO title (default: judul artikel)"
                  />
                </div>

                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    value={formData.seo_description || ''}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                      setFormData((prev: CreateArticleInput) => ({ ...prev, seo_description: e.target.value || null }))
                    }
                    placeholder="Deskripsi untuk meta tag (160 karakter)"
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Publish Actions */}
            <Card>
              <CardHeader>
                <CardTitle>📤 Publikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
                    {formData.status === 'published' ? 'Published' : 'Draft'}
                  </Badge>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isLoading}
                    variant="outline"
                    className="w-full"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isLoading ? 'Menyimpan...' : 'Simpan Draft'}
                  </Button>

                  <Button
                    type="button"
                    onClick={handlePublish}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    {isLoading ? 'Memublikasi...' : 'Publikasikan'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Category Selection */}
            <Card>
              <CardHeader>
                <CardTitle>📁 Kategori</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.category_id.toString()}
                  onValueChange={(value: string) => 
                    setFormData((prev: CreateArticleInput) => ({ ...prev, category_id: parseInt(value) }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category: Category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Tidak ada kategori. Buat kategori terlebih dahulu.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tags Selection */}
            <Card>
              <CardHeader>
                <CardTitle>🏷️ Tag</CardTitle>
              </CardHeader>
              <CardContent>
                {tags.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Tidak ada tag. Buat tag terlebih dahulu.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {tags.map((tag: TagType) => (
                      <div key={tag.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`tag-${tag.id}`}
                          checked={selectedTags.includes(tag.id)}
                          onCheckedChange={() => handleTagToggle(tag.id)}
                        />
                        <Label htmlFor={`tag-${tag.id}`} className="text-sm">
                          {tag.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTags.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Tag terpilih:</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedTags.map((tagId: number) => {
                        const tag = tags.find((t: TagType) => t.id === tagId);
                        return tag ? (
                          <Badge key={tagId} variant="secondary" className="text-xs">
                            {tag.name}
                            <button
                              type="button"
                              onClick={() => handleTagToggle(tagId)}
                              className="ml-1 hover:text-red-600"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </Badge>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle>🖼️ Gambar Sampul</CardTitle>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="cover_image">URL Gambar</Label>
                  <Input
                    id="cover_image"
                    value={formData.cover_image || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setFormData((prev: CreateArticleInput) => ({ ...prev, cover_image: e.target.value || null }))
                    }
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                {formData.cover_image && (
                  <div className="mt-2">
                    <img 
                      src={formData.cover_image} 
                      alt="Cover preview"
                      className="w-full h-32 object-cover rounded-md"
                      onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </div>
  );
}