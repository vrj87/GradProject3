import { inflateRawSync } from "node:zlib";

/**
 * Minimal .xlsx reader. A workbook is a zip of XML parts, so the survey export
 * can be read with only node builtins — no spreadsheet dependency, and no
 * hand-copied numbers between the export and the repo.
 *
 * Supports what Google Sheets emits: stored or deflated entries, shared
 * strings, inline strings, and numbers. Formulas are read as their cached value.
 */

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;

/** Reads the zip central directory rather than scanning for local headers. */
export function unzip(buffer: Buffer): Map<string, Buffer> {
  let eocd = -1;
  for (let at = buffer.length - 22; at >= 0 && at > buffer.length - 65_557; at -= 1) {
    if (buffer.readUInt32LE(at) === EOCD_SIGNATURE) {
      eocd = at;
      break;
    }
  }
  if (eocd < 0) throw new Error("not a zip file: end of central directory missing");

  const entries = new Map<string, Buffer>();
  let at = buffer.readUInt32LE(eocd + 16);
  const count = buffer.readUInt16LE(eocd + 10);

  for (let index = 0; index < count; index += 1) {
    if (buffer.readUInt32LE(at) !== CENTRAL_SIGNATURE) break;
    const method = buffer.readUInt16LE(at + 10);
    const compressedSize = buffer.readUInt32LE(at + 20);
    const nameLength = buffer.readUInt16LE(at + 28);
    const extraLength = buffer.readUInt16LE(at + 30);
    const commentLength = buffer.readUInt16LE(at + 32);
    const localOffset = buffer.readUInt32LE(at + 42);
    const name = buffer.toString("utf8", at + 46, at + 46 + nameLength);

    const localNameLength = buffer.readUInt16LE(localOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localOffset + 28);
    const start = localOffset + 30 + localNameLength + localExtraLength;
    const raw = buffer.subarray(start, start + compressedSize);

    entries.set(name, method === 0 ? Buffer.from(raw) : inflateRawSync(raw));
    at += 46 + nameLength + extraLength + commentLength;
  }

  return entries;
}

function unescapeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) => String.fromCharCode(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

function textOf(fragment: string): string {
  return [...fragment.matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
    .map((match) => unescapeXml(match[1] ?? ""))
    .join("");
}

/** Shared strings are plain <t>, or rich text split across <r><t> runs. */
function sharedStrings(parts: Map<string, Buffer>): string[] {
  const xml = parts.get("xl/sharedStrings.xml")?.toString("utf8");
  if (!xml) return [];
  return [...xml.matchAll(/<si>([\s\S]*?)<\/si>/g)].map((match) => textOf(match[1] ?? ""));
}

function columnIndex(ref: string): number {
  const letters = ref.replace(/[^A-Z]/g, "");
  let index = 0;
  for (const char of letters) index = index * 26 + (char.charCodeAt(0) - 64);
  return index - 1;
}

export function sheetRows(parts: Map<string, Buffer>, sheet = 1): string[][] {
  const key = `xl/worksheets/sheet${sheet}.xml`;
  const xml = parts.get(key)?.toString("utf8");
  if (!xml) throw new Error(`worksheet missing: ${key}`);

  const strings = sharedStrings(parts);
  const rows: string[][] = [];

  for (const rowMatch of xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)) {
    const cells: string[] = [];
    for (const cellMatch of (rowMatch[1] ?? "").matchAll(/<c([^>]*)>([\s\S]*?)<\/c>/g)) {
      const attrs = cellMatch[1] ?? "";
      const body = cellMatch[2] ?? "";
      const ref = /r="([A-Z]+\d+)"/.exec(attrs)?.[1];
      const type = /t="([^"]+)"/.exec(attrs)?.[1];
      const target = ref ? columnIndex(ref) : cells.length;

      let value: string;
      if (type === "inlineStr") {
        value = textOf(body);
      } else {
        const raw = /<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? "";
        value = type === "s" ? strings[Number(raw)] ?? "" : unescapeXml(raw);
      }

      while (cells.length < target) cells.push("");
      cells[target] = value.trim();
    }
    rows.push(cells);
  }

  return rows;
}

export function readXlsxRows(buffer: Buffer, sheet = 1): string[][] {
  return sheetRows(unzip(buffer), sheet);
}
