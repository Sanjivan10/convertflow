import { type ConvertInput, type ConvertResult } from "./types";
import { convertImages } from "./image";
import { convertPdf } from "./pdf";

export type Engine = "IMAGE" | "PDF" | "CUSTOM";

/**
 * Run an admin-authored client-side converter. The script body must define a
 * function `convert(files, options)` returning `{ name, blob }` or an array of
 * them. Executed with `new Function` in the browser only — never on the server.
 */
async function runCustomScript(
  script: string,
  input: ConvertInput,
): Promise<ConvertResult> {
  const start = performance.now();
  const factory = new Function(
    "files",
    "options",
    "helpers",
    `${script}\n; return convert(files, options, helpers);`,
  );
  const helpers = {
    makeBlob: (parts: BlobPart[], type: string) => new Blob(parts, { type }),
    readArrayBuffer: (file: File) => file.arrayBuffer(),
    readText: (file: File) => file.text(),
  };
  const raw = await factory(input.files, input.options, helpers);
  const list = Array.isArray(raw) ? raw : [raw];
  const files = list.map(
    (item: { name: string; blob: Blob }) => ({
      name: item.name,
      blob: item.blob,
      url: URL.createObjectURL(item.blob),
      size: item.blob.size,
    }),
  );
  return { files, durationMs: Math.round(performance.now() - start) };
}

export async function runConversion(
  engine: Engine,
  input: ConvertInput,
  customScript = "",
): Promise<ConvertResult> {
  switch (engine) {
    case "IMAGE":
      return convertImages(input);
    case "PDF":
      return convertPdf(input);
    case "CUSTOM":
      if (!customScript.trim()) {
        throw new Error("This tool has no converter script configured yet.");
      }
      return runCustomScript(customScript, input);
    default:
      throw new Error(`Unknown engine: ${engine}`);
  }
}

export * from "./types";
