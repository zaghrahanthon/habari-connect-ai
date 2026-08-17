export type ChatAttachment = {
  title: string;
  fileUrl: string;
  fileType?: string | null;
};

/** Only allow links we can actually serve */
export function isSafeChatLink(url: string): boolean {
  return (
    url.startsWith("/api/resources/") ||
    url.startsWith("/uploads/") ||
    url.startsWith("http://") ||
    url.startsWith("https://")
  );
}

/** Remove AI-invented or malformed markdown links from the reply body */
export function sanitizeChatReply(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, url: string) => {
      if (isSafeChatLink(url)) return match;
      return label;
    })
    .replace(/\/uploads\/example\.pdf/gi, "")
    .replace(/\n*Documents:\n(\[Download[^\n]+\]\([^)]+\)\n?)+/gi, "")
    .trim();
}

/** Append verified download links only when the user asked for a file */
export function appendVerifiedDownloadSection(
  text: string,
  attachments: ChatAttachment[],
  offerDownloads: boolean,
): string {
  const cleaned = sanitizeChatReply(text);
  if (!offerDownloads || attachments.length === 0) return cleaned;

  const links = attachments
    .map((a) => `[Download ${a.title}](${a.fileUrl})`)
    .join("\n");

  return `${cleaned}\n\nDocuments:\n${links}`;
}
