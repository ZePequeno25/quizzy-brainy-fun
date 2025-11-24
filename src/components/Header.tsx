import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AccessibilityButton } from "@/components/AccessibilityButton";
import { useIsMobile } from "@/hooks/use-mobile";
import { LogOut, Home, BookOpen, Menu, X } from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
  };

  return (
    <header className="bg-purple-600 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex justify-between items-center">
          {/* Logo/Título */}
          <Button 
            variant="ghost" 
            className="text-white hover:bg-purple-700 p-0 h-auto"
            onClick={() => handleNavigation('/')}
          >
            <h1 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
              {isMobile ? 'Aprender' : 'Aprender em Movimento'}
            </h1>
          </Button>
          
          {/* Desktop Navigation */}
          {!isMobile && (
            <nav className="flex items-center gap-2">
              <AccessibilityButton />
              <Button 
                variant="ghost" 
                className="text-white hover:bg-purple-700"
                onClick={() => handleNavigation('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Início
              </Button>
              
              {user ? (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-purple-700"
                    onClick={() => handleNavigation(user.userType === 'professor' ? '/professor' : '/student')}
                  >
                    <BookOpen className="w-4 h-4 mr-2" />
                    {user.userType === 'professor' ? 'Painel' : 'Quiz'}
                  </Button>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-sm">
                      Olá, {user.nomeCompleto.split(' ')[0]}
                    </span>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={handleLogout}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-purple-700"
                    onClick={() => handleNavigation('/login')}
                  >
                    Login
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-purple-700"
                    onClick={() => handleNavigation('/register')}
                  >
                    Cadastro
                  </Button>
                </>
              )}
            </nav>
          )}

          {/* Mobile Menu */}
          {isMobile && (
            <div className="flex items-center gap-2">
              <AccessibilityButton />
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-purple-700 p-2"
                    size="icon"
                  >
                    <Menu className="w-6 h-6" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[280px] bg-purple-600 text-white">
                  <div className="flex flex-col gap-4 mt-8">
                    <Button 
                      variant="ghost" 
                      className="text-white hover:bg-purple-700 justify-start"
                      onClick={() => handleNavigation('/')}
                    >
                      <Home className="w-5 h-5 mr-3" />
                      Início
                    </Button>
                    
                    {user ? (
                      <>
                        <Button 
                          variant="ghost" 
                          className="text-white hover:bg-purple-700 justify-start"
                          onClick={() => handleNavigation(user.userType === 'professor' ? '/professor' : '/student')}
                        >
                          <BookOpen className="w-5 h-5 mr-3" />
                          {user.userType === 'professor' ? 'Painel' : 'Quiz'}
                        </Button>
                        <div className="px-4 py-2 border-t border-purple-500 mt-4">
                          <p className="text-sm mb-3">
                            Olá, {user.nomeCompleto.split(' ')[0]}
                          </p>
                          <Button 
                            variant="destructive" 
                            className="w-full bg-red-600 hover:bg-red-700"
                            onClick={handleLogout}
                          >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sair
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        <Button 
                          variant="ghost" 
                          className="text-white hover:bg-purple-700 justify-start"
                          onClick={() => handleNavigation('/login')}
                        >
                          Login
                        </Button>
                        <Button 
                          variant="ghost" 
                          className="text-white hover:bg-purple-700 justify-start"
                          onClick={() => handleNavigation('/register')}
                        >
                          Cadastro
                        </Button>
                      </>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;