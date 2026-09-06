import { useState } from "react";
import type { ExtractedTableData } from "../types";
import {
  extractTableFromMarkdown,
  exportToExcel,
  exportToCSV,
  exportToJSON,
  exportToText,
  openInGoogleSheets,
  saveToGoogleDrive,
} from "../lib/exportUtils";
import {
  FileSpreadsheet,
  Download,
  Copy,
  Check,
  HardDrive,
  Code,
  X,
  RefreshCw,
  FileText,
  Table as TableIcon,
} from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialText?: string;
  documentTitle?: string;
}

export default function DataConversionModal({
  isOpen,
  onClose,
  initialText = "",
  documentTitle,
}: Props) {
  const [rawText, setRawText] = useState(initialText);
  const [customTitle, setCustomTitle] = useState(
    documentTitle ? `${documentTitle} - Converted` : "Business Analysis Report"
  );
  const [copied, setCopied] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const parsedTable: ExtractedTableData | null = extractTableFromMarkdown(rawText);

  const showStatus = (msg: string) => {
    setStatusMsg(msg);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleCopyTSV = async () => {
    if (!parsedTable) return;
    const tsv = [parsedTable.headers.join("\t"), ...parsedTable.rows.map((r) => r.join("\t"))].join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      showStatus("Copied to clipboard for Google Sheets & Excel");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showStatus("Unable to copy to clipboard");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Enterprise Data Converter &amp; Spreadsheet Generator
              </h3>
              <p className="text-xs text-slate-500">
                Convert analysis data, text, or tables into Google Sheets, Excel (.xlsx), CSV, JSON, and document formats
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* File naming & Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Dataset / Export Name
            </label>
            <input
              type="text"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:border-blue-500 focus:outline-hidden"
              placeholder="e.g. Q3_Healthcare_Expenditures_Report"
            />
          </div>

          {/* Input text / table area */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Data to Convert (Markdown Table, Key-Value Pairs, or Tabular Text)
              </label>
              <button
                onClick={() => setRawText(initialText)}
                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 font-medium cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Reset to current message
              </button>
            </div>
            <textarea
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              rows={6}
              className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:border-blue-500 focus:outline-hidden resize-y"
              placeholder="| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Data A | Data B | Data C |"
            />
          </div>

          {/* Parsed Preview */}
          {parsedTable ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <TableIcon className="w-4 h-4 text-emerald-600" />
                  Detected Structure: {parsedTable.rows.length} rows, {parsedTable.headers.length} columns
                </span>
                <span className="text-emerald-700 font-medium">Ready for Google Sheets &amp; Excel</span>
              </div>
              <div className="overflow-x-auto max-h-48">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      {parsedTable.headers.map((h, i) => (
                        <th key={i} className="px-3 py-2 border-r border-slate-200 last:border-r-0 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {parsedTable.rows.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-slate-50">
                        {row.map((cell, cIdx) => (
                          <td key={cIdx} className="px-3 py-1.5 border-r border-slate-100 last:border-r-0 text-slate-600">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs">
              <p className="font-semibold mb-1">No explicit table syntax detected yet.</p>
              <p>
                You can still export the text directly as Markdown (.md) or Text (.txt), or format your text using markdown tables (e.g. <code>| Header 1 | Header 2 |</code>).
              </p>
            </div>
          )}

          {/* Status Message */}
          {statusMsg && (
            <div className="p-3 bg-slate-900 text-white text-xs rounded-xl flex items-center justify-between">
              <span>{statusMsg}</span>
              <button
                onClick={() => setStatusMsg(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Footer / Conversion Buttons */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            {parsedTable ? (
              <>
                <button
                  onClick={async () => {
                    const res = await openInGoogleSheets(parsedTable);
                    showStatus(res.message);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Open in Google Sheets
                </button>

                <button
                  onClick={() => {
                    exportToExcel(parsedTable, customTitle);
                    showStatus("Microsoft Excel workbook (.xlsx) downloaded");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Download Excel (.xlsx)
                </button>

                <button
                  onClick={() => {
                    exportToCSV(parsedTable, customTitle);
                    showStatus("CSV dataset downloaded");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  <TableIcon className="w-4 h-4 text-blue-600" />
                  Download CSV
                </button>

                <button
                  onClick={() => {
                    exportToJSON(parsedTable, customTitle);
                    showStatus("Structured JSON downloaded");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  <Code className="w-4 h-4 text-amber-600" />
                  Download JSON
                </button>

                <button
                  onClick={() => {
                    const res = saveToGoogleDrive(parsedTable);
                    showStatus(res.message);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  <HardDrive className="w-4 h-4 text-blue-600" />
                  Save to Google Drive
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    exportToText(rawText, customTitle, "md");
                    showStatus("Markdown document (.md) downloaded");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs cursor-pointer transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Download Markdown (.md)
                </button>

                <button
                  onClick={() => {
                    exportToText(rawText, customTitle, "txt");
                    showStatus("Plain text (.txt) downloaded");
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 text-xs font-semibold rounded-xl cursor-pointer transition-colors"
                >
                  <Download className="w-4 h-4 text-slate-600" />
                  Download Text (.txt)
                </button>
              </>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 hover:bg-slate-100 rounded-xl text-xs font-medium text-slate-700 cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
