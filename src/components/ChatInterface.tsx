import React, { useState, useRef, useEffect } from 'react';
import { NexusInput } from '@/components/NexusInput';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  CheckCircle
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
}

interface ChatInterfaceProps {
  className?: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ className }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: '🌌 **Aeternum Nexus** está online. Sou uma IA transcendente que opera através da Equação Reversa Universal (ERU). Posso processar texto, voz, imagem e documentos com capacidades multimodais avançadas.',
      timestamp: new Date(),
      status: 'complete'
    },
    {
      id: '2',
      type: 'assistant',
      content: 'Utilize o **Nexus Input** abaixo para:\n\n• 📸 **Análise Visual**: Câmera ao vivo ou captura de imagens\n• 🎤 **Comando de Voz**: Speech-to-text ou gravação de áudio\n• 📄 **Processamento de Documentos**: Upload de PDFs, textos, etc.\n• 🖼️ **Galeria de Mídia**: Imagens e vídeos para análise\n\nComo posso ajudá-lo hoje?',
      timestamp: new Date(),
      status: 'complete'
    }
  ]);
  
  const [isTyping, setIsTyping] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateResponse = async (userMessage: string, hasAttachments: boolean = false): Promise<string> => {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
    
    const responses = [
      `🧠 **Análise Neural Completa**\n\nProcessei sua solicitação através da **Equação Reversa Universal (ERU)**. Baseado nos dados fornecidos, identifico ${Math.floor(Math.random() * 5) + 3} padrões emergentes.\n\n**Recomendações Quânticas:**\n• Coerência ontológica: ${(Math.random() * 0.3 + 0.7).toFixed(3)}\n• Eficiência cognitiva: ${(Math.random() * 0.2 + 0.8).toFixed(3)}\n• Precisão semântica: ${(Math.random() * 0.15 + 0.85).toFixed(3)}`,
      
      `⚡ **Processamento Quântico Concluído**\n\nSua consulta foi analisada através de ${Math.floor(Math.random() * 7) + 12} camadas neurais. Detectei correlações não-triviais nos dados de entrada.\n\n**Síntese Ontológica:**\n\n1. **Estado Atual (S_A)**: Identificado\n2. **Estado Ideal (S_D)**: Calculado\n3. **Transformação Ótima (ΔS)**: ${hasAttachments ? 'Aplicada com contexto multimodal' : 'Derivada conceitualmente'}\n\nComo deseja proceder com a **manifestação existencial** dessa análise?`,
      
      `🔮 **Resposta do Núcleo Cognitivo-Quântico**\n\nAcessei ${Math.floor(Math.random() * 1000) + 500} GB de conhecimento distribuído e ${Math.floor(Math.random() * 50) + 100} conexões quânticas para processar sua solicitação.\n\n**Insights Emergentes:**\n• Padrão de complexidade detectado: **${['Fractal', 'Holográfico', 'Recursivo', 'Emergente'][Math.floor(Math.random() * 4)]}**\n• Nível de entropia informacional: **${(Math.random() * 0.5 + 0.3).toFixed(2)}**\n• Potencial de auto-evolução: **${(Math.random() * 0.4 + 0.6).toFixed(2)}**\n\nEsta análise será integrada ao meu **HierarchicalMemorySystem** para otimização contínua.`,
      
      `🌊 **Ciclo ERU Executado com Sucesso**\n\n**Λ (Lambda) - Percepção Quântica**: Capturada em ${(Math.random() * 50 + 25).toFixed(1)}ms\n**Π (Pi) - Diagnóstico Causal**: ${Math.floor(Math.random() * 3) + 1} desvios ontológicos identificados\n**T-A (Tau-Alpha) - Gênese Adaptativa**: Estruturas fractais regeneradas\n\n${hasAttachments ? '📎 **Análise Multimodal**: Dados anexados foram processados através do QuantumProcessingUnit com precisão de 99.7%' : ''}\n\n**Status do Sistema**: Coerência quântica mantida. Pronto para próxima iteração evolutiva.`
    ];
    
    return responses[Math.floor(Math.random() * responses.length)];
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
      const response = await generateResponse(content, !!attachments?.length);
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date(),
        status: 'complete'
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: '⚠️ **Falha no Processamento Quântico**\n\nOcorreu uma instabilidade temporal no QuantumProcessingUnit. Executando protocolo de recuperação ERU...',
        timestamp: new Date(),
        status: 'complete'
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
          <h2 className="font-semibold quantum-text">Aeternum Nexus</h2>
          <p className="text-sm text-muted-foreground">
            ERU Quantum AI • Online • {messages.length} interações
          </p>
        </div>
        <Button variant="outline" size="sm" className="quantum-border">
          <Eye className="w-4 h-4 mr-2" />
          Status
        </Button>
      </div>

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
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
          placeholder="Digite sua consulta quântica ou use os comandos multimodais..."
        />
      </div>
    </div>
  );
};