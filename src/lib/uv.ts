/** Ultraviolet service-worker routing (browser only). */
type UVConfig = { prefix: string; encodeUrl: (url: string) => string };

let ready: Promise<UVConfig | null> | null = null;
type MuxConn = { setTransport: (path: string, opts: unknown[]) => Promise<void> };
let connection: MuxConn | null = null;
let bareAddr = "";
let wispAddr = "";
let registration: ServiceWorkerRegistration | null = null;

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const script = document.createElement("script");
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

/** Load the UV bundle/config and register the service worker under /uv/service/. */
export function initUV(): Promise<UVConfig | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) return Promise.resolve(null);
  ready ??= (async () => {
    try {
      await loadScript("/uv/uv.bundle.js");
      await loadScript("/uv/uv.config.js");
      await loadScript("/baremux/index.js");
      const mux = (window as unknown as { BareMux: { BareMuxConnection: new (w: string) => MuxConn } }).BareMux;
      connection = new mux.BareMuxConnection("/baremux/worker.js");
      const config = (window as unknown as { __uv$config: UVConfig }).__uv$config;
      registration = await navigator.serviceWorker.register("/uv/sw.js", { scope: config.prefix });
      // navigator.serviceWorker.ready can hang when the registration scope
      // (/uv/service/) doesn't cover the page URL — wait for activation instead.
      const worker = registration.active ?? registration.waiting ?? registration.installing;
      if (worker && worker.state !== "activated") {
        await new Promise<void>((resolve) => {
          const timeout = window.setTimeout(resolve, 5000);
          worker.addEventListener("statechange", () => {
            if (worker.state === "activated") {
              window.clearTimeout(timeout);
              resolve();
            }
          });
        });
      }
      return config;
    } catch (error) {
      console.error("Ultraviolet init failed", error);
      ready = null;
      return null;
    }
  })();
  return ready;
}

/** Build the /uv/service/ path for a full target URL. */
export function uvUrl(config: UVConfig, url: string) {
  const encode =
    (window as unknown as { Ultraviolet?: { codec: { xor: { encode: (u: string) => string } } } }).Ultraviolet?.codec.xor.encode ??
    config.encodeUrl;
  return config.prefix + encode(url);
}

/** Current transport: "wisp" (fast tunnel) or "bare" (Lambda). */
export let activeTransport: "wisp" | "bare" = "bare";

async function applyTransport() {
  if (!connection) return;
  try {
    if (wispAddr) {
      await connection.setTransport("/epoxy/index.mjs", [{ wisp: wispAddr }]);
      activeTransport = "wisp";
      return;
    }
  } catch (error) {
    console.warn("Wisp transport failed, using Bare", error);
  }
  if (bareAddr) {
    await connection.setTransport("/baremod/index.mjs", [bareAddr + "/"]);
    activeTransport = "bare";
  }
}

/** Point the proxy at a Bare engine (used for guests and as fallback). */
export function setUVBare(url: string) {
  bareAddr = url.replace(/\/+$/, "");
  return applyTransport();
}

/** Enable (wss:// address) or disable ("") the Wisp tunnel. */
export function setUVWisp(url: string) {
  wispAddr = url;
  return applyTransport();
}
