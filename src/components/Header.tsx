import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { AccessibilityButton } from "@/components/AccessibilityButton";
import { LogOut, Home, BookOpen, Users, Settings } from "lucide-react";

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <header className="bg-purple-600 text-white p-4 shadow-lg">
      <div className="container mx-auto flex justify-between items-center">
        <Button 
          variant="ghost" 
          className="text-white hover:bg-purple-700 p-0"
          onClick={() => handleNavigation('/')}
        >
          <h1 className="text-2xl font-bold">Aprender em Movimento</h1>
        </Button>
        
        <nav className="flex items-center gap-4">
          {/* Botão de acessibilidade sempre visível */}
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
                <span className="text-sm">
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
      </div>
    </header>
  );
};

export default Header;