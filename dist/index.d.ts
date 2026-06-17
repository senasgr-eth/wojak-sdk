import type { IWojakProvider } from "./provider";
import type { SendWithOpReturnOptions } from "./provider/types";
export type { IWojakProvider } from "./provider";
export * from "./provider/types";
export * from "./types";
/** Which extension brand injected the provider. */
export type WalletBrand = "wojak" | "junkcoin";
export interface DetectedProvider {
    provider: IWojakProvider;
    brand: WalletBrand;
}
declare global {
    interface Window {
        wojak?: IWojakProvider;
        junkcoin?: IWojakProvider;
    }
}
/** Public WojakCoin services, handy for dapps that also read chain data. */
export declare const WOJAK_ENDPOINTS: {
    readonly mainnet: {
        readonly electrs: "https://api.wojakcoin.cash";
        readonly ord: "https://ord.wojakcoin.cash";
        readonly tokenIndexer: "https://wjk20.wojakcoin.cash";
        readonly explorer: "https://explorer.wojakcoin.cash";
    };
};
/** Build the explorer URL for a transaction. */
export declare const explorerTxUrl: (txid: string) => string;
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
export declare const initWojak: () => IWojak | undefined;
/**
 * Broadcast a signed raw transaction hex to an Electrs-compatible REST node.
 *
 * @param electrsUrl - base URL of the electrs REST API (e.g. `"https://api.wojakcoin.cash"`)
 * @param rawHex - fully signed transaction hex
 * @returns the broadcast txid
 * @throws if the server returns an error or the response is not a valid txid
 */
export declare function broadcastRawTx(electrsUrl: string, rawHex: string): Promise<string>;
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
export declare function sendBitcoinWithOpReturn(provider: IWojakProvider, toAddress: string, satoshis: number, opReturnPayload: string, options?: SendWithOpReturnOptions & {
    electrsUrl?: string;
}): Promise<string>;
/**
 * Synchronously detect any compatible provider (Wojak or Junkcoin).
 * @param preferredBrand - if set, check that global first.
 */
export declare const detectProvider: (preferredBrand?: WalletBrand) => DetectedProvider | undefined;
/** Get all installed compatible providers. */
export declare const getAllProviders: () => DetectedProvider[];
/**
 * Map a UTXO chain URI scheme (from .env JKC_URI_SCHEME) to the wallet brand.
 * Returns undefined if unknown.
 */
export declare const uriSchemeToBrand: (scheme: string | undefined) => WalletBrand | undefined;
/**
 * Resolves once ANY compatible provider (Wojak or Junkcoin) is injected.
 * @param preferredBrand - prioritise this wallet when both are installed.
 */
export declare const getAnyProvider: (timeoutMs?: number, preferredBrand?: WalletBrand) => Promise<DetectedProvider | undefined>;
/**
 * Resolves once the provider is injected (it loads asynchronously). Useful at
 * startup so you don't miss the wallet on a fast page load.
 *
 * @param timeoutMs how long to wait before giving up (default 3000ms).
 */
export declare const getWojakProvider: (timeoutMs?: number) => Promise<IWojakProvider | undefined>;
