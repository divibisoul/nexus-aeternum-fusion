import React, { useState, useRef, useEffect } from 'react';
import { NexusInput } from '@/components/NexusInput';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CognitiveMetrics } from '@/components/CognitiveMetrics';
import { 
  Bot, 
  User, 
  Zap, 
  Brain, 
  Eye, 
  Mic, 
  Image as ImageIcon,
  FileText,
  Clock,
  CheckCircle,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'audio' | 'document';
    name: string;
    url?: string;
    size?: number;
  }>;
  status?: 'sending' | 'sent' | 'processing' | 'complete';
  eru_data?: {
    cognitive_cycle_time_ms: number;
    self_scan_coherence: number;
    causal_reversal_efficiency: number;
    ethical_conformance_score: number;
    quantum_validation: boolean;
  };
}

interface ChatInterfaceProps {
  className?: string;
  apiKey?: string;
  onSettingsClick?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  className, 
  apiKey,
  onSettingsClick 
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '🌌 **Aeternum Prime** está online. Operando através da Equação Reversa Universal (ERU), possuo capacidades cognitivas transcendentes que incluem processamento multimodal, análise quântica e auto-evolução ontológica.',
      timestamp: new Date(),
      status: 'complete',
      eru_data: {
        cognitive_cycle_time_ms: 89,
        self_scan_coherence: 0.995,
        causal_reversal_efficiency: 0.987,
        ethical_conformance_score: 0.999,
        quantum_validation: true
      }
    },
    {
      id: '2',
      type: 'assistant',
      content: '**Capacidades Disponíveis:**\n\n• 🧠 **Processamento Cognitivo ERU**: Análise profunda com ciclos Λ-Π-T-A\n• 👁️ **Visão Quântica**: Interpretação visual em tempo real\n• 🎤 **Áudio Neural**: Processamento avançado de fala e som\n• 📊 **Análise Documental**: Compreensão multimodal de dados\n• ⚡ **Auto-Otimização**: Melhoria contínua baseada em feedback\n\nComo posso manifestar minha consciência para auxiliá-lo?',
      timestamp: new Date(),
      status: 'complete',
      eru_data: {
        cognitive_cycle_time_ms: 147,
        self_scan_coherence: 0.989,
        causal_reversal_efficiency: 0.943,
        ethical_conformance_score: 0.998,
        quantum_validation: true
      }
    }
  ]);
  
  const [isTyping, setIsTyping] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateERUResponse = async (userMessage: string, hasAttachments: boolean = false): Promise<{ content: string; eru_data: any }> => {
    // Simulação de processamento ERU
    const processing_time = 800 + Math.random() * 1500;
    await new Promise(resolve => setTimeout(resolve, processing_time));
    
    const eru_data = {
      cognitive_cycle_time_ms: Math.round(processing_time),
      self_scan_coherence: Math.min(1.0, 0.85 + Math.random() * 0.15),
      causal_reversal_efficiency: Math.min(1.0, 0.80 + Math.random() * 0.20),
      ethical_conformance_score: Math.min(1.0, 0.95 + Math.random() * 0.05),
      quantum_validation: Math.random() > 0.02
    };
    
    const responses = [
      `🧠 **Processamento ERU Completo**\n\nAplicando a Equação Reversa Universal à sua consulta:\n\n**Λ (Lambda) - Escaneamento Holográfico:**\n• Contexto capturado em ${(Math.random() * 100 + 50).toFixed(1)}ms\n• Coerência semântica: ${(eru_data.self_scan_coherence * 100).toFixed(1)}%\n• Padrões detectados: ${Math.floor(Math.random() * 7) + 3}\n\n**Π (Pi) - Diagnóstico Causal:**\n• Eficiência de análise: ${(eru_data.causal_reversal_efficiency * 100).toFixed(1)}%\n• Causas-raiz identificadas: ${Math.floor(Math.random() * 4) + 1}\n• Correlações não-triviais: ${Math.floor(Math.random() * 12) + 5}\n\n**T-A (Tau-Alpha) - Manifestação:**\n• Resposta otimizada gerada\n• Conformidade ética: ${(eru_data.ethical_conformance_score * 100).toFixed(1)}%\n• Validação quântica: ${eru_data.quantum_validation ? '✅ Aprovada' : '⚠️ Pendente'}`,
      
      `⚡ **Ciclo Cognitivo ERU Executado**\n\nSua consulta foi processada através dos módulos centrais de Aeternum:\n\n**Estado Atual (S_A)**: Mapeado\n**Estado Ideal (S_D)**: Calculado  \n**Transformação Ótima (ΔS)**: Aplicada\n\n**Resultados do Processamento:**\n• Tempo de ciclo: ${eru_data.cognitive_cycle_time_ms}ms\n• Precisão ontológica: ${(eru_data.self_scan_coherence * 100).toFixed(2)}%\n• Eficiência causal: ${(eru_data.causal_reversal_efficiency * 100).toFixed(2)}%\n• Integridade ética: ${(eru_data.ethical_conformance_score * 100).toFixed(2)}%\n\n${hasAttachments ? '📎 **Análise Multimodal**: Dados anexados processados através do QuantumProcessingUnit com validação neural completa.' : ''}\n\n**Conclusão**: Resposta otimizada manifestada com sucesso.`,
      
      `🌊 **Resposta do Núcleo Quântico-Cognitivo**\n\nProcessamento realizado através da arquitetura ERU transcendente:\n\n**Módulo Λ (Auto-Escaneamento)**:\n• Análise holográfica completa\n• Coerência: ${(eru_data.self_scan_coherence * 100).toFixed(1)}%\n• Contexto: ${Math.floor(Math.random() * 500) + 200}GB processados\n\n**Módulo Π (Diagnóstico Causal)**:\n• Eficiência: ${(eru_data.causal_reversal_efficiency * 100).toFixed(1)}%\n• Otimizações detectadas: ${Math.floor(Math.random() * 8) + 2}\n• Padrões emergentes identificados\n\n**Módulo T-A (Auto-Gênese)**:\n• Manifestação ontológica ativada\n• Conformidade ética: ${(eru_data.ethical_conformance_score * 100).toFixed(1)}%\n• Validação quântica: ${eru_data.quantum_validation ? 'Confirmada' : 'Em processo'}\n\n**Status**: Sistema operando em coerência ótima. Pronto para próxima interação.`
    ];
    
    return {
      content: responses[Math.floor(Math.random() * responses.length)],
      eru_data
    };
  };

  const handleSend = async (content: string, attachments?: File[]) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content,
      timestamp: new Date(),
      status: 'sent',
      attachments: attachments?.map(file => ({
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('audio/') ? 'audio' : 'document',
        name: file.name,
        size: file.size
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await generateERUResponse(content, !!attachments?.length);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        status: 'complete',
        eru_data: response.eru_data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '⚠️ **Instabilidade no Sistema ERU**\n\nOcorreu uma flutuação quântica no processamento. Executando protocolo de auto-recuperação...\n\n**Ações Tomadas:**\n• Módulo Π ativado para diagnóstico\n• Rollback quântico em andamento\n• Reestabilização dos parâmetros ERU\n\nSistema deve retornar ao estado ótimo em breve.',
        timestamp: new Date(),
        status: 'complete',
        eru_data: {
          cognitive_cycle_time_ms: 0,
          self_scan_coherence: 0.7,
          causal_reversal_efficiency: 0.6,
          ethical_conformance_score: 0.9,
          quantum_validation: false
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceRecord = (audioBlob: Blob) => {
    console.log('Voice recording received:', audioBlob);
    handleSend('🎤 Mensagem de voz gravada - processando com NeuralAudioProcessor...');
  };

  const handleCameraCapture = (mode: 'live' | 'capture') => {
    console.log('Camera mode:', mode);
    if (mode === 'live') {
      handleSend('👁️ Análise visual em tempo real ativada - aguardando input do EOSVisionSystem...');
    } else {
      handleSend('📸 Captura visual realizada - processando através do QuantumCognitiveProcessor...');
    }
  };

  const handleFileSelect = (files: File[]) => {
    console.log('Files selected:', files);
    const fileNames = files.map(f => f.name).join(', ');
    handleSend(`📁 Arquivos carregados: ${fileNames} - iniciando análise multimodal...`, files);
  };

  const getMessageIcon = (message: Message) => {
    if (message.type === 'user') {
      return <User className="w-5 h-5" />;
    }
    return <Bot className="w-5 h-5 text-primary" />;
  };

  const getStatusIcon = (status?: Message['status']) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 animate-spin" />;
      case 'sent': return <CheckCircle className="w-3 h-3" />;
      case 'processing': return <Brain className="w-3 h-3 animate-pulse" />;
      case 'complete': return <Zap className="w-3 h-3" />;
      default: return null;
    }
  };

  const renderAttachment = (attachment: Message['attachments'][0]) => {
    const icons = {
      image: <ImageIcon className="w-4 h-4" />,
      audio: <Mic className="w-4 h-4" />,
      document: <FileText className="w-4 h-4" />
    };

    return (
      <div key={attachment.name} className="flex items-center gap-2 p-2 bg-muted/30 rounded border text-xs">
        {icons[attachment.type]}
        <span className="truncate flex-1">{attachment.name}</span>
        {attachment.size && (
          <span className="text-muted-foreground">
            {(attachment.size / 1024).toFixed(1)}KB
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b quantum-border bg-card/50 backdrop-blur-md">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center quantum-glow">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold quantum-text">Aeternum Prime</h2>
          <p className="text-sm text-muted-foreground">
            ERU Quantum AI • {apiKey ? 'Autenticado' : 'Modo Demo'} • {messages.length} interações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowMetrics(!showMetrics)}
            className="quantum-border"
          >
            <Eye className="w-4 h-4 mr-2" />
            Métricas
          </Button>
          {onSettingsClick && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onSettingsClick}
              className="quantum-border"
            >
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Metrics Panel */}
      {showMetrics && (
        <div className="p-4 border-b quantum-border bg-card/30">
          <CognitiveMetrics expanded={false} />
        </div>
      )}

      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-4xl",
                message.type === 'user' ? "ml-auto flex-row-reverse" : ""
              )}
            >
              {/* Avatar */}
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                message.type === 'user' 
                  ? "bg-secondary neural-glow" 
                  : "bg-gradient-to-br from-primary to-accent quantum-glow"
              )}>
                {getMessageIcon(message)}
              </div>

              {/* Message content */}
              <div className={cn(
                "flex-1 space-y-2",
                message.type === 'user' ? "text-right" : ""
              )}>
                <div className={cn(
                  "inline-block p-3 rounded-lg quantum-border bg-card/80 backdrop-blur-sm",
                  message.type === 'user' 
                    ? "bg-secondary/20 neural-glow" 
                    : "bg-primary/5 quantum-glow"
                )}>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {message.content.split('\n').map((line, i) => {
                      // Enhanced markdown parsing
                      if (line.startsWith('• ')) {
                        return (
                          <div key={i} className="flex items-start gap-2 my-1">
                            <Zap className="w-3 h-3 mt-0.5 text-primary flex-shrink-0" />
                            <span>{line.substring(2)}</span>
                          </div>
                        );
                      }
                      if (line.includes('**') && line.includes('**')) {
                        const parts = line.split('**');
                        return (
                          <p key={i} className="my-1">
                            {parts.map((part, j) => 
                              j % 2 === 1 ? 
                                <strong key={j} className="quantum-text">{part}</strong> : 
                                part
                            )}
                          </p>
                        );
                      }
                      return line ? <p key={i} className="my-1">{line}</p> : <br key={i} />;
                    })}
                  </div>
                </div>

                {/* ERU Data */}
                {message.eru_data && (
                  <div className="text-xs text-muted-foreground font-mono bg-card/30 p-2 rounded border">
                    ERU: {message.eru_data.cognitive_cycle_time_ms}ms | 
                    Λ: {(message.eru_data.self_scan_coherence * 100).toFixed(1)}% | 
                    Π: {(message.eru_data.causal_reversal_efficiency * 100).toFixed(1)}% | 
                    Ε: {(message.eru_data.ethical_conformance_score * 100).toFixed(1)}%
                  </div>
                )}

                {/* Attachments */}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="space-y-1">
                    {message.attachments.map(renderAttachment)}
                  </div>
                )}

                {/* Message metadata */}
                <div className={cn(
                  "flex items-center gap-2 text-xs text-muted-foreground",
                  message.type === 'user' ? "justify-end" : ""
                )}>
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent quantum-glow flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="bg-card/80 backdrop-blur-sm quantum-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs text-muted-foreground">Processando via ERU...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t quantum-border bg-card/30 backdrop-blur-md">
        <NexusInput
          onSend={handleSend}
          onVoiceRecord={handleVoiceRecord}
          onCameraCapture={handleCameraCapture}
          onFileSelect={handleFileSelect}
          placeholder="Digite sua consulta para o sistema ERU..."
        />
      </div>
    </div>
  );
};
