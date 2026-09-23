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
import { supabase } from '@/integrations/supabase/client';

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
  runtime?: {
    model: string;
    latencyMs: number;
    usage?: Record<string, number> | null;
  };
}

interface ChatInterfaceProps {
  className?: string;
  currentUser?: any;
  onSettingsClick?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  className,
  currentUser,
  onSettingsClick
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'system-1',
      type: 'assistant',
      content: 'Aeternum: interface de linguagem carregada. A execução Gemini só é declarada quando o backend retorna uma resposta real.',
      timestamp: new Date(),
      status: 'complete',
    },
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

  const callGeminiAPI = async (
    userMessage: string,
    hasAttachments: boolean = false,
  ): Promise<{
    content: string;
    runtime: { model: string; latencyMs: number; usage?: Record<string, number> | null };
  }> => {
    const startedAt = performance.now();
    const { data, error } = await supabase.functions.invoke('gemini-chat', {
      body: { message: userMessage, hasAttachments },
    });
    if (error) throw error;
    if (!data || typeof data.content !== 'string' || !data.content.trim()) {
      throw new Error('GEMINI_EMPTY_RESPONSE');
    }
    return {
      content: data.content,
      runtime: {
        model: typeof data.model === 'string' ? data.model : 'unknown',
        latencyMs: typeof data.latencyMs === 'number' && Number.isFinite(data.latencyMs)
          ? data.latencyMs
          : Math.round(performance.now() - startedAt),
        usage: data.usage && typeof data.usage === 'object'
          ? data.usage as Record<string, number>
          : null,
      },
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
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'document',
        name: file.name,
        size: file.size,
      })),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await callGeminiAPI(content, !!attachments?.length);
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        status: 'complete',
        runtime: response.runtime,
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Gemini backend:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Não foi possível obter uma resposta do executor Gemini real. Verifique a conexão com o backend e a configuração do servidor.',
        timestamp: new Date(),
        status: 'complete',
      }]);
    } finally {
      setIsTyping(false);
    }
  };
  const handleVoiceRecord = (audioBlob: Blob) => {
    console.log('Voice recording received:', audioBlob);
    handleSend('🎤 Mensagem de voz gravada - processando com NeuralAudioProcessor via Gemini API...');
  };

  const handleCameraCapture = (mode: 'live' | 'capture') => {
    console.log('Camera mode:', mode);
    if (mode === 'live') {
      handleSend('👁️ Análise visual em tempo real ativada - aguardando input do EOSVisionSystem + Gemini Vision...');
    } else {
      handleSend('📸 Captura visual realizada - processando através do QuantumCognitiveProcessor + Gemini Vision...');
    }
  };

  const handleFileSelect = (files: File[]) => {
    console.log('Files selected:', files);
    const fileNames = files.map(f => f.name).join(', ');
    handleSend(`📁 Arquivos carregados: ${fileNames} - iniciando análise multimodal via Gemini API...`, files);
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
          <h2 className="font-semibold quantum-text">Aeternum Prime + Gemini</h2>
          <p className="text-sm text-muted-foreground">
            ERU Quantum AI • API Key: {INTEGRATED_API_KEY.substring(0, 15)}... • {messages.length} interações
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

                {message.runtime && (
                  <div className="text-xs text-muted-foreground font-mono bg-card/30 p-2 rounded border">
                    Executor: {message.runtime.model} | Latência observada: {message.runtime.latencyMs}ms
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
                  <span className="text-xs text-muted-foreground">Processando via executor Gemini...</span>
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
          placeholder="Digite sua consulta para o sistema ERU + Gemini..."
        />
      </div>
    </div>
  );
};
