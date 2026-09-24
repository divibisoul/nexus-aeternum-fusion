import React, { useEffect, useRef, useState } from 'react';
import { NexusInput } from '@/components/NexusInput';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CognitiveMetrics } from '@/components/CognitiveMetrics';
import { Bot, User, Zap, Brain, Eye, Mic, Image as ImageIcon, FileText, Clock, CheckCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SoulNexusCapability, SoulNexusRequest, SoulNexusResult } from '@/integration/SoulNexusBridge';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{
    type: 'image' | 'audio' | 'document';
    name: string;
    size?: number;
  }>;
  status?: 'sending' | 'sent' | 'processing' | 'complete' | 'error';
  eru_data?: Record<string, unknown>;
}

interface ChatInterfaceProps {
  className?: string;
  /** Deprecated compatibility prop. API credentials never belong in this browser component. */
  apiKey?: string | null;
  currentUser?: { id?: string; email?: string; username?: string } | null;
  onSettingsClick?: () => void;
}

type BridgeOutput = {
  text?: string;
  content?: string;
  eru_data?: Record<string, unknown>;
  [key: string]: unknown;
};

function requestThroughBridge(
  capability: SoulNexusCapability,
  input: unknown,
  context: Record<string, unknown>,
): Promise<BridgeOutput> {
  const requestId = crypto.randomUUID();
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      window.removeEventListener('soul:nexus:result', handleResult);
      window.removeEventListener('soul:nexus:event', handleEvent);
      clearTimeout(timer);
    };

    const handleResult = (event: Event) => {
      const result = (event as CustomEvent<SoulNexusResult>).detail;
      if (!result || result.requestId !== requestId) return;
      cleanup();
      if (!result.success) {
        reject(new Error(result.error?.message || result.error?.code || 'NEXUS_REQUEST_FAILED'));
        return;
      }
      const output = result.output;
      if (typeof output === 'string') {
        resolve({ text: output });
        return;
      }
      if (output && typeof output === 'object' && !Array.isArray(output)) {
        resolve(output as BridgeOutput);
        return;
      }
      resolve({ text: JSON.stringify(output ?? null) });
    };

    const handleEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string; data?: unknown }>).detail;
      if (detail?.type === 'ready') return;
    };

    const timer = window.setTimeout(() => {
      cleanup();
      reject(new Error('NEXUS_REQUEST_TIMEOUT'));
    }, 30_000);

    window.addEventListener('soul:nexus:result', handleResult);
    window.addEventListener('soul:nexus:event', handleEvent);

    const request: SoulNexusRequest = {
      version: 1,
      requestId,
      capability,
      input,
      context,
    };
    window.dispatchEvent(new CustomEvent('soul:nexus:request', { detail: request }));
  });
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  className,
  currentUser,
  onSettingsClick,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const username = currentUser?.username || currentUser?.email?.split('@')[0] || 'Usuário';
    setMessages([{
      id: crypto.randomUUID(),
      type: 'assistant',
      content: `Aeternum conectado ao bridge real do Nexus, ${username}. O processamento de conversa depende de um piloto de IA autenticado e conectado; nenhum estado ou resposta sintética é apresentado como execução real.`,
      timestamp: new Date(),
      status: 'complete',
    }]);
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callNexus = async (userMessage: string, hasAttachments: boolean): Promise<BridgeOutput> => {
    return requestThroughBridge(
      'cognitive-ui',
      {
        text: userMessage,
        attachments: hasAttachments,
      },
      {
        userId: currentUser?.id ?? 'anonymous',
        client: 'n03-chat-interface',
      },
    );
  };

  const handleSend = async (content: string, attachments?: File[]) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
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

    setMessages(previous => [...previous, userMessage]);
    setIsTyping(true);

    try {
      const response = await callNexus(content, Boolean(attachments?.length));
      const text = typeof response.text === 'string'
        ? response.text
        : typeof response.content === 'string'
          ? response.content
          : JSON.stringify(response, null, 2);

      setMessages(previous => [...previous, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: text,
        timestamp: new Date(),
        status: 'complete',
        eru_data: response.eru_data,
      }]);
    } catch (error) {
      setMessages(previous => [...previous, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `O processamento não foi executado. Motivo real: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date(),
        status: 'error',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceRecord = (_audioBlob: Blob) => {
    setMessages(previous => [...previous, {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: 'Áudio recebido pela interface, mas nenhum executor de processamento de áudio foi conectado a este componente.',
      timestamp: new Date(),
      status: 'error',
    }]);
  };

  const handleCameraCapture = (_mode: 'live' | 'capture') => {
    setMessages(previous => [...previous, {
      id: crypto.randomUUID(),
      type: 'assistant',
      content: 'Captura visual recebida pela interface, mas nenhum executor multimodal foi conectado a este componente.',
      timestamp: new Date(),
      status: 'error',
    }]);
  };

  const handleFileSelect = (files: File[]) => {
    void handleSend(
      `Arquivos selecionados para processamento: ${files.map(file => file.name).join(', ')}`,
      files,
    );
  };

  const getStatusIcon = (status?: Message['status']) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 animate-spin" />;
      case 'sent': return <CheckCircle className="w-3 h-3" />;
      case 'processing': return <Brain className="w-3 h-3 animate-pulse" />;
      case 'complete': return <Zap className="w-3 h-3" />;
      case 'error': return <span className="text-xs text-destructive">!</span>;
      default: return null;
    }
  };

  const renderAttachment = (attachment: NonNullable<Message['attachments']>[number]) => {
    const icons = {
      image: <ImageIcon className="w-4 h-4" />,
      audio: <Mic className="w-4 h-4" />,
      document: <FileText className="w-4 h-4" />,
    };

    return (
      <div key={attachment.name} className="flex items-center gap-2 p-2 bg-muted/30 rounded border text-xs">
        {icons[attachment.type]}
        <span className="truncate flex-1">{attachment.name}</span>
        {attachment.size !== undefined && (
          <span className="text-muted-foreground">{(attachment.size / 1024).toFixed(1)}KB</span>
        )}
      </div>
    );
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-3 p-4 border-b quantum-border bg-card/50 backdrop-blur-md">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center quantum-glow">
          <Brain className="w-5 h-5 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h2 className="font-semibold quantum-text">Aeternum Prime</h2>
          <p className="text-sm text-muted-foreground">
            Bridge Nexus • {messages.length} interações
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMetrics(previous => !previous)} className="quantum-border">
            <Eye className="w-4 h-4 mr-2" /> Métricas
          </Button>
          {onSettingsClick && (
            <Button variant="outline" size="sm" onClick={onSettingsClick} className="quantum-border">
              <Settings className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {showMetrics && (
        <div className="p-4 border-b quantum-border bg-card/30">
          <CognitiveMetrics expanded={false} />
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map(message => (
            <div key={message.id} className={cn('flex gap-3 max-w-4xl', message.type === 'user' ? 'ml-auto flex-row-reverse' : '')}>
              <div className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                message.type === 'user' ? 'bg-secondary neural-glow' : 'bg-gradient-to-br from-primary to-accent quantum-glow',
              )}>
                {message.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-primary" />}
              </div>

              <div className={cn('flex-1 space-y-2', message.type === 'user' ? 'text-right' : '')}>
                <div className={cn('inline-block p-3 rounded-lg quantum-border bg-card/80 backdrop-blur-sm', message.type === 'user' ? 'bg-secondary/20 neural-glow' : 'bg-primary/5 quantum-glow')}>
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {message.content.split('\n').map((line, index) =>
                      line ? <p key={index} className="my-1">{line}</p> : <br key={index} />
                    )}
                  </div>
                </div>

                {message.eru_data && (
                  <div className="text-xs text-muted-foreground font-mono bg-card/30 p-2 rounded border">
                    Evidência ERU retornada pelo executor: {JSON.stringify(message.eru_data)}
                  </div>
                )}

                {message.attachments && message.attachments.length > 0 && (
                  <div className="space-y-1">{message.attachments.map(renderAttachment)}</div>
                )}

                <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', message.type === 'user' ? 'justify-end' : '')}>
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {getStatusIcon(message.status)}
                </div>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent quantum-glow flex items-center justify-center">
                <Bot className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className="bg-card/80 backdrop-blur-sm quantum-border rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Aguardando resultado do executor Nexus...</span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t quantum-border bg-card/30 backdrop-blur-md">
        <NexusInput
          onSend={handleSend}
          onVoiceRecord={handleVoiceRecord}
          onCameraCapture={handleCameraCapture}
          onFileSelect={handleFileSelect}
          placeholder="Enviar consulta ao executor conectado..."
        />
      </div>
    </div>
  );
};
