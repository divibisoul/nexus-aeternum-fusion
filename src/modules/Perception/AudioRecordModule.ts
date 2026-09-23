import { hortaCore, nervoVago, wormhole } from "./PerceptionModule";

export class AudioRecordModule {
  readonly id = "audio-record";
  private active = false;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recording = false;

  constructor() {
    wormhole.register(this.id, this, {
      type: "service",
      version: "1.0.0",
      capabilities: ["audio-recording", "microphone-access"],
      dependencies: ["nervoVago", "hortaCore"],
    });

    this.active = hortaCore.get<boolean>(`${this.id}.active`) ?? false;
    nervoVago.on("audio.record.start", () => void this.startRecording());
    nervoVago.on("audio.record.stop", () => this.stopRecording());
  }

  activate(): void {
    this.active = true;
    hortaCore.set(`${this.id}.active`, true);
    nervoVago.emit("module.activated", { module: this.id });
  }

  deactivate(): void {
    this.stopRecording();
    this.active = false;
    hortaCore.set(`${this.id}.active`, false);
    nervoVago.emit("module.deactivated", { module: this.id });
  }

  async startRecording(): Promise<void> {
    if (this.recording) return;
    if (!this.active) this.activate();

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      nervoVago.emit("audio.error", {
        message: "A captura de áudio não está disponível neste runtime.",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const audioBlob = new Blob(this.audioChunks, {
          type: this.mediaRecorder?.mimeType || "audio/webm",
        });
        const audioFile = new File([audioBlob], `recording-${Date.now()}.webm`, {
          type: audioBlob.type,
        });
        this.isActiveAfterStop();
        nervoVago.emit("perception.audio.process", {
          file: audioFile,
          source: "microphone",
        });
        stream.getTracks().forEach((track) => track.stop());
      };

      this.mediaRecorder.start();
      this.recording = true;
      hortaCore.set(`${this.id}.recording`, true);
      nervoVago.emit("audio.recording.started", { timestamp: Date.now() });
    } catch (error) {
      this.recording = false;
      this.mediaRecorder = null;
      nervoVago.emit("audio.error", {
        message: "Não foi possível acessar o microfone.",
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  stopRecording(): void {
    if (!this.mediaRecorder || !this.recording) return;
    this.recording = false;
    hortaCore.set(`${this.id}.recording`, false);
    this.mediaRecorder.stop();
    nervoVago.emit("audio.recording.stopped", { timestamp: Date.now() });
  }

  isCurrentlyRecording(): boolean {
    return this.recording;
  }

  private isActiveAfterStop(): void {
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}

export const audioRecordModule = new AudioRecordModule();
