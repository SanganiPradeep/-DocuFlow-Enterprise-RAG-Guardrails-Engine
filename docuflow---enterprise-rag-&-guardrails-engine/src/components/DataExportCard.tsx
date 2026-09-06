import { useState } from "react";
import type { ExtractedTableData } from "../types";
import {
  exportToExcel,
  exportToCSV,
  exportToJSON,
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
  Table as TableIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Props {
  data: ExtractedTableData;
  sourceDocTitle?: string;
}

export default function DataExportCard({ data, sourceDocTitle }: Props) {
  const [copied, setCopied] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleCopyTSV = async () => {
    const tsv = [data.headers.join("\t"), ...data.rows.map((r) => r.join("\t"))].join("\n");
    try {
      await navigator.clipboard.writeText(tsv);
      setCopied(true);
      showToast("Tabular data copied to clipboard in spreadsheet format");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      showToast("Unable to copy to clipboard");
    }
  };

  const handleGoogleSheets = async () => {
    const res = await openInGoogleSheets(data);
    showToast(res.message);
  };

  const handleGoogleDrive = () => {
    const res = saveToGoogleDrive(data);
    showToast(res.message);
  };

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden shadow-xs">
      {/* Header bar */}
      <div className="px-4 py-2.5 bg-slate-100/90 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-semibold text-slate-800">
            {data.title || "Structured Business Dataset"}
          </span>
          <span className="text-[10px] bg-emerald-100 text-emerald-800 font-medium px-2 py-0.5 rounded-md">
            {data.rows.length} rows × {data.headers.length} columns
          </span>
          {sourceDocTitle && (
            <span className="text-[10px] text-slate-500 font-medium truncate max-w-[150px]">
              Source: {sourceDocTitle}
            </span>
          )}
        </div>

        <button
          onClick={() => setExpanded(!expanded)}
          className="text-slate-500 hover:text-slate-800 text-xs font-medium flex items-center gap-1 cursor-pointer"
        >
          {expanded ? (
            <>
              <span className="text-[11px]">Hide Preview</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              <span className="text-[11px]">Show Preview</span>
              <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>

      {/* Table Preview */}
      {expanded && (
        <div className="overflow-x-auto max-h-60 border-b border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-200/70 text-slate-700 font-semibold border-b border-slate-300">
                {data.headers.map((h, i) => (
                  <th key={i} className="px-3 py-2 border-r border-slate-300/50 last:border-r-0 whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {data.rows.map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50 transition-colors">
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      className="px-3 py-1.5 text-slate-700 border-r border-slate-100 last:border-r-0 whitespace-pre-wrap font-normal"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Export & Conversion Action Buttons */}
      <div className="p-3 bg-white flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mr-1">
          Export / Convert:
        </span>

        {/* Google Sheets button */}
        <button
          onClick={handleGoogleSheets}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
          title="Open and paste into a new Google Sheet"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
          Create in Google Sheets
        </button>

        {/* Google Drive button */}
        <button
          onClick={handleGoogleDrive}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs"
          title="Download formatted file and open Google Drive"
        >
          <HardDrive className="w-3.5 h-3.5 text-blue-600" />
          Save to Google Drive
        </button>

        {/* Excel (.xlsx) Download */}
        <button
          onClick={() => {
            exportToExcel(data);
            showToast("Excel spreadsheet (.xlsx) downloaded");
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          title="Download as Microsoft Excel Workbook (.xlsx)"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          Excel (.xlsx)
        </button>

        {/* CSV (.csv) Download */}
        <button
          onClick={() => {
            exportToCSV(data);
            showToast("CSV dataset downloaded");
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          title="Download as Comma-Separated Values (.csv)"
        >
          <TableIcon className="w-3.5 h-3.5 text-blue-600" />
          CSV (.csv)
        </button>

        {/* JSON (.json) Download */}
        <button
          onClick={() => {
            exportToJSON(data);
            showToast("JSON payload downloaded");
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer"
          title="Download as structured JSON (.json)"
        >
          <Code className="w-3.5 h-3.5 text-amber-600" />
          JSON (.json)
        </button>

        {/* Copy to Clipboard */}
        <button
          onClick={handleCopyTSV}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors cursor-pointer ml-auto"
          title="Copy data for spreadsheet paste"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-700 font-semibold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5 text-slate-500" />
              <span>Copy Data</span>
            </>
          )}
        </button>
      </div>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="px-3 py-1.5 bg-slate-900 text-white text-xs flex items-center justify-between border-t border-slate-800 animate-fadeIn">
          <span className="font-medium">{toastMsg}</span>
          <button
            onClick={() => setToastMsg(null)}
            className="text-slate-400 hover:text-white text-xs font-bold ml-3 cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
