import { maxDocumentText } from "@/types/studio";

const maxBytes = 5 * 1024 * 1024;
const maxPages = 24;
const maxXml = 1_500_000;
export const applicantFileTypes = ".pdf,.docx,.txt,.md";

export class DocumentError extends Error {
  constructor(public code: "type" | "size" | "empty" | "pages" | "read") {
    super(code);
  }
}

function decodeText(data: Uint8Array) {
  return new TextDecoder("utf-8", { fatal: true }).decode(data);
}

async function pdfText(data: Uint8Array) {
  const { getDocumentProxy, extractText } = await import("unpdf");
  const pdf = await getDocumentProxy(data, {
    useSystemFonts: false,
  });
  try {
    if (pdf.numPages > maxPages) throw new DocumentError("pages");
    const { text } = await extractText(pdf);
    return text.join("\n\n");
  } finally {
    await pdf.loadingTask.destroy();
  }
}

async function documentText(data: Uint8Array) {
  const { unzipSync } = await import("fflate");
  const found = unzipSync(data, {
    filter: (entry) =>
      entry.name === "word/document.xml" && entry.originalSize <= maxXml,
  });
  const part = found["word/document.xml"];
  if (!part || part.byteLength > maxXml) throw new DocumentError("read");
  const xml = decodeText(part);
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) throw new DocumentError("read");
  const parsed = new DOMParser().parseFromString(xml, "application/xml");
  if (parsed.getElementsByTagName("parsererror").length)
    throw new DocumentError("read");
  return Array.from(parsed.getElementsByTagNameNS("*", "p"), (paragraph) =>
    Array.from(
      paragraph.getElementsByTagNameNS("*", "t"),
      (text) => text.textContent,
    ).join(""),
  ).join("\n\n");
}

export async function importApplicantFile(file: File) {
  const extension = file.name.trim().toLowerCase().split(".").at(-1);
  if (!["txt", "md", "pdf", "docx"].includes(extension ?? ""))
    throw new DocumentError("type");
  if (file.size > maxBytes) throw new DocumentError("size");
  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const content =
      extension === "pdf"
        ? await pdfText(bytes)
        : extension === "docx"
          ? await documentText(bytes)
          : decodeText(bytes);
    const text = content
      .replace(/\r\n?/g, "\n")
      .replace(/\u0000/g, "")
      .trim();
    if (!text) throw new DocumentError("empty");
    if (text.length > maxDocumentText) throw new DocumentError("size");
    return { fileName: file.name.trim().slice(0, 180), text };
  } catch (error) {
    if (error instanceof DocumentError) throw error;
    throw new DocumentError("read");
  }
}
