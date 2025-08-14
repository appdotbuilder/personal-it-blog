import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { HomePage } from '@/components/HomePage';
import { AdminDashboard } from '@/components/AdminDashboard';
import { ArticleView } from '@/components/ArticleView';
import { StaticPageView } from '@/components/StaticPageView';
import { ArticleForm } from '@/components/ArticleForm';
import { CategoryManager } from '@/components/CategoryManager';
import { TagManager } from '@/components/TagManager';
import { StaticPageForm } from '@/components/StaticPageForm';
import { ThemeProvider } from '@/components/ThemeProvider';

// Simple client-side routing
type Route = 
  | { type: 'home' }
  | { type: 'admin' }
  | { type: 'article'; slug: string }
  | { type: 'static-page'; slug: string }
  | { type: 'create-article' }
  | { type: 'edit-article'; id: number }
  | { type: 'manage-categories' }
  | { type: 'manage-tags' }
  | { type: 'manage-static-pages' }
  | { type: 'create-static-page' }
  | { type: 'edit-static-page'; id: number };

function App() {
  const [currentRoute, setCurrentRoute] = useState<Route>({ type: 'home' });

  // Simple URL handling
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/') {
        setCurrentRoute({ type: 'home' });
      } else if (path === '/admin') {
        setCurrentRoute({ type: 'admin' });
      } else if (path.startsWith('/article/')) {
        const slug = path.replace('/article/', '');
        setCurrentRoute({ type: 'article', slug });
      } else if (path.startsWith('/page/')) {
        const slug = path.replace('/page/', '');
        setCurrentRoute({ type: 'static-page', slug });
      }
    };

    window.addEventListener('popstate', handlePopState);
    handlePopState(); // Handle initial load

    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (route: Route) => {
    setCurrentRoute(route);
    
    // Update URL without page reload
    let url = '/';
    switch (route.type) {
      case 'home':
        url = '/';
        break;
      case 'admin':
        url = '/admin';
        break;
      case 'article':
        url = `/article/${route.slug}`;
        break;
      case 'static-page':
        url = `/page/${route.slug}`;
        break;
      case 'create-article':
      case 'edit-article':
      case 'manage-categories':
      case 'manage-tags':
      case 'manage-static-pages':
      case 'create-static-page':
      case 'edit-static-page':
        url = '/admin';
        break;
    }
    
    window.history.pushState({}, '', url);
  };

  const renderCurrentPage = () => {
    switch (currentRoute.type) {
      case 'home':
        return <HomePage onNavigate={navigate} />;
      case 'admin':
        return <AdminDashboard onNavigate={navigate} />;
      case 'article':
        return <ArticleView slug={currentRoute.slug} onNavigate={navigate} />;
      case 'static-page':
        return <StaticPageView slug={currentRoute.slug} onNavigate={navigate} />;
      case 'create-article':
        return (
          <ArticleForm 
            onSuccess={() => navigate({ type: 'admin' })}
            onCancel={() => navigate({ type: 'admin' })}
          />
        );
      case 'edit-article':
        return (
          <ArticleForm 
            articleId={currentRoute.id}
            onSuccess={() => navigate({ type: 'admin' })}
            onCancel={() => navigate({ type: 'admin' })}
          />
        );
      case 'manage-categories':
        return <CategoryManager onBack={() => navigate({ type: 'admin' })} />;
      case 'manage-tags':
        return <TagManager onBack={() => navigate({ type: 'admin' })} />;
      case 'manage-static-pages':
        return (
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold">📄 Kelola Halaman Statis</h1>
              <button
                onClick={() => navigate({ type: 'create-static-page' })}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
              >
                Buat Halaman Baru
              </button>
            </div>
          </div>
        );
      case 'create-static-page':
        return (
          <StaticPageForm 
            onSuccess={() => navigate({ type: 'manage-static-pages' })}
            onCancel={() => navigate({ type: 'manage-static-pages' })}
          />
        );
      case 'edit-static-page':
        return (
          <StaticPageForm 
            pageId={currentRoute.id}
            onSuccess={() => navigate({ type: 'manage-static-pages' })}
            onCancel={() => navigate({ type: 'manage-static-pages' })}
          />
        );
      default:
        return <HomePage onNavigate={navigate} />;
    }
  };

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-background text-foreground">
        <Header onNavigate={navigate} currentRoute={currentRoute} />
        <main>
          {renderCurrentPage()}
        </main>
      </div>
    </ThemeProvider>
  );
}

export default App;