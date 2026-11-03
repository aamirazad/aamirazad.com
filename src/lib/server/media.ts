import { del, get, put } from "@vercel/blob";

export type StoredObject = {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  cacheControl: string;
  etag: string;
  uploadedAt: Date;
};

/** Storage for uploaded originals and their generated variants. */
export interface MediaStore {
  put(
    key: string,
    bytes: Uint8Array,
    options: { contentType: string; cacheControlMaxAge?: number },
  ): Promise<void>;
  get(key: string): Promise<StoredObject | null>;
  delete(key: string): Promise<void>;
}

/** A private Vercel Blob store. Objects are only reachable through the `/media` route. */
export function blobMediaStore(token: string): MediaStore {
  return {
    async put(key, bytes, options) {
      await put(key, Buffer.from(bytes), {
        access: "private",
        token,
        contentType: options.contentType,
        cacheControlMaxAge: options.cacheControlMaxAge,
        addRandomSuffix: false,
        allowOverwrite: true,
      });
    },
    async get(key) {
      const result = await get(key, { access: "private", token });
      if (!result || result.statusCode !== 200) return null;
      return {
        body: result.stream,
        contentType: result.blob.contentType,
        cacheControl: result.blob.cacheControl,
        etag: result.blob.etag,
        uploadedAt: result.blob.uploadedAt,
      };
    },
    async delete(key) {
      await del(key, { token });
    },
  };
}

/** An in-process store for local development and tests. */
export function memoryMediaStore(): MediaStore {
  const objects = new Map<string, { bytes: Uint8Array; contentType: string; uploadedAt: Date }>();
  return {
    async put(key, bytes, options) {
      objects.set(key, { bytes, contentType: options.contentType, uploadedAt: new Date() });
    },
    async get(key) {
      const object = objects.get(key);
      if (!object) return null;
      return {
        body: new Blob([Uint8Array.from(object.bytes)]).stream(),
        contentType: object.contentType,
        cacheControl: "",
        etag: `"${key}"`,
        uploadedAt: object.uploadedAt,
      };
    },
    async delete(key) {
      objects.delete(key);
    },
  };
}
