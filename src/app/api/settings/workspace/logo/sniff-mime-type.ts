/**
 * Content-sniffed mime type for the three logo formats the panel accepts. The
 * browser's `File.type` is client-declared — trusting it lets a renamed script
 * masquerade as an image (docs/SECURITY_HYGIENE.md §4: "type sniffed from
 * content not extension"). Returns null for anything else, including a
 * corrupted or unsupported file.
 */
const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const JPEG_SIGNATURE = [0xff, 0xd8, 0xff];

function hasSignature(bytes: Buffer, signature: number[]): boolean {
  if (bytes.length < signature.length) return false;
  return signature.every((byte, i) => bytes[i] === byte);
}

/** SVG is text, not a magic-byte format — sniffed by looking for a root `<svg>` tag. */
function looksLikeSvg(bytes: Buffer): boolean {
  const head = bytes.subarray(0, 1024).toString('utf8');
  return /^\s*(<\?xml[^>]*\?>\s*)?(<!--[\s\S]*?-->\s*)*(<!doctype[^>]*>\s*)?<svg[\s>]/i.test(head);
}

export function sniffMimeType(bytes: Buffer): 'image/png' | 'image/jpeg' | 'image/svg+xml' | null {
  if (hasSignature(bytes, PNG_SIGNATURE)) return 'image/png';
  if (hasSignature(bytes, JPEG_SIGNATURE)) return 'image/jpeg';
  if (looksLikeSvg(bytes)) return 'image/svg+xml';
  return null;
}
