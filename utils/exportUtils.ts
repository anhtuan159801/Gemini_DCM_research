// This library is loaded globally from the script tag in index.html
declare const XLSX: any;

import type { AnalyzedDocument, MatrixColumn } from '../types';

/**
 * Helper function to export a string as a file.
 * @param content The string content to save.
 * @param filename The desired filename (e.g., "report.txt").
 * @param mimeType The MIME type for the blob.
 */
const exportString = (content: string, filename: string, mimeType: string): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


// --- Individual Report Exports ---
export const exportSingleAsTxt = (reportContent: string, filename: string): void => {
    exportString(reportContent, filename, 'text/plain;charset=utf-8');
};

export const exportSingleAsXlsx = (reportContent: string, filename: string): void => {
    const ws = createSheetFromReport(reportContent);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Báo cáo Phân tích");
    XLSX.writeFile(wb, filename);
};


// --- All Reports Exports ---
export const exportAllAsTxt = (documents: AnalyzedDocument[], filename: string): void => {
    const combinedContent = documents.map(doc => {
        const header = `========================================\nBÁO CÁO PHÂN TÍCH: ${doc.file.name}\n========================================\n\n`;
        return header + (doc.result?.fullReport || 'Không có nội dung báo cáo.');
    }).join('\n\n\n');

    exportString(combinedContent, filename, 'text/plain;charset=utf-8');
};


const createSheetFromReport = (report: string) => {
    const sections = report.split(/\n(?=\*\*[0-9]+\.\s)/);
    const data = sections.map(section => {
        const firstNewlineIndex = section.indexOf('\n');
        const title = (firstNewlineIndex !== -1 ? section.substring(0, firstNewlineIndex) : section).replace(/\*\*/g, '').trim();
        const content = firstNewlineIndex !== -1 ? section.substring(firstNewlineIndex + 1).trim() : '';
        return [{ 'Mục': title, 'Nội dung': content }];
    }).flat();

    const ws = XLSX.utils.json_to_sheet(data, { skipHeader: true });
    // Manually add headers to apply styling
    XLSX.utils.sheet_add_aoa(ws, [["Mục", "Nội dung"]], { origin: "A1" });
    
    // Style header
    ws['A1'].s = { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } };
    ws['B1'].s = { font: { bold: true }, alignment: { vertical: "center", horizontal: "center" } };

    ws['!cols'] = [{ wch: 40 }, { wch: 100 }];
    // Apply wrap text to content cells
     for (let i = 1; i < data.length + 1; i++) {
        const cellB = `B${i + 1}`;
        if (ws[cellB]) {
            ws[cellB].s = { alignment: { wrapText: true, vertical: "top" } };
        }
    }
    return ws;
};

export const exportAllAsXlsx = (documents: AnalyzedDocument[], filename: string): void => {
    const wb = XLSX.utils.book_new();

    documents.forEach((doc) => {
        if (doc.result) {
            const ws = createSheetFromReport(doc.result.fullReport);
            let sheetName = doc.file.name.replace(/\.[^/.]+$/, "").substring(0, 31);
            XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
    });

    if(wb.SheetNames.length > 0) {
        XLSX.writeFile(wb, filename);
    } else {
        alert("Không có báo cáo nào để xuất.");
    }
};

// --- BibTeX Export ---
export const exportBibtex = (content: string, filename: string): void => {
    exportString(content, filename, 'application/x-bibtex;charset=utf-8');
};

// --- Synthesis Matrix Export ---
const markdownToExcelRichText = (text: string) => {
    if (!text) return [{ t: "" }];
    const segments = [];
    let lastIndex = 0;
    const regex = /(\*\*.*?\*\*|\*.*?\*)/g;

    let match;
    while ((match = regex.exec(text)) !== null) {
        if (match.index > lastIndex) {
            segments.push({ t: text.substring(lastIndex, match.index) });
        }
        const matchedText = match[0];
        const isBold = matchedText.startsWith('**');
        const content = matchedText.substring(isBold ? 2 : 1, matchedText.length - (isBold ? 2 : 1));
        
        const font: { bold?: boolean, italic?: boolean } = {};
        if (isBold) font.bold = true;
        else font.italic = true;

        segments.push({ t: content, f: { sz: "11", name: "Calibri", ...font } });
        lastIndex = regex.lastIndex;
    }

    if (lastIndex < text.length) {
        segments.push({ t: text.substring(lastIndex) });
    }
    return segments.length > 0 ? segments : [{t: ""}];
};

export const exportMatrixAsXlsx = (matrix: Record<string, any>[], columns: MatrixColumn[], filename: string): void => {
    const enabledCols = columns.filter(c => c.enabled);
    const header = enabledCols.map(c => c.header);

    const plainData = matrix.map(row => 
        enabledCols.map(col => (row[col.id] || '').toString().replace(/\*\*|\*/g, ''))
    );

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([header, ...plainData]);

    matrix.forEach((row, rowIndex) => {
        const R = rowIndex + 1; // 1-based index for rows
        enabledCols.forEach((col, colIndex) => {
            const C = colIndex;
            const markdownText = row[col.id];
            if (markdownText) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = ws[cellAddress]; 
                if (cell) {
                    const richTextPayload = markdownToExcelRichText(markdownText);
                    cell.t = 'r';
                    cell.R = richTextPayload;
                    delete cell.w;
                }
            }
        });
    });

    ws['!cols'] = enabledCols.map(c => ({ wch: c.header.length > 20 ? 60 : 40 }));
    
    const rowCount = plainData.length + 1;
    for (let R = 0; R < rowCount; ++R) {
        for (let C = 0; C < header.length; ++C) {
            const cell_address = XLSX.utils.encode_cell({c:C, r:R});
            if (!ws[cell_address]) continue;
            if (!ws[cell_address].s) ws[cell_address].s = {};
            ws[cell_address].s.alignment = { wrapText: true, vertical: "top" };
            if (R === 0) {
                if(!ws[cell_address].s.font) ws[cell_address].s.font = {};
                ws[cell_address].s.font.bold = true;
            }
        }
    }

    XLSX.utils.book_append_sheet(wb, ws, "Ma trận Tổng quan");
    XLSX.writeFile(wb, filename);
};