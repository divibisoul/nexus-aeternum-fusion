import React from "react";
import type { AuditLogEntry } from "./AuditPanelModule";

export const AuditPanelUI: React.FC<{ logs: readonly AuditLogEntry[]; onClear?: () => void }> = ({ logs, onClear }) => (
  <section className="bg-black/90 backdrop-blur-xl rounded-lg border border-cyan-500/30 w-full max-h-64 flex flex-col">
    <header className="p-2 border-b border-white/10 flex justify-between">
      <span className="text-xs font-bold text-cyan-400">AUDITORIA</span>
      <button onClick={onClear} className="text-xs px-2 py-0.5 hover:bg-white/10 rounded">Limpar</button>
    </header>
    <div className="flex-1 overflow-y-auto p-2 space-y-1">
      {logs.length === 0 ? <div className="text-center text-gray-500 text-xs py-8">Nenhum evento observado</div> : logs.map(log => (
        <div key={log.id} className="p-1.5 rounded border-l-2 border-cyan-500/30 text-xs">
          <div className="flex justify-between"><span className="opacity-60">{new Date(log.timestamp).toLocaleTimeString()}</span><span className="uppercase opacity-50">{log.severity}</span></div>
          <div className="mt-0.5 text-white/80">{log.message}</div>
        </div>
      ))}
    </div>
  </section>
);
