import React from 'react';
import { 
  ShieldAlert, 
  ShieldCheck, 
  Cpu, 
  Search, 
  Activity, 
  Zap, 
  Clock, 
  Lock, 
  AlertTriangle, 
  FileText, 
  Terminal,
  Layers,
  ChevronRight
} from 'lucide-react';
import { ChatMessage, TelemetryLog } from '../types';

interface SecurityTelemetrySidebarProps {
  lastMessage?: ChatMessage | null;
  telemetryLogs: TelemetryLog[];
  isProcessing: boolean;
  onSelectLogItem?: (log: TelemetryLog) => void;
}

export const SecurityTelemetrySidebar: React.FC<SecurityTelemetrySidebarProps> = ({
  lastMessage,
  telemetryLogs,
  isProcessing,
  onSelectLogItem,
}) => {
  const totalQueries = telemetryLogs.length;
  const blockedThreats = telemetryLogs.filter((l) => l.status === 'blocked').length;
  const sanitizedQueries = telemetryLogs.filter((l) => l.status === 'sanitized').length;
  const safeQueries = telemetryLogs.filter((l) => l.status === 'passed').length;

  const currentStatus = isProcessing
    ? 'analyzing'
    : lastMessage
    ? lastMessage.status
    : 'idle';

  return (
    <aside className="w-full lg:w-[320px] bg-white border-l border-[#DADCE0] flex flex-col h-full overflow-y-auto shrink-0 justify-between">
      <div>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-[#DADCE0] flex items-center justify-between">
          <h2 className="text-xs font-bold text-[#202124] uppercase tracking-wider">
            AI Security Telemetry
          </h2>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-[#EEFBEB] text-[#1E8E3E] text-[10px] font-bold border border-[#CEEAD6]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#34A853]"></span>
            Active
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* 3 Core Shields Status from Design */}
          <div className="space-y-3 p-3 bg-[#F8F9FA] rounded-xl border border-[#DADCE0]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#5F6368] uppercase">Input Shield</span>
              {currentStatus === 'blocked' ? (
                <span className="px-2 py-0.5 bg-[#FCE8E6] text-[#D93025] text-[10px] font-bold rounded uppercase border border-[#F1998E]">
                  Blocked
                </span>
              ) : currentStatus === 'analyzing' ? (
                <span className="px-2 py-0.5 bg-[#FEF7E0] text-[#B06000] text-[10px] font-bold rounded uppercase">
                  Checking...
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-[#EEFBEB] text-[#1E8E3E] text-[10px] font-bold rounded uppercase border border-[#CEEAD6]">
                  Pass
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#5F6368] uppercase">Output Filter</span>
              {lastMessage?.outputShieldResult?.redacted ? (
                <span className="px-2 py-0.5 bg-[#FEF7E0] text-[#B06000] text-[10px] font-bold rounded uppercase border border-[#FEEFC3]">
                  Masked
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-[#EEFBEB] text-[#1E8E3E] text-[10px] font-bold rounded uppercase border border-[#CEEAD6]">
                  Pass
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[11px] font-medium text-[#5F6368] uppercase">PII Masking</span>
              <span className="px-2 py-0.5 bg-[#E8F0FE] text-[#1A73E8] text-[10px] font-bold rounded uppercase border border-[#ADCCF9]">
                Active
              </span>
            </div>
          </div>

          {/* Model Armor Live Log with Colored Left Borders from Design */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-semibold text-[#202124]">Model Armor Log</div>
              <span className="text-[10px] text-[#70757A]">{telemetryLogs.length} events</span>
            </div>

            <div className="space-y-3.5">
              {telemetryLogs.length === 0 ? (
                <div className="text-xs text-[#70757A] py-3 text-center">
                  Awaiting query evaluation...
                </div>
              ) : (
                telemetryLogs.slice(0, 5).map((log) => {
                  const isBlocked = log.status === 'blocked';
                  const isSanitized = log.status === 'sanitized';
                  const borderClass = isBlocked
                    ? 'border-[#EA4335]'
                    : isSanitized
                    ? 'border-[#FBBC04]'
                    : 'border-[#34A853]';

                  return (
                    <div
                      key={log.id}
                      onClick={() => onSelectLogItem && onSelectLogItem(log)}
                      className={`relative pl-3.5 border-l-2 ${borderClass} cursor-pointer hover:bg-[#F8F9FA] p-1.5 rounded-r transition-colors`}
                    >
                      <div className="text-[10px] text-[#70757A] mb-0.5 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                      <div className="text-xs font-medium text-[#202124] line-clamp-1">
                        {isBlocked ? 'Blocked Attack' : isSanitized ? 'Sanitized Response' : 'Query Evaluated'}
                      </div>
                      <div className={`text-[10px] font-mono mt-0.5 ${
                        isBlocked ? 'text-[#EA4335]' : 'text-[#34A853]'
                      }`}>
                        {isBlocked ? `Detected: ${log.threatCategory}` : 'Detected: NO_THREATS'}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Model Endpoint & Vector Index Stats from Design */}
          <div className="pt-2 space-y-2">
            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#DADCE0]">
              <div className="text-[10px] font-bold text-[#5F6368] uppercase mb-1">Model Endpoint</div>
              <div className="text-[11px] font-mono text-[#202124] truncate">
                {lastMessage?.modelUsed ? `${lastMessage.modelUsed} (Active)` : 'gemini-2.5-flash / Model Armor'}
              </div>
            </div>

            <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#DADCE0]">
              <div className="text-xs text-[#70757A] flex items-center justify-between mb-1.5">
                <span>Vector Shards Ingested</span>
                <span className="font-semibold text-[#202124]">4 Documents</span>
              </div>
              <div className="w-full h-1.5 bg-[#DADCE0] rounded-full overflow-hidden">
                <div className="w-[78%] h-full bg-[#1A73E8]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Status Bar from Design */}
      <div className="p-4 bg-[#F1F3F4] flex items-center justify-center gap-2 border-t border-[#DADCE0]">
        <div className="w-2 h-2 rounded-full bg-[#34A853] animate-pulse"></div>
        <span className="text-[10px] font-medium text-[#5F6368]">
          Secure Cloud Tunnel Enabled
        </span>
      </div>
    </aside>
  );
};
