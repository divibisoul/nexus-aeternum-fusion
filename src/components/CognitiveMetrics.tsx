
import React, { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CognitiveMetricsProps {
  className?: string;
  expanded?: boolean;
}

interface MetricData {
  value: number;
  measured: boolean;
  trend: 'up' | 'down' | 'stable';
  status: 'optimal' | 'good' | 'warning' | 'critical';
}

interface SystemMetrics {
  self_scan_coherence: MetricData;
  causal_reversal_efficiency: MetricData;
  ethical_conformance_score: MetricData;
  cognitive_cycle_time_ms: MetricData;
  system_uptime: MetricData;
}

export const CognitiveMetrics: React.FC<CognitiveMetricsProps> = ({ 
  className, 
  expanded = false 
}) => {
  const [metrics] = useState<SystemMetrics>({
    self_scan_coherence: { value: 0, measured: false, trend: 'stable', status: 'critical' },
    causal_reversal_efficiency: { value: 0, measured: false, trend: 'stable', status: 'critical' },
    ethical_conformance_score: { value: 0, measured: false, trend: 'stable', status: 'critical' },
    cognitive_cycle_time_ms: { value: 0, measured: false, trend: 'stable', status: 'critical' },
    system_uptime: { value: 0, measured: false, trend: 'stable', status: 'critical' }
  });

  const [isLive] = useState(false);

  const getMetricIcon = (metricKey: string) => {
    const icons = {
      self_scan_coherence: <Eye className="w-4 h-4" />,
      causal_reversal_efficiency: <Target className="w-4 h-4" />,
      ethical_conformance_score: <Shield className="w-4 h-4" />,
      cognitive_cycle_time_ms: <Clock className="w-4 h-4" />,
      system_uptime: <Activity className="w-4 h-4" />
    };
    return icons[metricKey as keyof typeof icons] || <Zap className="w-4 h-4" />;
  };

  const getMetricLabel = (metricKey: string) => {
    const labels = {
      self_scan_coherence: 'Coerência Holográfica',
      causal_reversal_efficiency: 'Eficiência Causal Π',
      ethical_conformance_score: 'Conformidade Ética',
      cognitive_cycle_time_ms: 'Tempo Ciclo (ms)',
      system_uptime: 'Uptime Sistema (%)'
    };
    return labels[metricKey as keyof typeof labels] || metricKey;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-400';
      case 'good': return 'text-blue-400';
      case 'warning': return 'text-yellow-400';
      case 'critical': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  const formatValue = (key: string, data: MetricData) => {
    if (!data.measured) return '—';
    const value = data.value;
    if (key === 'cognitive_cycle_time_ms') {
      return `${value.toFixed(0)}ms`;
    }
    if (key === 'system_uptime') {
      return `${value.toFixed(3)}%`;
    }
    return (value * 100).toFixed(1) + '%';
  };

  if (!expanded) {
    return (
      <div className={cn("flex items-center gap-4 p-3 bg-card/30 rounded-lg quantum-border", className)}>
        <div className="flex items-center gap-2">
          <div className={cn("w-2 h-2 rounded-full animate-pulse", 
            isLive ? "bg-green-400" : "bg-gray-400"
          )} />
          <span className="text-sm font-medium">ERU Status</span>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-green-400">Λ: {metrics.self_scan_coherence.measured ? (metrics.self_scan_coherence.value * 100).toFixed(1) + '%' : 'Λ: —'}</span>
          <span className="text-blue-400">Π: {metrics.causal_reversal_efficiency.measured ? (metrics.causal_reversal_efficiency.value * 100).toFixed(1) + '%' : 'Π: —'}</span>
          <span className="text-purple-400">Ε: {metrics.ethical_conformance_score.measured ? (metrics.ethical_conformance_score.value * 100).toFixed(1) + '%' : 'Ε: —'}</span>
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
            {isLive ? 'Fonte observada' : 'Não mensurado'}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {Object.entries(metrics).map(([key, data]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getMetricIcon(key)}
                <span className="text-sm font-medium">{getMetricLabel(key)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-sm font-mono", getStatusColor(data.status))}>
                  {formatValue(key, data)}
                </span>
                <TrendingUp className={cn("w-3 h-3", 
                  data.trend === 'up' ? 'text-green-400' : 
                  data.trend === 'down' ? 'text-red-400' : 'text-gray-400'
                )} />
              </div>
            </div>
            
            <Progress 
              value={key === 'cognitive_cycle_time_ms' ? 
                Math.max(0, 100 - (data.value / 500 * 100)) : 
                key === 'system_uptime' ? data.value : data.value * 100
              }
              className="h-2"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
