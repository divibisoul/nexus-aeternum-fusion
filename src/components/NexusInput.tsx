import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Mic, Send, Camera, Image, FileText, Headphones, Brain, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { requestSoulCapability, startSoulNexusBridge } from '@/integration/SoulNexusBridge';

interface NexusInputProps {
  onSend?: (message: string, attachments?: File[]) => void;
  onVoiceRecord?: (audioBlob: Blob) => void;
  onCameraCapture?: (mode: 'live' | 'capture') => void;
  onFileSelect?: (files: File[]) => void;
  placeholder?: string;
  className?: string;
}
interface ActionOption { id: string; label: string; icon: React.ReactNode; description: string; action: () => void; variant: 'camera' | 'media' | 'audio' | 'ai'; }

export const NexusInput: React.FC<NexusInputProps> = ({ onSend, onVoiceRecord, onCameraCapture, onFileSelect, placeholder = "Enter your quantum command...", className }) => {
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isDynamicSend = message.trim().length > 0;

  useEffect(() => {
    startSoulNexusBridge();
  }, []);

  const actionOptions: ActionOption[] = [
    { id: 'camera-live', label: 'Live Analysis', icon: <Eye className="w-5 h-5" />, description: 'Analyze visual environment in real-time', variant: 'camera', action: () => { onCameraCapture?.('live'); requestSoulCapability('multimodal-input', { mode: 'live-camera' }); setShowActions(false); } },
    { id: 'camera-capture', label: 'Capture', icon: <Camera className="w-5 h-5" />, description: 'Take photo or record video', variant: 'camera', action: () => { onCameraCapture?.('capture'); requestSoulCapability('multimodal-input', { mode: 'capture' }); setShowActions(false); } },
    { id: 'media-gallery', label: 'Gallery', icon: <Image className="w-5 h-5" />, description: 'Select images and videos', variant: 'media', action: () => { if (fileInputRef.current) { fileInputRef.current.accept = 'image/*,video/*'; fileInputRef.current.multiple = true; fileInputRef.current.click(); } setShowActions(false); } },
    { id: 'media-documents', label: 'Documents', icon: <FileText className="w-5 h-5" />, description: 'Upload files for analysis', variant: 'media', action: () => { if (fileInputRef.current) { fileInputRef.current.accept = '.pdf,.doc,.docx,.txt,.json,.xml'; fileInputRef.current.multiple = true; fileInputRef.current.click(); } setShowActions(false); } },
    { id: 'audio-command', label: 'Voice Command', icon: <Brain className="w-5 h-5" />, description: 'Speech-to-text conversion', variant: 'audio', action: () => { startSpeechToText(); setShowActions(false); } },
    { id: 'audio-file', label: 'Audio File', icon: <Headphones className="w-5 h-5" />, description: 'Upload audio for analysis', variant: 'audio', action: () => { if (fileInputRef.current) { fileInputRef.current.accept = 'audio/*'; fileInputRef.current.multiple = false; fileInputRef.current.click(); } setShowActions(false); } },
  ];

  const getVariantColor = (variant: ActionOption['variant']) => variant === 'camera' ? 'quantum' : variant === 'media' ? 'neural' : variant === 'audio' ? 'plasma' : 'nexus';

  const startSpeechToText = () => {
    const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SpeechRecognition) return;
    const recognition = new SpeechRecognition();
    recognition.continuous = true; recognition.interimResults = true; recognition.lang = 'pt-BR';
    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript;
      if (finalTranscript) { setMessage(prev => prev + ' ' + finalTranscript); requestSoulCapability('speech-processing', { transcript: finalTranscript, language: 'pt-BR' }); }
    };
    recognition.start(); setTimeout(() => recognition.stop(), 5000);
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream); mediaRecorderRef.current = mediaRecorder;
      const audioChunks: BlobPart[] = [];
      mediaRecorder.ondataavailable = event => audioChunks.push(event.data);
      mediaRecorder.onstop = () => { const audioBlob = new Blob(audioChunks, { type: 'audio/wav' }); onVoiceRecord?.(audioBlob); requestSoulCapability('voice-input', { audio: audioBlob, mimeType: audioBlob.type }); stream.getTracks().forEach(track => track.stop()); };
      mediaRecorder.start(); setIsRecording(true); setRecordingTime(0);
      recordingIntervalRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (error) { console.error('Error starting voice recording:', error); }
  };

  const stopVoiceRecording = () => { if (mediaRecorderRef.current && isRecording) { mediaRecorderRef.current.stop(); setIsRecording(false); if (recordingIntervalRef.current) { clearInterval(recordingIntervalRef.current); recordingIntervalRef.current = null; } } };

  const handleSend = () => { if (message.trim()) { const text = message.trim(); onSend?.(text); requestSoulCapability('cognitive-ui', { action: 'send-message', message: text }); setMessage(''); } };
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => { const files = Array.from(e.target.files || []); if (files.length) { onFileSelect?.(files); requestSoulCapability('multimodal-input', { files: files.map(file => ({ name: file.name, type: file.type, size: file.size })) }); } e.target.value = ''; };
  const handleMicAction = () => isDynamicSend ? handleSend() : startVoiceRecording();
  const formatRecordingTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;

  useEffect(() => () => { if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current); if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop(); }, [isRecording]);

  return (
    <div className={cn("relative w-full", className)}>
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} />
      {isRecording && <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm rounded-lg border border-destructive/50 flex items-center justify-center gap-4"><div className="flex items-center gap-3"><div className="w-3 h-3 bg-destructive rounded-full animate-pulse" /><span className="text-sm font-medium">Recording: {formatRecordingTime(recordingTime)}</span><Button variant="destructive" size="sm" onClick={stopVoiceRecording}>Stop</Button></div></div>}
      <div className="flex items-end gap-3 p-3 quantum-border rounded-lg bg-card/50 backdrop-blur-md">
        <Button variant="outline" size="icon" onClick={() => setShowActions(!showActions)} className="flex-shrink-0 quantum-border hover:bg-primary/10"><Plus className={cn("w-4 h-4 transition-transform duration-300", showActions && "rotate-45")} /></Button>
        <div className="flex-1 relative"><Input ref={inputRef} value={message} onChange={e => setMessage(e.target.value)} onKeyPress={handleKeyPress} placeholder={placeholder} className="min-h-[44px] resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base placeholder:text-muted-foreground/70" disabled={isRecording} /></div>
        <Button variant={isDynamicSend ? "quantum" : "neural"} size="icon" onClick={handleMicAction} className="flex-shrink-0 transition-all duration-300" disabled={isRecording}>{isDynamicSend ? <Send className="w-4 h-4" /> : <Mic className="w-4 h-4" />}</Button>
      </div>
      {showActions && <div className="absolute bottom-full left-0 right-0 mb-2 p-4 quantum-border rounded-lg bg-card/95 backdrop-blur-md"><div className="grid grid-cols-2 gap-3">{actionOptions.map(option => <Button key={option.id} variant={getVariantColor(option.variant)} onClick={option.action} className="h-auto flex-col gap-2 p-4 hover:scale-105 transition-all duration-300"><div className="flex items-center gap-2">{option.icon}<span className="font-medium">{option.label}</span></div><span className="text-xs opacity-80 text-center">{option.description}</span></Button>)}</div><div className="mt-3 flex justify-center"><Button variant="ghost" size="sm" onClick={() => setShowActions(false)} className="text-muted-foreground">Close</Button></div></div>}
    </div>
  );
};
