import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

interface AttendanceRow {
  firstName: string;
  lastName: string;
  email: string;
  organization: string | null;
  signature: string | null;
  sessionTitle?: string;
  createdAt: string | Date;
}

interface ActivityInfo {
  title: string;
  date: Date;
  location: string | null;
  serviceName: string;
  programName: string | null;
  intervenantName: string | null;
  sessionTitle?: string | null;
}

export async function generateAttendancePdf(
  activity: ActivityInfo,
  attendances: AttendanceRow[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 842; // A4 landscape
  const pageHeight = 595;
  const margin = 40;
  const headerHeight = 120;
  const rowHeight = 40;
  const signatureRowHeight = 45;
  const colWidths = [130, 130, 170, 130, 200]; // Nom, Prénom, Email, Organisation, Signature
  const fontSize = 9;
  const headerFontSize = 10;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  function drawHeader() {
    // Title
    page.drawText("FICHE DE PRESENCE", {
      x: margin,
      y,
      size: 16,
      font: fontBold,
      color: rgb(0.16, 0.5, 0.73),
    });
    y -= 24;

    // Activity info
    const infoLines = [
      `Activité : ${activity.title}`,
      `Date : ${new Date(activity.date).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}`,
    ];
    if (activity.location) infoLines.push(`Lieu : ${activity.location}`);
    infoLines.push(`Service : ${activity.serviceName}`);
    if (activity.programName) infoLines.push(`Programme : ${activity.programName}`);
    if (activity.intervenantName) infoLines.push(`Intervenant : ${activity.intervenantName}`);
    if (activity.sessionTitle) infoLines.push(`Séance : ${activity.sessionTitle}`);

    for (const line of infoLines) {
      page.drawText(line, { x: margin, y, size: 10, font, color: rgb(0.2, 0.2, 0.2) });
      y -= 15;
    }
    y -= 10;
  }

  function drawTableHeader() {
    const headers = ["Nom", "Prénom", "Email", "Organisation", "Signature"];
    let x = margin;

    // Header background
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: colWidths.reduce((a, b) => a + b, 0),
      height: 20,
      color: rgb(0.93, 0.93, 0.93),
    });

    for (let i = 0; i < headers.length; i++) {
      page.drawText(headers[i], {
        x: x + 4,
        y: y + 2,
        size: headerFontSize,
        font: fontBold,
        color: rgb(0.2, 0.2, 0.2),
      });
      x += colWidths[i];
    }
    y -= 22;
  }

  function needsNewPage(height: number) {
    return y - height < margin;
  }

  function addNewPage() {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    drawTableHeader();
  }

  // Draw initial header and table header
  drawHeader();
  drawTableHeader();

  // Draw rows
  for (const att of attendances) {
    const hasSignature = att.signature && att.signature.startsWith("data:image/png");
    const currentRowHeight = hasSignature ? signatureRowHeight : rowHeight;

    if (needsNewPage(currentRowHeight)) {
      addNewPage();
    }

    let x = margin;

    // Draw border line
    page.drawLine({
      start: { x: margin, y: y + 14 },
      end: { x: margin + colWidths.reduce((a, b) => a + b, 0), y: y + 14 },
      thickness: 0.5,
      color: rgb(0.85, 0.85, 0.85),
    });

    // Nom
    const lastName = truncateText(att.lastName, colWidths[0] - 8, font, fontSize);
    page.drawText(lastName, { x: x + 4, y, size: fontSize, font });
    x += colWidths[0];

    // Prénom
    const firstName = truncateText(att.firstName, colWidths[1] - 8, font, fontSize);
    page.drawText(firstName, { x: x + 4, y, size: fontSize, font });
    x += colWidths[1];

    // Email
    const email = truncateText(att.email, colWidths[2] - 8, font, fontSize);
    page.drawText(email, { x: x + 4, y, size: fontSize, font, color: rgb(0.3, 0.3, 0.3) });
    x += colWidths[2];

    // Organisation
    const org = truncateText(att.organization || "-", colWidths[3] - 8, font, fontSize);
    page.drawText(org, { x: x + 4, y, size: fontSize, font });
    x += colWidths[3];

    // Signature
    if (hasSignature) {
      try {
        const base64Data = att.signature!.split(",")[1];
        const signatureBytes = Uint8Array.from(atob(base64Data), (c) => c.charCodeAt(0));
        const pngImage = await pdfDoc.embedPng(signatureBytes);
        const sigWidth = Math.min(100, colWidths[4] - 10);
        const sigHeight = 30;
        page.drawImage(pngImage, {
          x: x + 4,
          y: y - 15,
          width: sigWidth,
          height: sigHeight,
        });
      } catch {
        page.drawText("(signature)", { x: x + 4, y, size: fontSize, font, color: rgb(0.5, 0.5, 0.5) });
      }
    } else {
      page.drawText("-", { x: x + 4, y, size: fontSize, font, color: rgb(0.5, 0.5, 0.5) });
    }

    y -= currentRowHeight;
  }

  // Footer line
  page.drawLine({
    start: { x: margin, y: y + 14 },
    end: { x: margin + colWidths.reduce((a, b) => a + b, 0), y: y + 14 },
    thickness: 0.5,
    color: rgb(0.85, 0.85, 0.85),
  });

  // Total count
  y -= 10;
  if (y < margin + 20) {
    page = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
  }
  page.drawText(`Total : ${attendances.length} présence(s)`, {
    x: margin,
    y,
    size: 10,
    font: fontBold,
    color: rgb(0.2, 0.2, 0.2),
  });

  return pdfDoc.save();
}

function truncateText(text: string, maxWidth: number, font: any, fontSize: number): string {
  if (font.widthOfTextAtSize(text, fontSize) <= maxWidth) return text;
  let truncated = text;
  while (truncated.length > 0 && font.widthOfTextAtSize(truncated + "…", fontSize) > maxWidth) {
    truncated = truncated.slice(0, -1);
  }
  return truncated + "…";
}
