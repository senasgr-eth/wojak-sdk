import type { IWojakProvider } from "./provider";

export type { IWojakProvider } from "./provider";
export * from "./provider/types";
export * from "./types";

declare global {
  interface Window {
    wojak?: IWojakProvider;
  }
}

/** Public WojakCoin services, handy for dapps that also read chain data. */
export const WOJAK_ENDPOINTS = {
  mainnet: {
    electrs: "https://api.wojakcoin.cash",
    ord: "https://ord.wojakcoin.cash",
    tokenIndexer: "https://wjk20.wojakcoin.cash",
    explorer: "https://explorer.wojakcoin.cash",
  },
} as const;

/** Build the explorer URL for a transaction. */
export const explorerTxUrl = (txid: string): string =>
  `${WOJAK_ENDPOINTS.mainnet.explorer}/tx/${txid}`;

/** Convenience bundle returned by {@link initWojak}. */
export interface IWojak {
  /** The injected Wojak Wallet provider (`window.wojak`). */
  provider: IWojakProvider;
}

/**
 * Returns the injected Wojak Wallet provider, or `undefined` if the extension
 * is not installed / not yet injected.
 *
 * @example
 * const wojak = initWojak();
 * if (!wojak) return alert("Install Wojak Wallet");
 * const address = await wojak.provider.connect();
 */
export const initWojak = (): IWojak | undefined => {
  if (typeof window === "undefined" || !window.wojak) return undefined;
  return { provider: window.wojak };
};

/**
 * Resolves once the provider is injected (it loads asynchronously). Useful at
 * startup so you don't miss the wallet on a fast page load.
 *
 * @param timeoutMs how long to wait before giving up (default 3000ms).
 */
export const getWojakProvider = (
  timeoutMs = 3000
): Promise<IWojakProvider | undefined> => {
  if (typeof window === "undefined") return Promise.resolve(undefined);
  if (window.wojak) return Promise.resolve(window.wojak);

  return new Promise((resolve) => {
    let settled = false;
    const finish = (p?: IWojakProvider) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("wojak#initialized", onReady);
      resolve(p);
    };
    const onReady = () => finish(window.wojak);

    window.addEventListener("wojak#initialized", onReady, { once: true });
    setTimeout(() => finish(window.wojak), timeoutMs);
  });
};
