import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { trpc } from '@/utils/trpc';
import { ArrowLeft, Plus, Edit, Trash2, Folder, Save, X } from 'lucide-react';
import type { Category, CreateCategoryInput, UpdateCategoryInput } from '../../../server/src/schema';

interface CategoryManagerProps {
  onBack: () => void;
}

export function CategoryManager({ onBack }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState<CreateCategoryInput>({
    name: '',
    slug: '',
    description: null
  });

  const loadCategories = useCallback(async () => {
    try {
      const categoriesData = await trpc.getCategories.query();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleNameChange = (name: string) => {
    setFormData((prev: CreateCategoryInput) => ({
      ...prev,
      name,
      slug: generateSlug(name)
    }));
  };

  const resetForm = () => {
    setFormData({
      name: '',
      slug: '',
      description: null
    });
    setEditingCategory(null);
  };

  const handleCreate = async () => {
    if (!formData.name.trim() || !formData.slug.trim()) {
      alert('Nama dan slug kategori harus diisi');
      return;
    }

    setIsLoading(true);
    try {
      const newCategory = await trpc.createCategory.mutate(formData);
      setCategories((prev: Category[]) => [...prev, newCategory]);
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create category:', error);
      alert('Gagal membuat kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCategory || !formData.name.trim() || !formData.slug.trim()) {
      alert('Nama dan slug kategori harus diisi');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: UpdateCategoryInput = {
        id: editingCategory.id,
        name: formData.name,
        slug: formData.slug,
        description: formData.description
      };
      
      const updatedCategory = await trpc.updateCategory.mutate(updateData);
      setCategories((prev: Category[]) =>
        prev.map((cat: Category) => cat.id === editingCategory.id ? updatedCategory : cat)
      );
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to update category:', error);
      alert('Gagal mengupdate kategori');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return;

    try {
      await trpc.deleteCategory.mutate({ id });
      setCategories((prev: Category[]) => prev.filter((cat: Category) => cat.id !== id));
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Gagal menghapus kategori');
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description
    });
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Folder className="h-8 w-8" />
              <span>📁 Kelola Kategori</span>
            </h1>
            <p className="text-muted-foreground mt-2">Atur kategori artikel untuk blog Anda</p>
          </div>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kategori
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingCategory ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Kategori *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNameChange(e.target.value)}
                  placeholder="Contoh: Programming"
                />
              </div>

              <div>
                <Label htmlFor="slug">Slug *</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setFormData((prev: CreateCategoryInput) => ({ ...prev, slug: e.target.value }))
                  }
                  placeholder="programming"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  URL: /category/{formData.slug}
                </p>
              </div>

              <div>
                <Label htmlFor="description">Deskripsi</Label>
                <Textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => 
                    setFormData((prev: CreateCategoryInput) => ({ ...prev, description: e.target.value || null }))
                  }
                  placeholder="Deskripsi kategori (opsional)"
                  rows={3}
                />
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleDialogClose} disabled={isLoading}>
                  <X className="h-4 w-4 mr-2" />
                  Batal
                </Button>
                <Button
                  onClick={editingCategory ? handleUpdate : handleCreate}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Menyimpan...' : (editingCategory ? 'Update' : 'Simpan')}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Folder className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Belum Ada Kategori</h3>
            <p className="text-muted-foreground mb-6">
              Buat kategori pertama untuk mengorganisir artikel Anda
            </p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Tambah Kategori Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {categories.map((category: Category) => (
            <Card key={category.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <Folder className="h-5 w-5 text-blue-600" />
                      <h3 className="text-xl font-semibold truncate">{category.name}</h3>
                    </div>
                    
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Slug: <code className="bg-muted px-1 py-0.5 rounded">{category.slug}</code></p>
                      {category.description && (
                        <p className="line-clamp-2">{category.description}</p>
                      )}
                      <p>Dibuat: {formatDate(category.created_at)}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(category.id)}
                      className="text-red-600 hover:text-red-700 border-red-200 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {categories.length > 0 && (
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>📊 Statistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{categories.length}</div>
                <div className="text-sm text-muted-foreground">Total Kategori</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {categories.filter((cat: Category) => cat.description).length}
                </div>
                <div className="text-sm text-muted-foreground">Dengan Deskripsi</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {categories.length > 0 ? (() => {
                    const latestCategory = categories.reduce((latest: Category, current: Category) => 
                      latest.created_at.getTime() > current.created_at.getTime() ? latest : current
                    );
                    return formatDate(latestCategory.created_at);
                  })() : '-'}
                </div>
                <div className="text-sm text-muted-foreground">Terakhir Dibuat</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}