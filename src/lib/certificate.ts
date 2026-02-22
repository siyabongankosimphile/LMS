/**
 * Certificate generation using jsPDF.
 * Returns a Buffer containing the PDF data.
 */
export async function generateCertificatePDF(params: {
  studentName: string;
  courseName: string;
  completionDate: Date;
}): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(245, 247, 255);
  doc.rect(0, 0, pageWidth, pageHeight, "F");

  // Border
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(4);
  doc.rect(20, 20, pageWidth - 40, pageHeight - 40);

  // Inner border
  doc.setLineWidth(1);
  doc.setDrawColor(147, 197, 253);
  doc.rect(28, 28, pageWidth - 56, pageHeight - 56);

  // Logo / Brand text
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(37, 99, 235);
  doc.text("KAYISE IT", pageWidth / 2, 80, { align: "center" });

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text("Learning Management System", pageWidth / 2, 100, {
    align: "center",
  });

  // Certificate title
  doc.setFont("helvetica", "bold");
  doc.setFontSize(36);
  doc.setTextColor(30, 41, 59);
  doc.text("CERTIFICATE OF COMPLETION", pageWidth / 2, 155, {
    align: "center",
  });

  // Subtitle
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(71, 85, 105);
  doc.text("This is to certify that", pageWidth / 2, 195, { align: "center" });

  // Student name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(30);
  doc.setTextColor(37, 99, 235);
  doc.text(params.studentName, pageWidth / 2, 240, { align: "center" });

  // Underline
  const nameWidth = doc.getTextWidth(params.studentName);
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(1.5);
  doc.line(
    pageWidth / 2 - nameWidth / 2,
    246,
    pageWidth / 2 + nameWidth / 2,
    246
  );

  // Course completion text
  doc.setFont("helvetica", "normal");
  doc.setFontSize(14);
  doc.setTextColor(71, 85, 105);
  doc.text(
    "has successfully completed the course",
    pageWidth / 2,
    280,
    { align: "center" }
  );

  // Course name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(30, 41, 59);
  doc.text(`"${params.courseName}"`, pageWidth / 2, 320, { align: "center" });

  // Date
  const dateStr = params.completionDate.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(71, 85, 105);
  doc.text(`Completed on: ${dateStr}`, pageWidth / 2, 370, {
    align: "center",
  });

  // Footer
  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.text(
    "Kayise IT | Empowering Learners through Technology",
    pageWidth / 2,
    pageHeight - 50,
    { align: "center" }
  );

  const pdfArrayBuffer = doc.output("arraybuffer");
  return Buffer.from(pdfArrayBuffer);
}
