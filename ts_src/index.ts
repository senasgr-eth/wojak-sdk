import type { IWojakProvider } from "./provider";
import type { SendWithOpReturnOptions } from "./provider/types";

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
 * Broadcast a signed raw transaction hex to an Electrs-compatible REST node.
 *
 * @param electrsUrl - base URL of the electrs REST API (e.g. `"https://api.wojakcoin.cash"`)
 * @param rawHex - fully signed transaction hex
 * @returns the broadcast txid
 * @throws if the server returns an error or the response is not a valid txid
 */
export async function broadcastRawTx(
  electrsUrl: string,
  rawHex: string,
): Promise<string> {
  const url = electrsUrl.replace(/\/$/, "") + "/tx";
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: rawHex,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Broadcast failed (${res.status}): ${text}`);
  const txid = text.trim();
  if (!/^[0-9a-f]{64}$/i.test(txid))
    throw new Error(`Unexpected broadcast response: ${text}`);
  return txid;
}

/**
 * Send satoshis to `toAddress` with an OP_RETURN output that embeds a raw
 * 20-byte EVM address as chain-routing metadata.
 *
 * `opReturnPayload` must be a **40-character hex string** — the raw 20-byte
 * EVM address without `0x` or `6a14` prefix. The wallet produces the on-chain
 * script `OP_RETURN OP_DATA20 <payload>` → `6a14<payload>`.
 *
 * **Dispatch order:**
 * 1. `provider.sendWithOpReturn` — if the extension implements it, the wallet
 *    signs *and* broadcasts internally; returns the txid directly.
 * 2. `provider.createTx` + {@link broadcastRawTx} — the extension signs the tx
 *    (with OP_RETURN embedded via `opReturn`/`opReturnIsHex`), returns the raw
 *    hex, then we broadcast to `options.electrsUrl`.
 *    `options.electrsUrl` is **required** for this fallback path.
 *
 * @returns the broadcast txid
 *
 * @example
 * const txid = await sendBitcoinWithOpReturn(
 *   provider,
 *   custodyAddress,
 *   amountSats,
 *   evmAddress.toLowerCase().replace(/^0x/, ""),
 *   { feeRate: 10, electrsUrl: "https://api.wojakcoin.cash" },
 * );
 */
export async function sendBitcoinWithOpReturn(
  provider: IWojakProvider,
  toAddress: string,
  satoshis: number,
  opReturnPayload: string,
  options?: SendWithOpReturnOptions & { electrsUrl?: string },
): Promise<string> {
  if (!/^[0-9a-f]{40}$/i.test(opReturnPayload)) {
    throw new Error(
      `sendBitcoinWithOpReturn: opReturnPayload must be a 40-character hex string ` +
        `(raw 20-byte EVM address, no 0x or 6a14 prefix). Got: "${opReturnPayload}"`,
    );
  }

  // Path 1 — native sendWithOpReturn (sign + broadcast in one call)
  if (typeof provider.sendWithOpReturn === "function") {
    return provider.sendWithOpReturn(toAddress, satoshis, opReturnPayload, options);
  }

  // Path 2 — createTx (returns signed hex) + electrs broadcast
  if (!options?.electrsUrl) {
    throw new Error(
      "sendBitcoinWithOpReturn: options.electrsUrl is required when the wallet " +
        "does not implement sendWithOpReturn.",
    );
  }
  const signedHex = await provider.createTx({
    to: toAddress,
    amount: satoshis,
    receiverToPayFee: false,
    feeRate: options?.feeRate ?? 10,
    opReturn: opReturnPayload,
    opReturnIsHex: true,
  });
  return broadcastRawTx(options.electrsUrl, signedHex);
}

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
