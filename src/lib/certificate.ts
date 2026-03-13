/**
 * Certificate generation using jsPDF.
 * Returns a Buffer containing the PDF data.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";

export async function generateCertificatePDF(params: {
  studentName: string;
  studentSurname?: string;
  studentIdNumber?: string;
  certificateId: string;
  verificationUrl: string;
  courseName: string;
  completionDate: Date;
}): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const greenDark: [number, number, number] = [22, 101, 52];
  const greenMid: [number, number, number] = [34, 139, 87];
  const greenLight: [number, number, number] = [220, 252, 231];
  const black: [number, number, number] = [17, 24, 39];
  const slate: [number, number, number] = [71, 85, 105];

  // Background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Border
  doc.setDrawColor(...greenDark);
  doc.setLineWidth(4);
  doc.rect(20, 20, pageWidth - 40, pageHeight - 40);

  // Inner border
  doc.setLineWidth(1);
  doc.setDrawColor(...greenMid);
  doc.rect(28, 28, pageWidth - 56, pageHeight - 56);

  // Brand logo (prefers logo_white_not in public)
  const logoCandidates = ["Logo_White_No_Background.png"];
  let logoImage: Uint8Array | null = null;
  let logoFormat: "PNG" | "JPEG" = "PNG";

  for (const logoFile of logoCandidates) {
    try {
      const logoPath = path.join(process.cwd(), "public", logoFile);
      logoImage = await readFile(logoPath);
      logoFormat = logoFile.endsWith(".png") || logoFile.endsWith(".webp") ? "PNG" : "JPEG";
      break;
    } catch {
      // Try next candidate.
    }
  }

  if (logoImage) {
    // Strong contrast badge so the white logo stays visible on light certificate backgrounds.
    const badgeX = 42;
    const badgeY = 42;
    const badgeWidth = 220;
    const badgeHeight = 82;
    doc.setFillColor(...black);
    doc.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 12, 12, "F");

    doc.setDrawColor(...greenLight);
    doc.setLineWidth(1.2);
    doc.roundedRect(badgeX + 2, badgeY + 2, badgeWidth - 4, badgeHeight - 4, 10, 10, "S");

    doc.addImage(logoImage, logoFormat, badgeX + 22, badgeY + 19, 176, 44);
  }

  // Brand text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...greenDark);
  doc.text("KAYISE IT", pageWidth / 2, 100, { align: "center" });

  // Certificate title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(...black);
  doc.text("CERTIFICATE OF COMPLETION", pageWidth / 2, 160, {
    align: "center",
  });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...slate);
  doc.text("This is to certify that", pageWidth / 2, 196, { align: "center" });

  const fullName = `${params.studentName} ${params.studentSurname || ""}`.trim();

  // Student full name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(...greenDark);
  doc.text(fullName, pageWidth / 2, 238, { align: "center" });

  // Underline
  const nameWidth = doc.getTextWidth(fullName);
  doc.setDrawColor(...greenMid);
  doc.setLineWidth(1.5);
  doc.line(
    pageWidth / 2 - nameWidth / 2,
    244,
    pageWidth / 2 + nameWidth / 2,
    244
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...black);
  doc.text(`ID Number: ${params.studentIdNumber || "N/A"}`, pageWidth / 2, 276, { align: "center" });

  // Course completion text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(...slate);
  doc.text(
    "has successfully completed the course",
    pageWidth / 2,
    314,
    { align: "center" }
  );

  // Course name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...black);
  doc.text(`"${params.courseName}"`, pageWidth / 2, 350, { align: "center" });

  // Date
  const dateStr = params.completionDate.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...slate);
  doc.text(`Completed on: ${dateStr}`, pageWidth / 2, 388, {
    align: "center",
  });

  // Certificate verification metadata
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...black);
  doc.text(`Certificate ID: ${params.certificateId}`, 42, pageHeight - 102);

  // Signature authority block
  const signatureY = pageHeight - 120;
  const leftSigX = pageWidth / 2 - 170;
  const rightSigX = pageWidth / 2 + 30;

  doc.setDrawColor(...greenMid);
  doc.setLineWidth(1);
  doc.line(leftSigX, signatureY, leftSigX + 140, signatureY);
  doc.line(rightSigX, signatureY, rightSigX + 140, signatureY);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...slate);
  doc.text("Lead Instructor", leftSigX + 70, signatureY + 14, { align: "center" });
  doc.text("Head of Department / CEO", rightSigX + 70, signatureY + 14, { align: "center" });

  // QR code for verification page
  const qrDataUrl = await QRCode.toDataURL(params.verificationUrl, {
    width: 150,
    margin: 1,
  });
  doc.addImage(qrDataUrl, "PNG", pageWidth - 118, pageHeight - 118, 76, 76);
  doc.setFontSize(8);
  doc.setTextColor(...slate);
  doc.text("Scan to verify", pageWidth - 80, pageHeight - 34, { align: "center" });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(...greenDark);
  doc.text(
    "Kayise IT | Empowering Learners through Technology",
    pageWidth / 2,
    pageHeight - 50,
    { align: "center" }
  );

  const pdfArrayBuffer = doc.output("arraybuffer");
  return Buffer.from(pdfArrayBuffer);
}
