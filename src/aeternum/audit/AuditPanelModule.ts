export type AuditSeverity = "info" | "warning" | "error";
export interface AuditLogEntry { id: string; type: string; message: string; severity: AuditSeverity; timestamp: number; data?: unknown; }

export interface AuditSource { read(): readonly AuditLogEntry[]; }

export class AuditPanelModule {
  readonly id = "audit-panel";
  private active = false;
  private readonly entries: AuditLogEntry[] = [];

  constructor(private readonly source?: AuditSource) {}

  activate(): void { this.active = true; }
  deactivate(): void { this.active = false; }

  ingest(entry: Omit<AuditLogEntry, "id" | "timestamp">): void {
    if (!this.active) return;
    const normalized = entry.message.trim();
    if (!normalized) throw new Error("AUDIT_MESSAGE_REQUIRED");
    this.entries.unshift({ ...entry, id: "audit-" + Date.now() + "-" + this.entries.length, timestamp: Date.now() });
    if (this.entries.length > 500) this.entries.pop();
  }

  read(): AuditLogEntry[] {
    const observed = this.source?.read() ?? [];
    return [...observed, ...this.entries].slice(0, 500);
  }
}
export const auditPanelModule = new AuditPanelModule();
