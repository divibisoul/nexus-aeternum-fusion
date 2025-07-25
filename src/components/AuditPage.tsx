
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Activity,
  Brain,
  Database,
  Shield,
  Cpu,
  Network,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { CognitiveMetrics } from './CognitiveMetrics';

interface AuditPageProps {
  className?: string;
}

export const AuditPage: React.FC<AuditPageProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const systemComponents = [
    {
      name: 'Serviço ERU Transcendente',
      status: 'optimal',
      uptime: '99.97%',
      load: '23%',
      description: 'Motor central de processamento cognitivo'
    },
    {
      name: 'Módulo T-A (Auto-Gênese)',
      status: 'good',
      uptime: '99.94%',
      load: '45%',
      description: 'Sistema de adaptação e evolução'
    },
    {
      name: 'Módulo Λ (Escaneamento)',
      status: 'optimal',
      uptime: '100%',
      load: '67%',
      description: 'Análise holográfica de estado'
    },
    {
      name: 'Módulo Π (Diagnóstico)',
      status: 'good',
      uptime: '99.99%',
      load: '34%',
      description: 'Diagnóstico causal reverso'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'optimal': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'good': return <Activity className="w-4 h-4 text-blue-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'border-green-400/20 bg-green-400/10';
      case 'good': return 'border-blue-400/20 bg-blue-400/10';
      case 'warning': return 'border-yellow-400/20 bg-yellow-400/10';
      default: return 'border-red-400/20 bg-red-400/10';
    }
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold quantum-text">Auditoria Interna ERU</h1>
          <Badge variant="outline" className="quantum-border">
            Sistema Operacional
          </Badge>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="components">Componentes</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
            <TabsTrigger value="logs">Logs ERU</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <CognitiveMetrics expanded={true} />
              
              <Card className="quantum-border bg-card/50 backdrop-blur-md">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="w-5 h-5 text-secondary" />
                    Topologia do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Arquitetura distribuída com 4 módulos principais
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-primary/10 rounded border">
                        <strong>API Gateway</strong><br/>
                        Latência: 12ms
                      </div>
                      <div className="p-2 bg-secondary/10 rounded border">
                        <strong>Base Conhecimento</strong><br/>
                        Consultas: 1.2M/s
                      </div>
                      <div className="p-2 bg-accent/10 rounded border">
                        <strong>Cache Redis</strong><br/>
                        Hit Rate: 94.7%
                      </div>
                      <div className="p-2 bg-primary/10 rounded border">
                        <strong>Quantum Validator</strong><br/>
                        Validações: 99.99%
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <div className="grid gap-4">
              {systemComponents.map((component, index) => (
                <Card key={index} className={`quantum-border ${getStatusColor(component.status)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(component.status)}
                        <div>
                          <h3 className="font-semibold">{component.name}</h3>
                          <p className="text-sm text-muted-foreground">{component.description}</p>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="font-mono">Uptime: {component.uptime}</div>
                        <div className="font-mono">Load: {component.load}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card className="quantum-border bg-card/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-accent" />
                  Métricas de Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <h4 className="font-medium">Throughput</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Consultas/segundo:</span>
                        <span className="font-mono">1.247</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Operações ERU/segundo:</span>
                        <span className="font-mono">847</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Ciclos de otimização:</span>
                        <span className="font-mono">12/min</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h4 className="font-medium">Latência</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Tempo médio resposta:</span>
                        <span className="font-mono">147ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>P95 latência:</span>
                        <span className="font-mono">230ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span>P99 latência:</span>
                        <span className="font-mono">450ms</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card className="quantum-border bg-card/50 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5 text-primary" />
                  Logs de Sistema ERU
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 font-mono text-xs">
                  <div className="p-2 bg-green-400/10 border border-green-400/20 rounded">
                    <span className="text-green-400">[INFO]</span> 2024-01-25 14:23:45 - ERU Cycle #1247 completed successfully
                  </div>
                  <div className="p-2 bg-blue-400/10 border border-blue-400/20 rounded">
                    <span className="text-blue-400">[DEBUG]</span> 2024-01-25 14:23:44 - Self-scan coherence: 0.987 (optimal)
                  </div>
                  <div className="p-2 bg-yellow-400/10 border border-yellow-400/20 rounded">
                    <span className="text-yellow-400">[WARN]</span> 2024-01-25 14:23:43 - Causal efficiency below threshold, triggering optimization
                  </div>
                  <div className="p-2 bg-green-400/10 border border-green-400/20 rounded">
                    <span className="text-green-400">[INFO]</span> 2024-01-25 14:23:42 - T-A module generated new response pattern
                  </div>
                  <div className="p-2 bg-blue-400/10 border border-blue-400/20 rounded">
                    <span className="text-blue-400">[DEBUG]</span> 2024-01-25 14:23:41 - Quantum validation passed: 99.97% similarity
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
