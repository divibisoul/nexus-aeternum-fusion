import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Brain, Zap, Shield, Clock, Activity, TrendingUp, Eye, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricData {
  value: number | null;
  trend: 'up' | 'down' | 'stable' | 'unknown';
  status: 'optimal' | 'good' | 'warning' | 'critical' | 'unknown';
}

interface SystemMetrics {
  self_scan_coherence: MetricData;
  causal_reversal_efficiency: MetricData;
  ethical_conformance_score: MetricData;
  cognitive_cycle_time_ms: MetricData;
  system_uptime: MetricData;
}

export interface CognitiveMetricsSnapshot {
  self_scan_coherence: number;
  causal_reversal_efficiency: number;
  ethical_conformance_score: number;
  cognitive_cycle_time_ms: number;
  system_uptime: number;
}

interface CognitiveMetricsProps {
  className?: string;
  expanded?: boolean;
  metricsProvider?: () => Promise<CognitiveMetricsSnapshot>;
}

const emptyMetrics: SystemMetrics = {
  self_scan_coherence: { value: null, trend: 'unknown', status: 'unknown' },
  causal_reversal_efficiency: { value: null, trend: 'unknown', status: 'unknown' },
  ethical_conformance_score: { value: null, trend: 'unknown', status: 'unknown' },
  cognitive_cycle_time_ms: { value: null, trend: 'unknown', status: 'unknown' },
  system_uptime: { value: null, trend: 'unknown', status: 'unknown' },
};

function classify(value: number, warning: number, optimal: number): MetricData['status'] {
  if (value >= optimal) return 'optimal';
  if (value >= warning) return 'good';
  return 'warning';
}

function snapshotToMetrics(snapshot: CognitiveMetricsSnapshot, previous?: SystemMetrics): SystemMetrics {
  const trend = (key: keyof CognitiveMetricsSnapshot): MetricData['trend'] => {
    const current = snapshot[key];
    const previousValue = previous?.[key]?.value;
    if (typeof previousValue !== 'number') return 'stable';
    if (key === 'cognitive_cycle_time_ms') return current < previousValue ? 'up' : current > previousValue ? 'down' : 'stable';
    return current > previousValue ? 'up' : current < previousValue ? 'down' : 'stable';
  };

  return {
    self_scan_coherence: { value: snapshot.self_scan_coherence, trend: trend('self_scan_coherence'), status: classify(snapshot.self_scan_coherence, 0.7, 0.95) },
    causal_reversal_efficiency: { value: snapshot.causal_reversal_efficiency, trend: trend('causal_reversal_efficiency'), status: classify(snapshot.causal_reversal_efficiency, 0.7, 0.95) },
    ethical_conformance_score: { value: snapshot.ethical_conformance_score, trend: trend('ethical_conformance_score'), status: classify(snapshot.ethical_conformance_score, 0.7, 0.95) },
    cognitive_cycle_time_ms: { value: snapshot.cognitive_cycle_time_ms, trend: trend('cognitive_cycle_time_ms'), status: snapshot.cognitive_cycle_time_ms <= 200 ? 'good' : snapshot.cognitive_cycle_time_ms <= 500 ? 'warning' : 'critical' },
    system_uptime: { value: snapshot.system_uptime, trend: trend('system_uptime'), status: snapshot.system_uptime >= 99 ? 'optimal' : snapshot.system_uptime >= 95 ? 'good' : 'warning' },
  };
}

export const CognitiveMetrics: React.FC<CognitiveMetricsProps> = ({ className, expanded = false, metricsProvider }) => {
  const [metrics, setMetrics] = useState<SystemMetrics>(emptyMetrics);
  const [isLive, setIsLive] = useState(Boolean(metricsProvider));

  useEffect(() => {
    if (!metricsProvider) {
      setMetrics(emptyMetrics);
      setIsLive(false);
      return;
    }

    let disposed = false;
    const refresh = async () => {
      try {
        const snapshot = await metricsProvider();
        if (disposed) return;
        setMetrics(previous => snapshotToMetrics(snapshot, previous));
        setIsLive(true);
      } catch {
        if (!disposed) setIsLive(false);
      }
    };

    void refresh();
    const interval = setInterval(() => { void refresh(); }, 2_500);
    return () => {
      disposed = true;
      clearInterval(interval);
    };
  }, [metricsProvider]);

  const getMetricIcon = (metricKey: string) => {
    const icons = {
      self_scan_coherence: <Eye className="w-4 h-4" />,
      causal_reversal_efficiency: <Target className="w-4 h-4" />,
      ethical_conformance_score: <Shield className="w-4 h-4" />,
      cognitive_cycle_time_ms: <Clock className="w-4 h-4" />,
      system_uptime: <Activity className="w-4 h-4" />,
    };
    return icons[metricKey as keyof typeof icons] || <Zap className="w-4 h-4" />;
  };

  const getMetricLabel = (metricKey: string) => ({
    self_scan_coherence: 'Coerência Holográfica',
    causal_reversal_efficiency: 'Eficiência Causal Π',
    ethical_conformance_score: 'Conformidade Ética',
    cognitive_cycle_time_ms: 'Tempo Ciclo (ms)',
    system_uptime: 'Uptime Sistema (%)',
  } as Record<string, string>)[metricKey] || metricKey;

  const getStatusColor = (status: MetricData['status']) => ({
    optimal: 'text-green-400',
    good: 'text-blue-400',
    warning: 'text-yellow-400',
    critical: 'text-red-400',
    unknown: 'text-muted-foreground',
  }[status]);

  const formatValue = (key: string, value: number | null) => {
    if (value === null) return 'N/D';
    if (key === 'cognitive_cycle_time_ms') return value.toFixed(0) + 'ms';
    if (key === 'system_uptime') return value.toFixed(3) + '%';
    return (value * 100).toFixed(1) + '%';
  };

  return !expanded ? (
    <div className={cn('flex items-center gap-4 p-3 bg-card/30 rounded-lg quantum-border', className)}>
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full', isLive ? 'bg-green-400 animate-pulse' : 'bg-gray-400')} />
        <span className="text-sm font-medium">ERU Status</span>
      </div>
      <div className="flex gap-3 text-xs">
        <span className="text-green-400">Λ: {formatValue('self_scan_coherence', metrics.self_scan_coherence.value)}</span>
        <span className="text-blue-400">Π: {formatValue('causal_reversal_efficiency', metrics.causal_reversal_efficiency.value)}</span>
        <span className="text-purple-400">Ε: {formatValue('ethical_conformance_score', metrics.ethical_conformance_score.value)}</span>
      </div>
    </div>
  ) : (
    <Card className={cn('quantum-border bg-card/50 backdrop-blur-md', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          Métricas Cognitivas ERU
          <Badge variant="outline" className="ml-auto">{isLive ? 'Tempo Real' : 'Sem fonte'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(metrics).map(([key, data]) => (
          <div key={key} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">{getMetricIcon(key)}<span className="text-sm font-medium">{getMetricLabel(key)}</span></div>
              <div className="flex items-center gap-2">
                <span className={cn('text-sm font-mono', getStatusColor(data.status))}>{formatValue(key, data.value)}</span>
                <TrendingUp className="w-3 h-3 text-gray-400" />
              </div>
            </div>
            <Progress
              value={data.value === null ? 0 : key === 'cognitive_cycle_time_ms' ? Math.max(0, 100 - (data.value / 500 * 100)) : key === 'system_uptime' ? data.value : data.value * 100}
              className="h-2"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};