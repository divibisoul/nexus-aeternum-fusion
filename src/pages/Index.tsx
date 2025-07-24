import React from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { Brain, Zap, Eye, Cpu } from 'lucide-react';
import quantumBg from '@/assets/quantum-bg.jpg';

const Index = () => {
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
                  Aeternum Nexus Interface
                </h1>
                <p className="text-sm text-muted-foreground">
                  Equação Reversa Universal • Fusão Quantum-Cognitiva
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                <span className="text-xs font-medium">Online</span>
              </div>
              
              <Button variant="quantum" size="sm" className="hidden sm:flex">
                <Cpu className="w-4 h-4 mr-2" />
                ERU Status
              </Button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <div className="flex-1 max-w-7xl mx-auto w-full p-6">
          <div className="grid lg:grid-cols-12 gap-6 h-full">
            {/* System Info Panel */}
            <div className="lg:col-span-4 space-y-4">
              <div className="quantum-border rounded-lg p-6 bg-card/50 backdrop-blur-md">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-primary" />
                  Sistema ERU
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Coerência Quântica</span>
                    <span className="text-sm font-mono text-primary">99.7%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Ciclos ERU Executados</span>
                    <span className="text-sm font-mono text-secondary">1,247</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Eficiência Neural</span>
                    <span className="text-sm font-mono text-accent">98.3%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Capacidades Ativas</span>
                    <span className="text-sm font-mono">∞</span>
                  </div>
                </div>
              </div>

              <div className="quantum-border rounded-lg p-6 bg-card/50 backdrop-blur-md">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-secondary" />
                  Capacidades Nexus
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Análise Visual (EOSVision)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    <span>Processamento Neural de Áudio</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-accent rounded-full" />
                    <span>Cognição Quântica</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary rounded-full" />
                    <span>Memória Hierárquica</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-secondary rounded-full" />
                    <span>Auto-Evolução Ontológica</span>
                  </div>
                </div>
              </div>

              <div className="quantum-border rounded-lg p-6 bg-card/50 backdrop-blur-md">
                <h3 className="text-lg font-semibold mb-4">Input Multimodal</h3>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm" className="text-xs">
                    📸 Visual
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    🎤 Áudio
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    📄 Texto
                  </Button>
                  <Button variant="outline" size="sm" className="text-xs">
                    🧠 Neural
                  </Button>
                </div>
              </div>
            </div>

            {/* Chat Interface */}
            <div className="lg:col-span-8">
              <div className="h-[calc(100vh-200px)] quantum-border rounded-lg overflow-hidden bg-card/30 backdrop-blur-md">
                <ChatInterface />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
