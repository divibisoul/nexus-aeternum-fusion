import React, { useEffect, useRef, useState } from 'react';
import { NexusInput } from '@/components/NexusInput';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CognitiveMetrics } from '@/components/CognitiveMetrics';
import { Bot, User, Zap, Brain, Eye, Mic, Image as ImageIcon, FileText, Clock, CheckCircle, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { nexusCoreProcessor } from '@/core/NexusCoreProcessor';
import { startSoulNexusBridge } from '@/integration/SoulNexusBridge';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachments?: Array<{ type: 'image' | 'audio' | 'document'; name: string; size?: number }>;
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
  apiKey?: string | null;
  currentUser?: any;
  onSettingsClick?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className, currentUser, onSettingsClick }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: `🌌 **N03 Nexus** inicializado, ${currentUser?.username || 'Usuário'}.\n\nO runtime cognitivo agora passa pelo NexusCoreProcessor. Credenciais de provedores permanecem no servidor; esta interface não contém API keys.\n\nCapacidades locais registradas: voz, análise emocional, sabedoria, plantas, rituais, frequências e cognição híbrida.`,
      timestamp: new Date(),
      status: 'complete',
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const [showMetrics, setShowMetrics] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    startSoulNexusBridge();
    return () => undefined;
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const callN03 = async (content: string, attachments?: File[]) => {
    const startedAt = performance.now();
    const result = await nexusCoreProcessor.process({
      id: crypto.randomUUID(),
      capability: 'cognitive-ui',
      input: {
        text: content,
        attachments: attachments?.map((file) => ({ name: file.name, type: file.type, size: file.size })),
      },
      context: {
        nucleus: 'N03',
        userId: currentUser?.id,
        username: currentUser?.username,
      },
    });
    const elapsed = Math.round(performance.now() - startedAt);
    if (!result.success) throw new Error(result.error?.message ?? 'N03 capability execution failed');

    const output = result.output as { text?: string; provider?: string; model?: string } | undefined;
    return {
      content: output?.text ?? JSON.stringify(result.output, null, 2),
      provider: output?.provider,
      model: output?.model,
      elapsed,
    };
  };

  const handleSend = async (content: string, attachments?: File[]) => {
    const userMessage: Message = {
      id: crypto.randomUUID(),
      type: 'user',
      content,
      timestamp: new Date(),
      status: 'sent',
      attachments: attachments?.map((file) => ({
        type: file.type.startsWith('image/') ? 'image' : file.type.startsWith('audio/') ? 'audio' : 'document',
        name: file.name,
        size: file.size,
      })),
    };
    setMessages((previous) => [...previous, userMessage]);
    setIsTyping(true);

    try {
      const response = await callN03(content, attachments);
      setMessages((previous) => [...previous, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `${response.content}\n\n_Model: ${response.model ?? 'server-selected'}${response.provider ? ` • Provider: ${response.provider}` : ''} • N03 runtime: ${response.elapsed}ms_`,
        timestamp: new Date(),
        status: 'complete',
        eru_data: {
          cognitive_cycle_time_ms: response.elapsed,
          self_scan_coherence: 0,
          causal_reversal_efficiency: 0,
          ethical_conformance_score: 0,
          quantum_validation: false,
        },
      }]);
    } catch (error) {
      setMessages((previous) => [...previous, {
        id: crypto.randomUUID(),
        type: 'assistant',
        content: `⚠️ **Falha real no runtime N03**\n\n${error instanceof Error ? error.message : String(error)}\n\nNenhum resultado foi fabricado: a interface informa a falha do handler.`,
        timestamp: new Date(),
        status: 'complete',
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleVoiceRecord = (audioBlob: Blob) => {
    void handleSend('Mensagem de voz recebida pelo N03.', [new File([audioBlob], 'voice.webm', { type: audioBlob.type || 'audio/webm' })]);
  };

  const handleCameraCapture = (mode: 'live' | 'capture') => {
    void handleSend(mode === 'live' ? 'Entrada visual ao vivo solicitada.' : 'Entrada visual capturada.');
  };

  const handleFileSelect = (files: File[]) => {
    void handleSend(`Arquivos recebidos: ${files.map((file) => file.name).join(', ')}`, files);
  };

  const getMessageIcon = (message: Message) => message.type === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5 text-primary" />;

  const getStatusIcon = (status?: Message['status']) => {
    switch (status) {
      case 'sending': return <Clock className="w-3 h-3 animate-spin" />;
      case 'sent': return <CheckCircle className="w-3 h-3" />;
      case 'processing': return <Brain className="w-3 h-3 animate-pulse" />;
      case 'complete': return <Zap className="w-3 h-3" />;
      default: return null;
    }
  };

  const renderAttachment = (attachment: NonNullable<Message['attachments']>[number]) => {
    const icon = attachment.type === 'image' ? <ImageIcon className="w-4 h-4" /> : attachment.type === 'audio' ? <Mic className="w-4 h-4" /> : <FileText className="w-4 h-4" />;
    return <div key={`${attachment.name}-${attachment.size}`} className="flex items-center gap-2 p-2 bg-muted/30 rounded border text-xs">{icon}<span className="truncate flex-1">{attachment.name}</span><span className="text-muted-foreground">{((attachment.size ?? 0) / 1024).toFixed(1)}KB</span></div>;
  };

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <div className="flex items-center gap-3 p-4 border-b quantum-border bg-card/50 backdrop-blur-md">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center quantum-glow"><Brain className="w-5 h-5 text-primary-foreground" /></div>
        <div className="flex-1"><h2 className="font-semibold quantum-text">Aeternum Prime • N03 Nexus</h2><p className="text-sm text-muted-foreground">Hybrid AI runtime • {messages.length} interações</p></div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowMetrics(!showMetrics)} className="quantum-border"><Eye className="w-4 h-4 mr-2" />Métricas</Button>
          {onSettingsClick && <Button variant="outline" size="sm" onClick={onSettingsClick} className="quantum-border"><Settings className="w-4 h-4" /></Button>}
        </div>
      </div>

      {showMetrics && <div className="p-4 border-b quantum-border bg-card/30"><CognitiveMetrics expanded={false} /></div>}

      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className={cn('flex gap-3 max-w-4xl', message.type === 'user' ? 'ml-auto flex-row-reverse' : '')}>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', message.type === 'user' ? 'bg-secondary neural-glow' : 'bg-gradient-to-br from-primary to-accent quantum-glow')}>{getMessageIcon(message)}</div>
              <div className={cn('flex-1 space-y-2', message.type === 'user' ? 'text-right' : '')}>
                <div className={cn('inline-block p-3 rounded-lg quantum-border bg-card/80 backdrop-blur-sm', message.type === 'user' ? 'bg-secondary/20 neural-glow' : 'bg-primary/5 quantum-glow')}>
                  <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap">{message.content}</div>
                </div>
                {message.eru_data && <div className="text-xs text-muted-foreground font-mono bg-card/30 p-2 rounded border">N03 runtime: {message.eru_data.cognitive_cycle_time_ms}ms • quantum validation: not executed</div>}
                {message.attachments?.length ? <div className="space-y-1">{message.attachments.map(renderAttachment)}</div> : null}
                <div className={cn('flex items-center gap-2 text-xs text-muted-foreground', message.type === 'user' ? 'justify-end' : '')}><span>{message.timestamp.toLocaleTimeString()}</span>{getStatusIcon(message.status)}</div>
              </div>
            </div>
          ))}
          {isTyping && <div className="flex gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent quantum-glow flex items-center justify-center"><Bot className="w-5 h-5 text-primary-foreground" /></div><div className="bg-card/80 quantum-border rounded-lg p-3"><span className="text-xs text-muted-foreground">N03 executando capability...</span></div></div>}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t quantum-border bg-card/30 backdrop-blur-md"><NexusInput onSend={handleSend} onVoiceRecord={handleVoiceRecord} onCameraCapture={handleCameraCapture} onFileSelect={handleFileSelect} placeholder="Digite sua consulta para o N03 híbrido..." /></div>
    </div>
  );
};
