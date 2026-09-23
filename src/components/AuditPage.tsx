import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Brain,
  Database,
  Network,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { CognitiveMetrics } from './CognitiveMetrics';

interface AuditPageProps {
  className?: string;
}

type ObservationStatus = 'observed' | 'not_observed';

interface SystemComponentObservation {
  name: string;
  status: ObservationStatus;
  uptime: string | null;
  load: string | null;
  description: string;
}

const systemComponents: SystemComponentObservation[] = [
  {
    name: 'Serviço ERU Transcendente',
    status: 'not_observed',
    uptime: null,
    load: null,
    description: 'Motor central de processamento cognitivo; runtime não conectado a esta tela.',
  },
  {
    name: 'Módulo T-A (Auto-Gênese)',
    status: 'not_observed',
    uptime: null,
    load: null,
    description: 'Sistema de adaptação e evolução; execução precisa de evidência do runtime.',
  },
  {
    name: 'Módulo Λ (Escaneamento)',
    status: 'not_observed',
    uptime: null,
    load: null,
    description: 'Análise de estado; nenhuma telemetria foi fornecida ao componente.',
  },
  {
    name: 'Módulo Π (Diagnóstico)',
    status: 'not_observed',
    uptime: null,
    load: null,
    description: 'Diagnóstico causal reverso; nenhum resultado foi fornecido ao componente.',
  },
];

const HISTORICAL_LEGACY_LOGS = [
  '[INFO] 2024-01-25 14:23:45 - ERU Cycle #1247 completed successfully',
  '[DEBUG] 2024-01-25 14:23:44 - Self-scan coherence: 0.987 (optimal)',
  '[WARN] 2024-01-25 14:23:43 - Causal efficiency below threshold, triggering optimization',
  '[INFO] 2024-01-25 14:23:42 - T-A module generated new response pattern',
  '[DEBUG] 2024-01-25 14:23:41 - Quantum validation passed: 99.97% similarity',
] as const;

export const AuditPage: React.FC<AuditPageProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('overview');

  const getStatusIcon = (status: ObservationStatus) => (
    status === 'observed'
      ? <CheckCircle className="w-4 h-4 text-green-400" />
      : <AlertTriangle className="w-4 h-4 text-gray-500" />
  );

  const getStatusColor = (status: ObservationStatus) => (
    status === 'observed'
      ? 'border-green-400/20 bg-green-400/10'
      : 'border-gray-600/40 bg-gray-800/30'
  );

  return (
    <div className={className}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold quantum-text">Auditoria Interna ERU</h1>
          <Badge variant="outline" className="quantum-border">
            Estado não observado
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
                      O desenho lógico é distribuído; estado operacional E2E não está observado nesta tela.
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {[
                        'API Gateway',
                        'Base de Conhecimento',
                        'Cache / Memória',
                        'Validador / Governança',
                      ].map(name => (
                        <div key={name} className="p-2 bg-primary/10 rounded border">
                          <strong>{name}</strong><br />
                          Estado: N/O
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="components" className="space-y-4">
            <div className="grid gap-4">
              {systemComponents.map(component => (
                <Card key={component.name} className={'quantum-border ' + getStatusColor(component.status)}>
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
                        <div className="font-mono">Uptime: {component.uptime ?? 'N/O'}</div>
                        <div className="font-mono">Load: {component.load ?? 'N/O'}</div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  {[
                    ['Consultas/segundo', 'N/O'],
                    ['Operações ERU/segundo', 'N/O'],
                    ['Ciclos de otimização', 'N/O'],
                    ['Tempo médio resposta', 'N/O'],
                    ['P95 latência', 'N/O'],
                    ['P99 latência', 'N/O'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between border-b border-gray-700/50 pb-2">
                      <span>{label}:</span>
                      <span className="font-mono">{value}</span>
                    </div>
                  ))}
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
                <div className="p-3 mb-4 rounded border border-yellow-500/20 bg-yellow-500/5 text-xs text-gray-400">
                  Nenhum log operacional atual foi fornecido a esta tela. Os registros abaixo são preservados exclusivamente como histórico legado e não representam o estado atual.
                </div>
                <details className="rounded border border-gray-700 bg-gray-900/40 p-3">
                  <summary className="cursor-pointer text-sm text-gray-300">Abrir histórico legado</summary>
                  <div className="mt-3 space-y-2 font-mono text-xs">
                    {HISTORICAL_LEGACY_LOGS.map(log => (
                      <div key={log} className="p-2 bg-gray-800/60 rounded">
                        {log}
                      </div>
                    ))}
                  </div>
                </details>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
