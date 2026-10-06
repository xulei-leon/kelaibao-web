import { createHash } from "node:crypto";

export const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
export const ALLOWED_MEDIA_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type AllowedMediaMimeType =
  (typeof ALLOWED_MEDIA_MIME_TYPES)[number];

const EXTENSIONS: Record<AllowedMediaMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export interface MediaRequest {
  fileName: string;
  mimeType: string;
  byteSize: number;
  sha256: string;
}

export interface ValidatedMediaRequest {
  fileName: string;
  mimeType: AllowedMediaMimeType;
  byteSize: number;
  sha256: string;
  extension: string;
}

export function validateMediaRequest(
  input: MediaRequest,
): ValidatedMediaRequest {
  if (
    !ALLOWED_MEDIA_MIME_TYPES.includes(
      input.mimeType as AllowedMediaMimeType,
    )
  ) {
    throw new Error("Unsupported image MIME type.");
  }
  if (
    !Number.isSafeInteger(input.byteSize) ||
    input.byteSize <= 0 ||
    input.byteSize > MAX_MEDIA_BYTES
  ) {
    throw new Error("Image must be no larger than 10 MB.");
  }
  if (!/^[a-f0-9]{64}$/i.test(input.sha256)) {
    throw new Error("Image SHA-256 must be a 64-character hexadecimal value.");
  }
  if (
    !input.fileName ||
    input.fileName.includes("/") ||
    input.fileName.includes("\\") ||
    input.fileName.includes("\0")
  ) {
    throw new Error("Image file name must not contain a path.");
  }
  const mimeType = input.mimeType as AllowedMediaMimeType;
  return {
    fileName: input.fileName,
    mimeType,
    byteSize: input.byteSize,
    sha256: input.sha256.toLowerCase(),
    extension: EXTENSIONS[mimeType],
  };
}

function detectedMimeType(bytes: Buffer): AllowedMediaMimeType | null {
  if (
    bytes.length >= 3 &&
    bytes[0] === 0xff &&
    bytes[1] === 0xd8 &&
    bytes[2] === 0xff
  ) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 8 &&
    bytes.subarray(0, 8).equals(
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    )
  ) {
    return "image/png";
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "image/webp";
  }
  return null;
}

function jpegDimensions(bytes: Buffer) {
  let offset = 2;
  while (offset + 8 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > bytes.length) break;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) break;
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      const height = bytes.readUInt16BE(offset + 3);
      const width = bytes.readUInt16BE(offset + 5);
      return { width, height };
    }
    offset += length;
  }
  return null;
}

function webpDimensions(bytes: Buffer) {
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const type = bytes.subarray(offset, offset + 4).toString("ascii");
    const size = bytes.readUInt32LE(offset + 4);
    const data = offset + 8;
    if (data + size > bytes.length) return null;
    if (type === "VP8X" && size >= 10) {
      return {
        width: 1 + bytes.readUIntLE(data + 4, 3),
        height: 1 + bytes.readUIntLE(data + 7, 3),
      };
    }
    if (type === "VP8 " && size >= 10) {
      return {
        width: bytes.readUInt16LE(data + 6) & 0x3fff,
        height: bytes.readUInt16LE(data + 8) & 0x3fff,
      };
    }
    if (type === "VP8L" && size >= 5 && bytes[data] === 0x2f) {
      const bits = bytes.readUInt32LE(data + 1);
      return {
        width: (bits & 0x3fff) + 1,
        height: ((bits >>> 14) & 0x3fff) + 1,
      };
    }
    offset = data + size + (size % 2);
  }
  return null;
}

function imageDimensions(bytes: Buffer, mimeType: AllowedMediaMimeType) {
  if (mimeType === "image/png" && bytes.length >= 24) {
    return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
  }
  if (mimeType === "image/jpeg") return jpegDimensions(bytes);
  return webpDimensions(bytes);
}

export function inspectAllowedImage(
  bytes: Buffer,
  {
    expectedMimeType,
    expectedByteSize,
    expectedSha256,
  }: {
    expectedMimeType: AllowedMediaMimeType;
    expectedByteSize: number;
    expectedSha256: string;
  },
) {
  if (bytes.length !== expectedByteSize || bytes.length > MAX_MEDIA_BYTES) {
    throw new Error("Image size does not match the upload intent.");
  }
  const mimeType = detectedMimeType(bytes);
  if (!mimeType || mimeType !== expectedMimeType) {
    throw new Error("Image signature does not match its MIME type.");
  }
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  if (sha256 !== expectedSha256.toLowerCase()) {
    throw new Error("Image checksum does not match the upload intent.");
  }
  const dimensions = imageDimensions(bytes, mimeType);
  if (
    !dimensions ||
    !Number.isSafeInteger(dimensions.width) ||
    !Number.isSafeInteger(dimensions.height) ||
    dimensions.width <= 0 ||
    dimensions.height <= 0
  ) {
    throw new Error("Image dimensions could not be verified.");
  }
  return { mimeType, byteSize: bytes.length, sha256, ...dimensions };
}
