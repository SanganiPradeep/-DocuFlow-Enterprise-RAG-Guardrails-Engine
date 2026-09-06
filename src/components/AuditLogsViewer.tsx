import React, { useState } from 'react';
import { 
  Activity, 
  ShieldAlert, 
  ShieldCheck, 
  Download, 
  Search, 
  Filter, 
  Trash2, 
  Check, 
  Clock, 
  User, 
  Eye, 
  Layers,
  AlertTriangle,
  X 
} from 'lucide-react';
import { TelemetryLog } from '../types';

interface AuditLogsViewerProps {
  logs: TelemetryLog[];
  onResetLogs: () => Promise<void>;
}

export const AuditLogsViewer: React.FC<AuditLogsViewerProps> = ({ logs, onResetLogs }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'blocked' | 'passed'>('all');
  const [search, setSearch] = useState('');
  const [selectedLog, setSelectedLog] = useState<TelemetryLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (filterStatus !== 'all' && log.status !== filterStatus) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      return (
        log.query.toLowerCase().includes(s) ||
        log.userEmail.toLowerCase().includes(s) ||
        log.id.toLowerCase().includes(s) ||
        log.threatCategory.toLowerCase().includes(s)
      );
    }
    return true;
  });

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `DocuFlow_Audit_Report_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="flex-1 overflow-y-auto bg-[#F1F3F4] p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Top Control Header */}
        <div className="bg-white p-5 rounded-2xl border border-[#DADCE0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#1A73E8] flex items-center justify-center text-white shadow-sm">
                <Activity className="w-4 h-4" />
              </div>
              <h1 className="text-base font-semibold text-[#202124]">Security Audit Logs & Compliance Telemetry</h1>
            </div>
            <p className="text-xs text-[#5F6368] mt-1">
              Cryptographically timestamped record of every query screened by Google Cloud Model Armor.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportJSON}
              className="px-3.5 py-2 rounded-md bg-[#F1F3F4] hover:bg-[#E8EAED] text-[#202124] text-xs font-medium border border-[#DADCE0] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#5F6368]" />
              Export SOC-2 Log
            </button>
            <button
              onClick={onResetLogs}
              className="px-3.5 py-2 rounded-md bg-[#FCE8E6] hover:bg-[#FAD2CF] text-[#D93025] text-xs font-medium flex items-center gap-1.5 transition-colors border border-[#F1998E]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-[#DADCE0] shadow-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#70757A]" />
            <span className="text-xs font-semibold text-[#3C4043]">Filter Status:</span>
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === 'all' ? 'bg-[#202124] text-white' : 'bg-[#F1F3F4] text-[#5F6368] hover:bg-[#E8EAED]'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilterStatus('blocked')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === 'blocked' ? 'bg-[#D93025] text-white' : 'bg-[#FCE8E6] text-[#D93025] hover:bg-[#FAD2CF]'
              }`}
            >
              Blocked Attacks ({logs.filter((l) => l.status === 'blocked').length})
            </button>
            <button
              onClick={() => setFilterStatus('passed')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                filterStatus === 'passed' ? 'bg-[#1E8E3E] text-white' : 'bg-[#EEFBEB] text-[#1E8E3E] hover:bg-[#CEEAD6]'
              }`}
            >
              Passed ({logs.filter((l) => l.status === 'passed').length})
            </button>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#70757A] absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by query, email or ID..."
              className="pl-9 pr-3 py-1.5 text-xs bg-[#F1F3F4] border border-[#DADCE0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A73E8] w-64 text-[#202124]"
            />
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl border border-[#DADCE0] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F8F9FA] text-[#5F6368] uppercase tracking-wider font-semibold border-b border-[#DADCE0] text-[10px]">
                <tr>
                  <th className="py-3 px-4">Audit ID / Time</th>
                  <th className="py-3 px-4">Enterprise User</th>
                  <th className="py-3 px-4">Interception Status</th>
                  <th className="py-3 px-4">Threat Category</th>
                  <th className="py-3 px-4">Query Excerpt</th>
                  <th className="py-3 px-4">Latency</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F3F4] text-[#3C4043]">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-[#70757A]">
                      No security audit events recorded.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-[#F8F9FA] transition-colors">
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className="font-mono font-bold text-[#202124] block">{log.id}</span>
                        <span className="text-[10px] text-[#70757A]">
                          {new Date(log.timestamp).toLocaleTimeString()}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-medium text-[#202124]">{log.userEmail}</p>
                        <span className="text-[10px] text-[#70757A] capitalize">{log.userRole?.replace('_', ' ')}</span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono ${
                          log.status === 'blocked'
                            ? 'bg-[#FCE8E6] text-[#D93025] border border-[#F1998E]'
                            : 'bg-[#EEFBEB] text-[#1E8E3E] border border-[#CEEAD6]'
                        }`}>
                          {log.status === 'blocked' ? <ShieldAlert className="w-3 h-3 text-[#D93025]" /> : <ShieldCheck className="w-3 h-3 text-[#1E8E3E]" />}
                          {log.status}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                          log.threatCategory !== 'none'
                            ? 'bg-[#FCE8E6] text-[#D93025]'
                            : 'bg-[#F1F3F4] text-[#70757A]'
                        }`}>
                          {log.threatCategory}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs truncate text-[#202124]">
                        "{log.query}"
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-[#5F6368]">
                        {log.totalTimeMs}ms
                      </td>

                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="px-2.5 py-1 text-xs font-medium text-[#1A73E8] hover:bg-[#E8F0FE] rounded-md transition-colors"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log Modal Details */}
        {selectedLog && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-[#DADCE0] w-full max-w-2xl overflow-hidden">
              <div className="p-5 border-b border-[#DADCE0] flex items-center justify-between bg-[#F8F9FA]">
                <div>
                  <span className="text-[10px] font-mono bg-[#E8F0FE] text-[#1967D2] px-2 py-0.5 rounded border border-[#ADCCF9] uppercase font-bold">
                    Incident ID: {selectedLog.id}
                  </span>
                  <h3 className="text-base font-bold text-[#202124] mt-1">Audit Trail Record</h3>
                </div>
                <button
                  onClick={() => setSelectedLog(null)}
                  className="p-1.5 rounded-full hover:bg-[#DADCE0] text-[#5F6368] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
                <div className="grid grid-cols-2 gap-3 p-3 bg-[#F8F9FA] rounded-xl border border-[#DADCE0]">
                  <div>
                    <span className="text-[#70757A] block text-[10px]">User Account</span>
                    <strong className="text-[#202124]">{selectedLog.userEmail}</strong>
                  </div>
                  <div>
                    <span className="text-[#70757A] block text-[10px]">Clearance Level</span>
                    <strong className="text-[#202124]">{selectedLog.userRole}</strong>
                  </div>
                  <div>
                    <span className="text-[#70757A] block text-[10px]">Timestamp</span>
                    <span className="font-mono text-[#202124]">{selectedLog.timestamp}</span>
                  </div>
                  <div>
                    <span className="text-[#70757A] block text-[10px]">Model Armor Latency</span>
                    <span className="font-mono text-[#1A73E8] font-bold">{selectedLog.inputShieldTimeMs}ms</span>
                  </div>
                </div>

                <div>
                  <span className="text-[#5F6368] font-semibold block mb-1">User Raw Query Input:</span>
                  <p className="p-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl font-mono text-[#202124]">
                    {selectedLog.query}
                  </p>
                </div>

                <div>
                  <span className="text-[#5F6368] font-semibold block mb-1">System Action & Reply:</span>
                  <p className="p-3 bg-[#F8F9FA] border border-[#DADCE0] rounded-xl text-[#202124]">
                    {selectedLog.reply}
                  </p>
                </div>

                {selectedLog.threatCategory !== 'none' && (
                  <div className="p-3.5 bg-[#FCE8E6] border border-[#F1998E] rounded-xl">
                    <p className="font-bold text-[#A50E0E] flex items-center gap-1.5 text-xs">
                      <ShieldAlert className="w-4 h-4 text-[#D93025]" />
                      Model Armor Threat Metadata
                    </p>
                    <div className="mt-2 text-[#A50E0E] grid grid-cols-2 gap-2 text-[11px]">
                      <div>Category: <strong>{selectedLog.threatCategory}</strong></div>
                      <div>Confidence: <strong>{(selectedLog.confidenceScore * 100).toFixed(1)}%</strong></div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-[#DADCE0] bg-[#F8F9FA] flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-4 py-2 bg-[#202124] text-white text-xs font-medium rounded-md hover:bg-[#3C4043] transition-colors"
                >
                  Close Record
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
