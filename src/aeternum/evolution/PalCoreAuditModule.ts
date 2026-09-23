export type PalCoreAuditRequest = {
  target: string;
  scope?: string;
};

export type PalCoreAuditResult = {
  status: "completed" | "handler_not_bound";
  target: string;
  report?: unknown;
  evidence?: unknown;
  execution: "real" | "not_claimed";
};

export type PalCoreAuditExecutor = (
  request: PalCoreAuditRequest,
) => Promise<Omit<PalCoreAuditResult, "status" | "execution">>;

/**
 * N03-side M7 audit adapter.
 *
 * The current N03 repository does not expose a PAL-core runtime authority.
 * Therefore this adapter never reports "healthy" from a placeholder and waits
 * for a real audit executor.
 */
export class PalCoreAuditModule {
  readonly id = "M7.palcore-audit";
  private active = false;
  private readonly audits: PalCoreAuditResult[] = [];

  constructor(private readonly executor?: PalCoreAuditExecutor) {}

  activate(): void {
    this.active = true;
  }

  deactivate(): void {
    this.active = false;
  }

  async audit(request: PalCoreAuditRequest): Promise<PalCoreAuditResult> {
    if (!this.active || !this.executor) {
      return {
        status: "handler_not_bound",
        target: request.target,
        execution: "not_claimed",
      };
    }

    const produced = await this.executor({ ...request });
    const result: PalCoreAuditResult = {
      status: "completed",
      target: request.target,
      report: produced.report,
      evidence: produced.evidence,
      execution: "real",
    };

    this.audits.push(result);
    return result;
  }

  history(): PalCoreAuditResult[] {
    return [...this.audits];
  }
}

export const palCoreAuditModule = new PalCoreAuditModule();
