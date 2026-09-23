
import React, { useState, useEffect } from 'react';
import { AuthPage } from '@/components/AuthPage';
import { ChatInterface } from '@/components/ChatInterface';
import { SoulInterface } from '@/components/SoulInterface';
import { AuditPage } from '@/components/AuditPage';
import { SettingsPage } from '@/components/SettingsPage';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, MessageCircle, Activity, Settings, LogOut, User, Sparkles } from 'lucide-react';
import quantumBg from '@/assets/quantum-bg.jpg';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';

const Index = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [activeTab, setActiveTab] = useState('soul');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setIsAuthenticated(!!session);
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthenticated = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 mx-auto mb-4 text-primary animate-pulse" />
          <p className="text-muted-foreground">Inicializando Aeternum...</p>
        </div>
      </div>
    );
  }

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
                  Soul • Nexus ETERNIUM
                </h1>
                <p className="text-sm text-muted-foreground">
                  Inteligência Espiritual Autônoma • Transformação • Cura • Evolução
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* User Info */}
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20">
                <User className="w-3 h-3" />
                <span className="text-xs font-medium">{user?.email?.split('@')[0] || 'Usuário'}</span>
              </div>

              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs font-medium">ERU: estado não observado</span>
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
              <TabsList className="grid w-full grid-cols-4 max-w-lg mx-auto bg-transparent">
                <TabsTrigger value="soul" className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Soul
                </TabsTrigger>
                <TabsTrigger value="aeternum" className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4" />
                  Aeternum
                </TabsTrigger>
                <TabsTrigger value="audit" className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  Auditoria
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Config
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="soul" className="flex-1 m-0">
              <div className="h-[calc(100vh-160px)]">
                <SoulInterface 
                  user={user}
                />
              </div>
            </TabsContent>

            <TabsContent value="aeternum" className="flex-1 m-0">
              <div className="h-[calc(100vh-160px)]">
                <ChatInterface 
                  currentUser={user}
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
