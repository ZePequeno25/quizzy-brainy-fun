import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AccessibilityButton } from "@/components/AccessibilityButton";
import { LogOut, Home, BookOpen, Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavigation = (path: string) => {
    navigate(path);
    setMobileMenuOpen(false);
  };

  return (
    <header className="bg-purple-600 text-white p-4 shadow-lg">
      <div className="container mx-auto">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Button 
            variant="ghost" 
            className="text-white hover:bg-purple-700 p-0 text-lg sm:text-2xl"
            onClick={() => handleNavigation('/')}
          >
            <h1 className="font-bold">Aprender em Movimento</h1>
          </Button>
          
          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2 xl:gap-4">
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
                
                <div className="flex items-center gap-2">
                  <span className="text-sm hidden xl:inline">
                    Olá, {user.nomeCompleto.split(' ')[0]}
                  </span>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={logout}
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

          {/* Mobile Navigation */}
          <div className="flex lg:hidden items-center gap-2">
            <AccessibilityButton />
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-purple-700">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-purple-600 text-white border-purple-700">
                <nav className="flex flex-col gap-4 mt-8">
                  <Button 
                    variant="ghost" 
                    className="text-white hover:bg-purple-700 justify-start"
                    onClick={() => handleNavigation('/')}
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Início
                  </Button>
                  
                  {user ? (
                    <>
                      <Button 
                        variant="ghost" 
                        className="text-white hover:bg-purple-700 justify-start"
                        onClick={() => handleNavigation(user.userType === 'professor' ? '/professor' : '/student')}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        {user.userType === 'professor' ? 'Painel' : 'Quiz'}
                      </Button>
                      
                      <div className="pt-4 border-t border-purple-500">
                        <p className="text-sm mb-2">Olá, {user.nomeCompleto.split(' ')[0]}</p>
                        <Button 
                          variant="destructive" 
                          className="w-full bg-red-600 hover:bg-red-700 justify-start"
                          onClick={logout}
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
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;