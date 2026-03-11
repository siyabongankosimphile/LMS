function appendCertificateId(baseUrl: string, certificateId: string) {
  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}certificateId=${encodeURIComponent(certificateId)}`;
}

export function buildCertificateVerificationUrl(params: {
  origin: string;
  certificateId: string;
}) {
  const { origin, certificateId } = params;
  const linkedinBase = process.env.LINKEDIN_CERTIFICATE_VERIFY_URL?.trim();

  if (linkedinBase) {
    return appendCertificateId(linkedinBase, certificateId);
  }

  // Fallback to internal verification route if LinkedIn URL is not configured.
  return `${origin}/certificates/verify/${encodeURIComponent(certificateId)}`;
}
