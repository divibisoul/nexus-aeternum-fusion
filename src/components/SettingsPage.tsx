
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  Settings,
  Brain,
  Shield,
  Zap,
  Globe,
  Volume2,
  Eye,
  Save,
  RotateCcw
} from 'lucide-react';

interface SettingsPageProps {
  className?: string;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ className }) => {
  const [settings, setSettings] = useState({
    verbosity: 'medium',
    language: 'pt-BR',
    ethical_bias: 'strict',
    response_speed: 'balanced',
    context_depth: [75],
    enable_metrics: true,
    enable_quantum_validation: true,
    enable_real_time_optimization: true,
    enable_voice_feedback: false,
    enable_visual_indicators: true,
    theme: 'dark'
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    // Salvar configurações no localStorage ou enviar para API
    localStorage.setItem('aeternum_settings', JSON.stringify(settings));
    console.log('Configurações salvas:', settings);
  };

  const handleReset = () => {
    setSettings({
      verbosity: 'medium',
      language: 'pt-BR',
      ethical_bias: 'strict',
      response_speed: 'balanced',
      context_depth: [75],
      enable_metrics: true,
      enable_quantum_validation: true,
      enable_real_time_optimization: true,
      enable_voice_feedback: false,
      enable_visual_indicators: true,
      theme: 'dark'
    });
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold quantum-text">Configurações de Interação</h1>
          <Badge variant="outline" className="quantum-border">
            Interface Aeternum
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Configurações de Resposta */}
          <Card className="quantum-border bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Configurações Cognitivas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="verbosity">Verbosidade das Respostas</Label>
                <Select value={settings.verbosity} onValueChange={(value) => handleSettingChange('verbosity', value)}>
                  <SelectTrigger className="quantum-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="detailed">Detalhado</SelectItem>
                    <SelectItem value="comprehensive">Compreensivo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="language">Idioma</Label>
                <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                  <SelectTrigger className="quantum-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pt-BR">Português (Brasil)</SelectItem>
                    <SelectItem value="en-US">English (US)</SelectItem>
                    <SelectItem value="es-ES">Español</SelectItem>
                    <SelectItem value="fr-FR">Français</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="response_speed">Velocidade de Resposta</Label>
                <Select value={settings.response_speed} onValueChange={(value) => handleSettingChange('response_speed', value)}>
                  <SelectTrigger className="quantum-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fast">Rápida</SelectItem>
                    <SelectItem value="balanced">Balanceada</SelectItem>
                    <SelectItem value="thorough">Completa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="context_depth">Profundidade de Contexto: {settings.context_depth[0]}%</Label>
                <Slider
                  value={settings.context_depth}
                  onValueChange={(value) => handleSettingChange('context_depth', value)}
                  max={100}
                  min={25}
                  step={5}
                  className="quantum-border"
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações Éticas */}
          <Card className="quantum-border bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-secondary" />
                Configurações Éticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ethical_bias">Rigor Ético</Label>
                <Select value={settings.ethical_bias} onValueChange={(value) => handleSettingChange('ethical_bias', value)}>
                  <SelectTrigger className="quantum-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="permissive">Permissivo</SelectItem>
                    <SelectItem value="moderate">Moderado</SelectItem>
                    <SelectItem value="strict">Rigoroso</SelectItem>
                    <SelectItem value="maximum">Máximo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="quantum_validation">Validação Quântica</Label>
                <Switch 
                  id="quantum_validation"
                  checked={settings.enable_quantum_validation}
                  onCheckedChange={(checked) => handleSettingChange('enable_quantum_validation', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="real_time_optimization">Otimização Tempo Real</Label>
                <Switch 
                  id="real_time_optimization"
                  checked={settings.enable_real_time_optimization}
                  onCheckedChange={(checked) => handleSettingChange('enable_real_time_optimization', checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Configurações de Interface */}
          <Card className="quantum-border bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-accent" />
                Interface e Feedback
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="metrics">Exibir Métricas</Label>
                <Switch 
                  id="metrics"
                  checked={settings.enable_metrics}
                  onCheckedChange={(checked) => handleSettingChange('enable_metrics', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="visual_indicators">Indicadores Visuais</Label>
                <Switch 
                  id="visual_indicators"
                  checked={settings.enable_visual_indicators}
                  onCheckedChange={(checked) => handleSettingChange('enable_visual_indicators', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="voice_feedback">Feedback por Voz</Label>
                <Switch 
                  id="voice_feedback"
                  checked={settings.enable_voice_feedback}
                  onCheckedChange={(checked) => handleSettingChange('enable_voice_feedback', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="theme">Tema</Label>
                <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                  <SelectTrigger className="quantum-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Escuro</SelectItem>
                    <SelectItem value="light">Claro</SelectItem>
                    <SelectItem value="auto">Automático</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ações */}
          <Card className="quantum-border bg-card/50 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Ações
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button onClick={handleSave} className="flex-1" variant="quantum">
                  <Save className="w-4 h-4 mr-2" />
                  Salvar Configurações
                </Button>
                <Button onClick={handleReset} variant="outline">
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Resetar
                </Button>
              </div>
              
              <Separator />
              
              <div className="text-sm text-muted-foreground">
                <p>As configurações são aplicadas em tempo real ao sistema ERU.</p>
                <p>Mudanças na validação quântica podem afetar a performance.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
