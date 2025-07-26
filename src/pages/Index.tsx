
import React, { useState, useEffect } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { ChatInterface } from '@/components/ChatInterface';
import { AuditPage } from '@/components/AuditPage';
import { SettingsPage } from '@/components/SettingsPage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageCircle, Activity, Settings, LogOut, User } from 'lucide-react';
import quantumBg from '@/assets/quantum-bg.jpg';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ username: string; apiKey: string } | null>(null);
  const [activeTab, setActiveTab] = useState('chat');

  useEffect(() => {
    // Verificar se há usuário logado
    const savedUser = localStorage.getItem('aeternum_user');
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser);
        setCurrentUser(userData);
        setIsAuthenticated(true);
      } catch (error) {
        localStorage.removeItem('aeternum_user');
      }
    }
  }, []);

  const handleAuthenticated = (authData: { username: string; password: string }) => {
    const savedUser = localStorage.getItem('aeternum_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setCurrentUser(userData);
      setIsAuthenticated(true);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('aeternum_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  // Se não estiver autenticado, mostrar página de login
  if (!isAuthenticated) {
    return <AuthPage onAuthenticated={handleAuthenticated} />;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Quantum Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url(${quantumBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* Quantum Particles Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
      
      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6 border-b quantum-border bg-card/20 backdrop-blur-md">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary via-secondary to-accent quantum-glow flex items-center justify-center">
                <Brain className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold quantum-text">
                  Aplicativo Interface Aeternum (AIA)
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sistema ERU • Processamento Quântico-Cognitivo • Auto-Evolução Ontológica
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* User Info */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20">
                <User className="w-3 h-3" />
                <span className="text-xs font-medium">{currentUser?.username}</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs font-medium">ERU Online</span>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </header>

        {/* Main Interface */}
        <div className="flex-1 max-w-7xl mx-auto w-full">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
            <div className="border-b quantum-border bg-card/20 backdrop-blur-md">
              <TabsList className="grid w-full grid-cols-3 max-w-md mx-auto bg-transparent">
                <TabsTrigger value="chat" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Interface Principal
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Auditoria ERU
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configurações
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="chat" className="flex-1 m-0">
              <div className="h-[calc(100vh-160px)]">
                <ChatInterface 
                  apiKey={currentUser?.apiKey}
                  currentUser={currentUser}
                  onSettingsClick={() => setActiveTab('settings')}
                />
              </div>
            </TabsContent>

            <TabsContent value="audit" className="flex-1 m-0 p-6">
              <AuditPage />
            </TabsContent>

            <TabsContent value="settings" className="flex-1 m-0 p-6">
              <SettingsPage />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Index;
