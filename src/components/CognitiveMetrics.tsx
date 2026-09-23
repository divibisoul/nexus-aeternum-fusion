import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Brain,
  Zap,
  Shield,
  Clock,
  Activity,
  TrendingUp,
  Eye,
  Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type CognitiveMetricKey =
  | 'self_scan_coherence'
  | 'causal_reversal_efficiency'
  | 'ethical_conformance_score'
  | 'cognitive_cycle_time_ms'
  | 'system_uptime';

interface CognitiveMetricObservation {
  value: number | null;
  trend?: 'up' | 'down' | 'stable';
}

export interface CognitiveMetricsProps {
  className?: string;
  expanded?: boolean;
  observations?: Partial<Record<CognitiveMetricKey, CognitiveMetricObservation>>;
}

const DEFAULT_OBSERVATIONS: Record<CognitiveMetricKey, CognitiveMetricObservation> = {
  self_scan_coherence: { value: null },
  causal_reversal_efficiency: { value: null },
  ethical_conformance_score: { value: null },
  cognitive_cycle_time_ms: { value: null },
  system_uptime: { value: null },
};

const getMetricIcon = (metricKey: CognitiveMetricKey) => {
  const icons = {
    self_scan_coherence: <Eye className="w-4 h-4" />,
    causal_reversal_efficiency: <Target className="w-4 h-4" />,
    ethical_conformance_score: <Shield className="w-4 h-4" />,
    cognitive_cycle_time_ms: <Clock className="w-4 h-4" />,
    system_uptime: <Activity className="w-4 h-4" />,
  };
  return icons[metricKey];
};

const getMetricLabel = (metricKey: CognitiveMetricKey) => {
  const labels: Record<CognitiveMetricKey, string> = {
    self_scan_coherence: 'Coerência Holográfica',
    causal_reversal_efficiency: 'Eficiência Causal Π',
    ethical_conformance_score: 'Conformidade Ética',
    cognitive_cycle_time_ms: 'Tempo Ciclo (ms)',
    system_uptime: 'Uptime Sistema (%)',
  };
  return labels[metricKey];
};

const formatValue = (key: CognitiveMetricKey, value: number | null) => {
  if (value === null || !Number.isFinite(value)) return 'N/O';
  if (key === 'cognitive_cycle_time_ms') return value.toFixed(0) + 'ms';
  if (key === 'system_uptime') return value.toFixed(3) + '%';
  return (value * 100).toFixed(1) + '%';
};

const progressValue = (key: CognitiveMetricKey, value: number | null) => {
  if (value === null || !Number.isFinite(value)) return 0;
  if (key === 'cognitive_cycle_time_ms') return Math.max(0, Math.min(100, 100 - (value / 500) * 100));
  if (key === 'system_uptime') return Math.max(0, Math.min(100, value));
  return Math.max(0, Math.min(100, value * 100));
};

export const CognitiveMetrics: React.FC<CognitiveMetricsProps> = ({
  className,
  expanded = false,
  observations,
}) => {
  const metrics: Record<CognitiveMetricKey, CognitiveMetricObservation> = {
    ...DEFAULT_OBSERVATIONS,
    ...(observations ?? {}),
  };

  const hasObservations = Object.values(metrics).some(
    metric => metric.value !== null && Number.isFinite(metric.value),
  );

  if (!expanded) {
    return (
      <div className={cn("flex items-center gap-4 p-3 bg-card/30 rounded-lg quantum-border", className)}>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full", hasObservations ? "bg-green-400" : "bg-gray-400")} />
          <span className="text-sm font-medium">ERU Status</span>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-gray-400">Λ: {formatValue('self_scan_coherence', metrics.self_scan_coherence.value)}</span>
          <span className="text-gray-400">Π: {formatValue('causal_reversal_efficiency', metrics.causal_reversal_efficiency.value)}</span>
          <span className="text-gray-400">Ε: {formatValue('ethical_conformance_score', metrics.ethical_conformance_score.value)}</span>
        </div>
      </div>
    );
  }

  return (
    <Card className={cn("quantum-border bg-card/50 backdrop-blur-md", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Métricas Cognitivas ERU
          <Badge variant="outline" className="ml-auto">
            {hasObservations ? 'Observado' : 'Não observado'}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        {(Object.keys(metrics) as CognitiveMetricKey[]).map(key => {
          const data = metrics[key];
          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getMetricIcon(key)}
                  <span className="text-sm font-medium">{getMetricLabel(key)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-400">
                    {formatValue(key, data.value)}
                  </span>
                  {data.trend && (
                    <TrendingUp className={cn(
                      "w-3 h-3",
                      data.trend === 'up' ? 'text-green-400' :
                      data.trend === 'down' ? 'text-red-400' : 'text-gray-400',
                    )} />
                  )}
                </div>
              </div>

              <Progress
                value={progressValue(key, data.value)}
                className={cn("h-2", data.value === null && "opacity-30")}
              />
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
