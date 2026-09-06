import * as XLSX from "xlsx";
import type { ExtractedTableData } from "../types";

/**
 * Extracts markdown tables from text content
 */
export function extractTableFromMarkdown(text: string): ExtractedTableData | null {
  if (!text) return null;

  const lines = text.split("\n");
  const tableLines: string[] = [];
  let inTable = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
      inTable = true;
      tableLines.push(trimmed);
    } else if (inTable) {
      // Table ended
      break;
    }
  }

  if (tableLines.length >= 2) {
    // Parse headers
    const rawHeaders = tableLines[0]
      .split("|")
      .map((s) => s.trim())
      .filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);

    // Skip separator line (e.g., |---|---|)
    const dataLines = tableLines.slice(2);
    const rows: string[][] = [];

    for (const dLine of dataLines) {
      const row = dLine
        .split("|")
        .map((s) => s.trim())
        .filter((s, idx, arr) => idx > 0 && idx < arr.length - 1);
      if (row.length > 0) {
        rows.push(row);
      }
    }

    if (rawHeaders.length > 0 && rows.length > 0) {
      return {
        headers: rawHeaders,
        rows,
        title: "Extracted Enterprise Data",
      };
    }
  }

  // Fallback: Check for key-value or colon-separated bullet lines
  const bulletLines = lines.filter((l) => /^\s*[-*•]\s+[^:]+:\s+.+/.test(l));
  if (bulletLines.length >= 3) {
    const rows: string[][] = [];
    for (const b of bulletLines) {
      const match = b.replace(/^\s*[-*•]\s+/, "").match(/^([^:]+):\s*(.+)$/);
      if (match) {
        rows.push([match[1].trim(), match[2].trim()]);
      }
    }
    if (rows.length >= 2) {
      return {
        headers: ["Parameter / Metric", "Value / Assessment"],
        rows,
        title: "Structured Assessment Parameters",
      };
    }
  }

  return null;
}

/**
 * Download a file in browser
 */
export function triggerFileDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Export table data to Excel (.xlsx)
 */
export function exportToExcel(table: ExtractedTableData, customTitle?: string) {
  const fileName = `${(customTitle || table.title || "Enterprise_Data").replace(/\s+/g, "_")}_${Date.now()}.xlsx`;
  const sheetData = [table.headers, ...table.rows];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // Set column widths based on content
  const colWidths = table.headers.map((h, colIdx) => {
    let maxLen = h.length;
    for (const r of table.rows) {
      if (r[colIdx] && r[colIdx].length > maxLen) {
        maxLen = Math.min(r[colIdx].length, 50);
      }
    }
    return { wch: Math.max(maxLen + 4, 14) };
  });
  ws["!cols"] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, "Enterprise Analysis");
  const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  const blob = new Blob([wbout], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  triggerFileDownload(blob, fileName);
}

/**
 * Export table data to CSV (.csv)
 */
export function exportToCSV(table: ExtractedTableData, customTitle?: string) {
  const fileName = `${(customTitle || table.title || "Enterprise_Data").replace(/\s+/g, "_")}_${Date.now()}.csv`;
  const lines = [
    table.headers.map((h) => `"${h.replace(/"/g, '""')}"`).join(","),
    ...table.rows.map((row) => row.map((c) => `"${(c || "").replace(/"/g, '""')}"`).join(",")),
  ];
  const csvContent = "\uFEFF" + lines.join("\r\n"); // UTF-8 BOM for Excel compatibility
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  triggerFileDownload(blob, fileName);
}

/**
 * Export table or structured data to JSON (.json)
 */
export function exportToJSON(table: ExtractedTableData, customTitle?: string) {
  const fileName = `${(customTitle || table.title || "Enterprise_Data").replace(/\s+/g, "_")}_${Date.now()}.json`;
  const objects = table.rows.map((row) => {
    const obj: Record<string, string> = {};
    table.headers.forEach((h, idx) => {
      obj[h] = row[idx] || "";
    });
    return obj;
  });
  const jsonContent = JSON.stringify(objects, null, 2);
  const blob = new Blob([jsonContent], { type: "application/json;charset=utf-8;" });
  triggerFileDownload(blob, fileName);
}

/**
 * Export raw text / markdown to document file (.md or .txt)
 */
export function exportToText(content: string, fileName: string, ext = "txt") {
  const fullName = `${fileName.replace(/\s+/g, "_")}_${Date.now()}.${ext}`;
  const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
  triggerFileDownload(blob, fullName);
}

/**
 * Direct Google Sheets Integration:
 * Formats data as TSV (Tab Separated Values) for seamless pasting,
 * copies directly to user clipboard, and launches Google Sheets in a new tab.
 */
export async function openInGoogleSheets(table: ExtractedTableData): Promise<{ success: boolean; message: string }> {
  const tsvLines = [
    table.headers.join("\t"),
    ...table.rows.map((row) => row.join("\t")),
  ].join("\n");

  let copied = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(tsvLines);
      copied = true;
    }
  } catch (err) {
    console.warn("Clipboard access warning:", err);
  }

  // Open Google Sheets creation URL
  window.open("https://docs.google.com/spreadsheets/create", "_blank", "noopener,noreferrer");

  if (copied) {
    return {
      success: true,
      message: "Data copied to clipboard! Paste directly (Ctrl+V / Cmd+V) into the new Google Sheet.",
    };
  } else {
    return {
      success: true,
      message: "Opening Google Sheets. Use the CSV/Excel download button to upload your sheet.",
    };
  }
}

/**
 * Google Drive Sync & Save Helper:
 * Prepares and downloads the file package, and opens Google Drive upload directory.
 */
export function saveToGoogleDrive(table: ExtractedTableData): { success: boolean; message: string } {
  // First download the Excel file so user has the physical asset
  exportToExcel(table);

  // Open Google Drive in new window
  window.open("https://drive.google.com/drive/my-drive", "_blank", "noopener,noreferrer");

  return {
    success: true,
    message: "File exported and Google Drive opened. Drag and drop your downloaded file into Drive.",
  };
}
