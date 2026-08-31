interface VoiceRow {
  id: string;
  text: string;
  source: string;
  rating: number | null;
  gatheredAt: string;
  url: string;
}

function csvCell(value: string | number | null): string {
  const text = value == null ? "" : String(value);
  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export function voicesToCsv(voices: VoiceRow[]): string {
  const header = ["id", "source", "rating", "gatheredAt", "url", "text"];
  const rows = voices.map((voice) =>
    [
      csvCell(voice.id),
      csvCell(voice.source),
      csvCell(voice.rating),
      csvCell(voice.gatheredAt),
      csvCell(voice.url),
      csvCell(voice.text)
    ].join(",")
  );
  return [header.join(","), ...rows].join("\n");
}

export function downloadBlob(content: BlobPart, filename: string, mime: string): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function downloadJson(data: unknown, filename: string): void {
  downloadBlob(JSON.stringify(data, null, 2), filename, "application/json");
}

export function downloadText(content: string, filename: string, mime: string): void {
  downloadBlob(content, filename, mime);
}

export function scrapeDownloadUrl(kind: "raw" | "normalized"): string {
  return kind === "raw" ? "/discovery/raw-reviews.json" : "/discovery/normalized-reviews.json";
}
