import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/ThemeProvider';
import { Sun, Moon, Settings, Home, BookOpen } from 'lucide-react';

interface HeaderProps {
  onNavigate: (route: any) => void;
  currentRoute: any;
}

export function Header({ onNavigate, currentRoute }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  const isActive = (routeType: string) => {
    return currentRoute.type === routeType;
  };

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <button
              onClick={() => onNavigate({ type: 'home' })}
              className="flex items-center space-x-2 text-xl font-bold hover:text-blue-600 transition-colors"
            >
              <BookOpen className="h-6 w-6" />
              <span>💻 IT Blog</span>
            </button>
            
            <nav className="hidden md:flex items-center space-x-4">
              <Button
                variant={isActive('home') ? 'default' : 'ghost'}
                onClick={() => onNavigate({ type: 'home' })}
                className="flex items-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Beranda</span>
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => onNavigate({ type: 'static-page', slug: 'tentang' })}
              >
                Tentang
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => onNavigate({ type: 'static-page', slug: 'kontak' })}
              >
                Kontak
              </Button>
            </nav>
          </div>

          <div className="flex items-center space-x-3">
            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
            >
              {theme === 'light' ? (
                <Moon className="h-4 w-4" />
              ) : (
                <Sun className="h-4 w-4" />
              )}
            </Button>

            {/* Admin Button */}
            <Button
              variant={isActive('admin') ? 'default' : 'outline'}
              onClick={() => onNavigate({ type: 'admin' })}
              className="flex items-center space-x-2"
              size="sm"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center space-x-4 mt-3 pt-3 border-t">
          <Button
            variant={isActive('home') ? 'default' : 'ghost'}
            onClick={() => onNavigate({ type: 'home' })}
            size="sm"
          >
            Beranda
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate({ type: 'static-page', slug: 'tentang' })}
          >
            Tentang
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate({ type: 'static-page', slug: 'kontak' })}
          >
            Kontak
          </Button>
        </nav>
      </div>
    </header>
  );
}