import { z } from "zod";

const dateValue = z.union([z.string(), z.date()]).transform((value, ctx) => {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid cookie date" });
    return z.NEVER;
  }
  return date;
});

const cookieSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  value: z.string(),
  domain: z.string().min(1),
  path: z.string().startsWith("/"),
  set: dateValue,
  expires: dateValue.optional(),
  maxAge: z.number().finite().optional(),
  secure: z.boolean().optional(),
  httpOnly: z.boolean().optional(),
  sameSite: z.string().optional(),
}).passthrough().refine((cookie) =>
  cookie.id === `${cookie.domain}@${cookie.path}@${cookie.name}`,
  "Invalid cookie identifier",
);

export type ProxyCookie = z.infer<typeof cookieSchema>;
export const SAVE_FILENAME = "intonix-save.intonixsave";

export function parseCookies(value: unknown): ProxyCookie[] {
  return z.array(cookieSchema).parse(value);
}

export function unexpiredCookies(cookies: ProxyCookie[], now = Date.now()) {
  return cookies.filter((cookie) => {
    if (cookie.maxAge !== undefined) return cookie.set.getTime() + cookie.maxAge * 1000 > now;
    return !cookie.expires || cookie.expires.getTime() > now;
  });
}

function openCookieDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    // Match Ultraviolet's database so both transports use the restored cookies.
    const request = indexedDB.open("__op", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("cookies", { keyPath: "id" }).createIndex("path", "path");
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error("Cookie storage is busy. Close other console tabs and retry."));
  });
}

export async function exportCookies(): Promise<ProxyCookie[]> {
  const db = await openCookieDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("cookies", "readonly");
      const request = tx.objectStore("cookies").getAll();
      tx.oncomplete = () => {
        try { resolve(unexpiredCookies(parseCookies(request.result))); }
        catch (error) { reject(error); }
      };
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}

export async function importCookies(cookies: ProxyCookie[]): Promise<void> {
  const db = await openCookieDatabase();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("cookies", "readwrite");
      const store = tx.objectStore("cookies");
      // Merge by cookie ID, retaining cookies for sites absent from the save.
      for (const cookie of unexpiredCookies(cookies)) store.put(cookie);
      tx.oncomplete = () => resolve();
      tx.onabort = () => reject(tx.error);
      tx.onerror = () => reject(tx.error);
    });
  } finally { db.close(); }
}