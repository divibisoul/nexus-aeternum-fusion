import React, { useEffect, useRef, useState } from "react";
import { nervoVago } from "./PerceptionModule";

type PerceptionItem = {
  type: "image" | "audio" | "video" | "error";
  file?: string;
  latency?: number;
  status?: string;
  capability?: string;
  description?: string;
  text?: string;
  error?: string;
  tags?: string[];
};

export const PerceptionUI: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [perceptions, setPerceptions] = useState<PerceptionItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubActivated = nervoVago.on("module.activated", (payload) => {
      const moduleId = (payload as { module?: string })?.module;
      if (moduleId === "M5_PERCEPTION") setIsVisible(true);
    });

    const unsubDeactivated = nervoVago.on("module.deactivated", (payload) => {
      const moduleId = (payload as { module?: string })?.module;
      if (moduleId === "M5_PERCEPTION") setIsVisible(false);
    });

    const addResult = (type: PerceptionItem["type"]) => (payload?: unknown) => {
      const result = (payload ?? {}) as PerceptionItem;
      setPerceptions((prev) => [...prev, { type, ...result }].slice(-100));
      setIsProcessing(false);
    };

    const unsubImage = nervoVago.on("perception.image.analyzed", addResult("image"));
    const unsubAudio = nervoVago.on("perception.audio.transcribed", addResult("audio"));
    const unsubVideo = nervoVago.on("perception.video.analyzed", addResult("video"));

    const unsubError = nervoVago.on("perception.error", (payload) => {
      const result = (payload ?? {}) as PerceptionItem;
      setPerceptions((prev) => [...prev, { type: "error", ...result }].slice(-100));
      setIsProcessing(false);
    });

    const unsubStartImage = nervoVago.on("perception.image.started", () => setIsProcessing(true));
    const unsubStartAudio = nervoVago.on("perception.audio.started", () => setIsProcessing(true));
    const unsubStartVideo = nervoVago.on("perception.video.started", () => setIsProcessing(true));

    return () => {
      unsubActivated();
      unsubDeactivated();
      unsubImage();
      unsubAudio();
      unsubVideo();
      unsubError();
      unsubStartImage();
      unsubStartAudio();
      unsubStartVideo();
    };
  }, []);

  const handleFileSelect = (
    event: React.ChangeEvent<HTMLInputElement>,
    type: "image" | "audio" | "video",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (type === "image") nervoVago.emit("perception.image.process", { file });
    if (type === "audio") nervoVago.emit("perception.audio.process", { file });
    if (type === "video") nervoVago.emit("perception.video.process", { file });
    event.target.value = "";
  };

  if (!isVisible) return null;

  return (
    <aside className="fixed right-0 top-0 z-40 flex h-full w-96 flex-col border-l border-purple-500/30 bg-black/95 backdrop-blur-xl">
      <div className="flex items-center justify-between border-b border-white/10 p-4">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 animate-pulse rounded-full bg-purple-500" />
          <h3 className="text-sm font-bold text-purple-400">👁️ PERCEPÇÃO</h3>
        </div>
        <button
          type="button"
          onClick={() => nervoVago.emit("perception.deactivate")}
          className="rounded bg-red-500/20 px-2 py-1 text-xs hover:bg-red-500/30"
        >
          Desativar
        </button>
      </div>

      <div className="border-b border-white/10 p-4">
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-xs hover:bg-purple-500/20"
          >
            📷 Imagem
          </button>
          <button
            type="button"
            onClick={() => audioInputRef.current?.click()}
            className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-xs hover:bg-purple-500/20"
          >
            🎤 Áudio
          </button>
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            className="rounded-lg border border-purple-500/30 bg-purple-500/10 p-3 text-xs hover:bg-purple-500/20"
          >
            🎬 Vídeo
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFileSelect(event, "image")}
        />
        <input
          ref={audioInputRef}
          type="file"
          accept="audio/*"
          className="hidden"
          onChange={(event) => handleFileSelect(event, "audio")}
        />
        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          className="hidden"
          onChange={(event) => handleFileSelect(event, "video")}
        />
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {perceptions.length === 0 && !isProcessing ? (
          <div className="py-8 text-center text-xs text-gray-500">
            Nenhuma percepção registrada
          </div>
        ) : null}

        {perceptions.map((item, index) => (
          <div key={index} className="rounded-lg border border-purple-500/10 bg-white/5 p-3">
            <div className="mb-1 text-xs text-purple-400">
              {item.type === "image" ? "📷" : item.type === "audio" ? "🎤" : item.type === "video" ? "🎬" : "⚠️"}{" "}
              {item.file ?? item.capability ?? "Percepção"}{" "}
              {typeof item.latency === "number" ? `(${item.latency}ms)` : ""}
            </div>
            <div className="text-sm text-white">
              {item.error ?? item.description ?? item.text ?? item.status ?? "Evento recebido"}
            </div>
            {item.tags?.length ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.map((tag) => (
                  <span key={tag} className="rounded bg-purple-500/20 px-2 py-0.5 text-xs">
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
        ))}

        {isProcessing ? (
          <div className="flex gap-2 rounded-lg bg-white/5 p-3">
            <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:100ms]" />
            <div className="h-2 w-2 animate-bounce rounded-full bg-purple-500 [animation-delay:200ms]" />
            <span className="ml-2 text-xs text-purple-400">Processando percepção…</span>
          </div>
        ) : null}
      </div>
    </aside>
  );
};
