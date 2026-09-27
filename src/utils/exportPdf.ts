import jsPDF from 'jspdf';

export interface PdfReportOptions {
  title: string;
  subtitle?: string;
  institution?: string;
  metadata?: { label: string; value: string }[];
  headers: string[];
  rows: (string | number)[][];
  summaryNotes?: string[];
  filename: string;
}

export function generatePdfReport(options: PdfReportOptions): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  let currentY = 45;

  // Header Bar
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('SMARTATTEND — OFFICIAL ATTENDANCE & ANALYTICS REPORT', margin, 18);

  currentY = 55;

  // Institution / Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(options.title, margin, currentY);
  currentY += 18;

  if (options.subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(71, 85, 105);
    doc.text(options.subtitle, margin, currentY);
    currentY += 16;
  }

  // Generation timestamp
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on: ${new Date().toLocaleString()} | Verified Institutional Record`, margin, currentY);
  currentY += 20;

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 18;

  // Metadata block
  if (options.metadata && options.metadata.length > 0) {
    doc.setFontSize(10);
    const colWidth = (pageWidth - margin * 2) / 2;
    options.metadata.forEach((item, index) => {
      const col = index % 2;
      const x = margin + col * colWidth;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(51, 65, 85);
      doc.text(`${item.label}: `, x, currentY);

      const labelWidth = doc.getTextWidth(`${item.label}: `);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(item.value, x + labelWidth, currentY);

      if (col === 1 || index === options.metadata!.length - 1) {
        currentY += 16;
      }
    });
    currentY += 12;
  }

  // Table section
  const availableWidth = pageWidth - margin * 2;
  const colCount = options.headers.length;
  const colWidth = availableWidth / colCount;
  const rowHeight = 22;

  // Table Header
  doc.setFillColor(241, 245, 249); // slate-100
  doc.rect(margin, currentY, availableWidth, rowHeight, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(margin, currentY, availableWidth, rowHeight, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  options.headers.forEach((header, i) => {
    const x = margin + i * colWidth + 6;
    doc.text(header, x, currentY + 14);
  });

  currentY += rowHeight;

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);

  options.rows.forEach((row, rowIndex) => {
    // Check if new page needed
    if (currentY + rowHeight > pageHeight - 50) {
      doc.addPage();
      currentY = 40;
      // Re-draw header
      doc.setFillColor(241, 245, 249);
      doc.rect(margin, currentY, availableWidth, rowHeight, 'F');
      doc.setFont('helvetica', 'bold');
      options.headers.forEach((header, i) => {
        const x = margin + i * colWidth + 6;
        doc.text(header, x, currentY + 14);
      });
      currentY += rowHeight;
      doc.setFont('helvetica', 'normal');
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, availableWidth, rowHeight, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(margin, currentY + rowHeight, margin + availableWidth, currentY + rowHeight);

    row.forEach((cell, i) => {
      const x = margin + i * colWidth + 6;
      const strVal = String(cell ?? '');

      // Highlight critical risks if present
      if (strVal === 'Critical' || strVal.includes('Critical')) {
        doc.setTextColor(225, 29, 72); // rose-600
        doc.setFont('helvetica', 'bold');
      } else if (strVal === 'Warning') {
        doc.setTextColor(217, 119, 6); // amber-600
        doc.setFont('helvetica', 'bold');
      } else if (strVal === 'Safe') {
        doc.setTextColor(16, 185, 129); // emerald-500
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(51, 65, 85);
        doc.setFont('helvetica', 'normal');
      }

      // Truncate text if too wide
      const maxWidth = colWidth - 10;
      let displayStr = strVal;
      if (doc.getTextWidth(displayStr) > maxWidth) {
        while (doc.getTextWidth(displayStr + '...') > maxWidth && displayStr.length > 2) {
          displayStr = displayStr.substring(0, displayStr.length - 1);
        }
        displayStr += '...';
      }

      doc.text(displayStr, x, currentY + 14);
    });

    currentY += rowHeight;
  });

  // Summary / Footer notes
  currentY += 20;
  if (options.summaryNotes && options.summaryNotes.length > 0) {
    if (currentY + 60 > pageHeight - 40) {
      doc.addPage();
      currentY = 40;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Key Observations & Action Items:', margin, currentY);
    currentY += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    options.summaryNotes.forEach(note => {
      doc.text(`• ${note}`, margin + 8, currentY);
      currentY += 14;
    });
  }

  // Footer on current page
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('SmartAttend — University Attendance & Analytics Platform • Confidential', margin, pageHeight - 20);

  doc.save(options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`);
}
