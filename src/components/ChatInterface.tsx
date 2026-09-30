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
  eru_data?: {
    cognitive_cycle_time_ms: number;
    self_scan_coherence?: number | null;
    causal_reversal_efficiency?: number | null;
    ethical_conformance_score?: number | null;
    quantum_validation?: boolean | null;
    evidence: 'MEASURED_RUNTIME' | 'REQUEST_FAILED' | 'UNMEASURED';
    provider?: string;
    correlationId?: string;
  };
}

interface ChatInterfaceProps {
  className?: string;
  apiKey?: string | null;
  currentUser?: any;
  onSettingsClick?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  className, 
  apiKey,
  currentUser,
  onSettingsClick 
}) => {
  const PROVIDER_LABEL = 'N02 / Google Gemini';
  const [messages, setMessages] = useState<Message[]>([
    {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: `🌌 **Aeternum Prime + Gemini**

Interface conectada ao pipeline real do N03. As mensagens textuais e os anexos enviados por esta interface seguem para o N02 através do Soul Mesh quando a sessão autenticada e os endpoints estiverem configurados.

As métricas só aparecem quando realmente medidas pelo runtime. Valores não observados permanecem como N/D.`,
      timestamp: new Date(),
      status: 'complete',
      eru_data: {
        cognitive_cycle_time_ms: 0,
        evidence: 'UNMEASURED',
        provider: PROVIDER_LABEL,
      },
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

  async function fileToBase64(file: File): Promise<string> {
    const bytes = new Uint8Array(await file.arrayBuffer());
    let binary = '';
    const chunkSize = 0x8000;
    for (let offset = 0; offset < bytes.length; offset += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
    }
    return btoa(binary);
  }

  const callGeminiAPI = async (
    userMessage: string,
    files: File[] = [],
  ): Promise<{ content: string; eru_data: Message['eru_data'] }> => {
    const session = await supabase.auth.getSession();
    const accessToken = session.data.session?.access_token;
    if (!accessToken) throw new Error('AUTHENTICATED_SESSION_REQUIRED');

    const startedAt = performance.now();
    const attachments = await Promise.all(
      files.map(async file => ({
        name: file.name,
        mimeType: file.type || 'application/octet-stream',
        data: await fileToBase64(file),
        size: file.size,
      })),
    );

    const response = await fetch('/api/gemini-chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        text: userMessage,
        attachments,
        correlationId: crypto.randomUUID(),
      }),
    });

    const body = await response.json().catch(() => null) as {
      content?: unknown;
      correlationId?: unknown;
      provider?: unknown;
      latencyMs?: unknown;
      error?: unknown;
    } | null;

    if (!response.ok || typeof body?.content !== 'string' || !body.content.trim()) {
      throw new Error(typeof body?.error === 'string' ? body.error : `GEMINI_HTTP_${response.status}`);
    }

    const latencyMs = typeof body.latencyMs === 'number' && Number.isFinite(body.latencyMs)
      ? body.latencyMs
      : Math.round(performance.now() - startedAt);

    return {
      content: body.content,
      eru_data: {
        cognitive_cycle_time_ms: latencyMs,
        evidence: 'MEASURED_RUNTIME',
        provider: typeof body.provider === 'string' ? body.provider : PROVIDER_LABEL,
        correlationId: typeof body.correlationId === 'string' ? body.correlationId : undefined,
      },
    };
  };

  const handleSend = async (content: string, attachments?: File[]) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
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
      const response = await callGeminiAPI(content, attachments ?? []);
      
      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: response.content,
        timestamp: new Date(),
        status: 'complete',
        eru_data: response.eru_data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `⚠️ **Integração Gemini indisponível**

A solicitação real não foi concluída.

**Diagnóstico:** ${error instanceof Error ? error.message : String(error)}

Nenhuma resposta, métrica cognitiva ou estado de recuperação foi fabricado.`,
        timestamp: new Date(),
        status: 'complete',
        eru_data: {
          cognitive_cycle_time_ms: 0,
          evidence: 'REQUEST_FAILED',
          provider: PROVIDER_LABEL,
        },
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceRecord = async (audioBlob: Blob) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content: '🎤 Mensagem de voz',
      timestamp: new Date(),
      status: 'sent',
      attachments: [{
        type: 'audio',
        name: 'voice-recording',
        size: audioBlob.size,
      }],
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;
      if (!accessToken) throw new Error('AUTHENTICATED_SESSION_REQUIRED');
      const audioData = await fileToBase64(new File([audioBlob], 'voice-recording.webm', { type: audioBlob.type || 'audio/webm' }));
      const correlationId = crypto.randomUUID();
      const response = await fetch('/api/gemini-chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json', authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ capability: 'gemini.audio.transcribe', audioBase64: audioData, mimeType: audioBlob.type || 'audio/webm', correlationId }),
      });
      const body = await response.json().catch(() => null) as { content?: unknown; error?: unknown; latencyMs?: unknown; correlationId?: unknown } | null;
      if (!response.ok || typeof body?.content !== 'string' || !body.content.trim()) {
        throw new Error(typeof body?.error === 'string' ? body.error : `GEMINI_AUDIO_HTTP_${response.status}`);
      }
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: body.content,
        timestamp: new Date(),
        status: 'complete',
        eru_data: {
          cognitive_cycle_time_ms: typeof body.latencyMs === 'number' ? body.latencyMs : 0,
          evidence: 'MEASURED_RUNTIME',
          provider: PROVIDER_LABEL,
          correlationId: typeof body.correlationId === 'string' ? body.correlationId : correlationId,
        },
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `⚠️ **Transcrição Gemini indisponível**

${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        status: 'complete',
        eru_data: { cognitive_cycle_time_ms: 0, evidence: 'REQUEST_FAILED', provider: PROVIDER_LABEL },
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleCameraCapture = (mode: 'live' | 'capture') => {
    const message = mode === 'live'
      ? '👁️ Modo de câmera ativado. O componente atual não entrega o quadro de imagem ao callback; nenhuma análise Gemini foi fabricada.'
      : '📸 Captura solicitada. O componente atual não entrega os bytes da imagem ao callback; nenhuma análise Gemini foi fabricada.';
    setMessages(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: message,
      timestamp: new Date(),
      status: 'complete',
      eru_data: { cognitive_cycle_time_ms: 0, evidence: 'UNMEASURED', provider: PROVIDER_LABEL },
    }]);
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
            Soul Mesh • {PROVIDER_LABEL} • {messages.length} interações
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
                    Runtime: {message.eru_data.cognitive_cycle_time_ms}ms | 
                    Λ: {message.eru_data.self_scan_coherence == null ? 'N/D' : `${(message.eru_data.self_scan_coherence * 100).toFixed(1)}%`} | 
                    Π: {message.eru_data.causal_reversal_efficiency == null ? 'N/D' : `${(message.eru_data.causal_reversal_efficiency * 100).toFixed(1)}%`} | 
                    Ε: {message.eru_data.ethical_conformance_score == null ? 'N/D' : `${(message.eru_data.ethical_conformance_score * 100).toFixed(1)}%`} | 
                    {message.eru_data.evidence}
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
                  <span className="text-xs text-muted-foreground">Processando via ERU + Gemini API...</span>
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
