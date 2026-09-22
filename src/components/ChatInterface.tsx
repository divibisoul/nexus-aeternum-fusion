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
  Settings,
  AlertCircle
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
  status?: 'sending' | 'sent' | 'processing' | 'complete' | 'error';
  eru_data?: {
    cognitive_cycle_time_ms?: number;
    self_scan_coherence?: number;
    causal_reversal_efficiency?: number;
    ethical_conformance_score?: number;
    quantum_validation?: boolean;
    evidenceStatus?: 'OBSERVED' | 'UNMEASURED';
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
  const callCognitiveAPI = async (
    userMessage: string,
    attachments: File[] = [],
  ): Promise<{ content: string; eru_data?: Message['eru_data'] }> => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !sessionData.session?.access_token) {
      throw new Error('AUTH_SESSION_REQUIRED');
    }

    const correlationId = crypto.randomUUID();
    const response = await fetch('/api/cognitive', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: 'Bearer ' + sessionData.session.access_token,
        'x-correlation-id': correlationId,
      },
      body: JSON.stringify({
        text: userMessage,
        attachmentNames: attachments.map(file => file.name).slice(0, 20),
      }),
      cache: 'no-store',
    });

    const body: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      const errorBody = body && typeof body === 'object' && body !== null && !Array.isArray(body)
        ? (body as Record<string, unknown>)
        : {};
      throw new Error(typeof errorBody.error === 'string' ? errorBody.error : 'COGNITIVE_BACKEND_FAILED');
    }

    const record = body && typeof body === 'object' && !Array.isArray(body)
      ? body as Record<string, unknown>
      : null;
    const result = record?.result && typeof record.result === 'object' && !Array.isArray(record.result)
      ? record.result as Record<string, unknown>
      : null;
    const text = result && typeof result.text === 'string' ? result.text : '';
    if (!text) throw new Error('COGNITIVE_EMPTY_RESPONSE');

    return {
      content: text,
      eru_data: {
        evidenceStatus: 'OBSERVED',
        correlationId: typeof record?.correlationId === 'string' ? record.correlationId : undefined,
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
        type: file.type.startsWith('image/') ? 'image' : 
              file.type.startsWith('audio/') ? 'audio' : 'document',
        name: file.name,
        size: file.size
      }))
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);

    try {
      const response = await callCognitiveAPI(content, attachments ?? []);
      
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
      console.error('Error calling Gemini API:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `⚠️ **Backend cognitivo indisponível**

A solicitação não foi apresentada como concluída porque o executor real não respondeu.

**Diagnóstico:** ${error instanceof Error ? error.message : 'COGNITIVE_BACKEND_FAILED'}`,
        timestamp: new Date(),
        status: 'error',
        eru_data: {
          evidenceStatus: 'UNMEASURED',
        },
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceRecord = (audioBlob: Blob) => {
    console.log('Voice recording received:', audioBlob);
    handleSend('🎤 Mensagem de voz gravada - processamento multimodal depende do backend autorizado...');
  };

  const handleCameraCapture = (mode: 'live' | 'capture') => {
    console.log('Camera mode:', mode);
    if (mode === 'live') {
      handleSend('👁️ Análise visual em tempo real ativada - aguardando processamento visual pelo backend autorizado...');
    } else {
      handleSend('📸 Captura visual realizada - processamento visual depende do backend autorizado...');
    }
  };

  const handleFileSelect = (files: File[]) => {
    console.log('Files selected:', files);
    const fileNames = files.map(f => f.name).join(', ');
    handleSend(`📁 Arquivos carregados: ${fileNames} - análise multimodal depende do backend autorizado...`, files);
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
      case 'error': return <AlertCircle className="w-3 h-3 text-destructive" />;
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
            ERU Cognitive Mesh • Backend N03 → N02 • {messages.length} interações
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
                    {typeof message.eru_data.cognitive_cycle_time_ms === 'number'
                      ? `ERU: ${message.eru_data.cognitive_cycle_time_ms}ms | `
                      : ''}
                    {typeof message.eru_data.self_scan_coherence === 'number'
                      ? `Λ: ${(message.eru_data.self_scan_coherence * 100).toFixed(1)}% | `
                      : ''}
                    {typeof message.eru_data.causal_reversal_efficiency === 'number'
                      ? `Π: ${(message.eru_data.causal_reversal_efficiency * 100).toFixed(1)}% | `
                      : ''}
                    {typeof message.eru_data.ethical_conformance_score === 'number'
                      ? `Ε: ${(message.eru_data.ethical_conformance_score * 100).toFixed(1)}%`
                      : 'ERU métricas: não mensuradas'}
                    {message.eru_data.correlationId
                      ? ` • correlation: ${message.eru_data.correlationId}`
                      : ''}
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
                  <span className="text-xs text-muted-foreground">Processando pelo backend cognitivo...</span>
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
          placeholder="Digite sua consulta para o backend cognitivo real..."
        />
      </div>
    </div>
  );
};
