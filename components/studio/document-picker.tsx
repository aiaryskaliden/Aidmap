"use client";

import { FileUp, LoaderCircle } from "lucide-react";
import { useId, useRef, useState, type DragEvent } from "react";
import type { Language } from "@/lib/advisor/contracts";
import {
  applicantFileTypes,
  DocumentError,
  importApplicantFile,
} from "@/lib/studio/documents";
import { tr, type Copy } from "@/lib/studio/reviews";
import style from "./studio.module.css";

const errors: Record<DocumentError["code"], Copy> = {
  type: [
    "Choose a PDF, DOCX, TXT or Markdown file.",
    "Выберите PDF, DOCX, TXT или Markdown.",
    "PDF, DOCX, TXT немесе Markdown файлын таңдаңыз.",
  ],
  size: [
    "Use a file under 5 MB with up to 30,000 characters.",
    "Подойдёт файл до 5 МБ с текстом до 30 000 символов.",
    "5 МБ-тан және 30 000 таңбадан аспайтын файлды пайдаланыңыз.",
  ],
  empty: [
    "This file has no readable text. Paste the text or choose a text-based copy.",
    "В файле нет извлекаемого текста. Вставьте текст или выберите копию с текстовым слоем.",
    "Файлда оқылатын мәтін жоқ. Мәтінді қойыңыз немесе мәтіндік файлды таңдаңыз.",
  ],
  pages: [
    "Choose a PDF with 24 pages or fewer.",
    "Выберите PDF до 24 страниц.",
    "24 беттен аспайтын PDF таңдаңыз.",
  ],
  read: [
    "This file could not be read. Try an unlocked copy or paste the text.",
    "Файл не удалось прочитать. Попробуйте копию без пароля или вставьте текст.",
    "Файл оқылмады. Құпиясөзсіз көшірмені немесе мәтінді пайдаланыңыз.",
  ],
};

export function DocumentPicker({
  language,
  title,
  onRead,
  compact = false,
}: {
  language: Language;
  title: string;
  onRead: (document: { fileName: string; text: string }) => void;
  compact?: boolean;
}) {
  const input = useId();
  const reading = useRef(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [over, setOver] = useState(false);
  async function read(file?: File) {
    if (!file || reading.current) return;
    reading.current = true;
    setBusy(true);
    setError(undefined);
    try {
      onRead(await importApplicantFile(file));
    } catch (problem) {
      setError(
        tr(
          language,
          errors[problem instanceof DocumentError ? problem.code : "read"],
        ),
      );
    } finally {
      reading.current = false;
      setBusy(false);
    }
  }
  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setOver(false);
    void read(event.dataTransfer.files[0]);
  }
  return (
    <div
      className={compact ? style.compactUpload : style.upload}
      data-over={over || undefined}
      onDragOver={(e) => {
        e.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={drop}
    >
      <input
        className="sr-only"
        id={input}
        type="file"
        accept={applicantFileTypes}
        disabled={busy}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void read(file);
        }}
      />
      <label htmlFor={input} className={style.uploadLabel}>
        <span className={style.uploadIcon}>
          {busy ? (
            <LoaderCircle size={19} className={style.spin} />
          ) : (
            <FileUp size={19} />
          )}
        </span>
        <span>
          <strong>{title}</strong>
          <small>PDF, DOCX, TXT, MD · 5 MB</small>
        </span>
      </label>
      {busy && (
        <span role="status" className={style.quiet}>
          {tr(language, ["Reading file…", "Читаем файл…", "Файл оқылуда…"])}
        </span>
      )}
      {error && (
        <p className={style.formError} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
