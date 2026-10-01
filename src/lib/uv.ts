/** Ultraviolet service-worker routing (browser only). */
type UVConfig = { prefix: string; encodeUrl: (url: string) => string };

let ready: Promise<UVConfig | null> | null = null;

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
      const config = (window as unknown as { __uv$config: UVConfig }).__uv$config;
      await navigator.serviceWorker.register("/uv/sw.js", { scope: config.prefix });
      await navigator.serviceWorker.ready;
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
