"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getWojakProvider = exports.getAnyProvider = exports.uriSchemeToBrand = exports.getAllProviders = exports.detectProvider = exports.initWojak = exports.explorerTxUrl = exports.WOJAK_ENDPOINTS = void 0;
exports.broadcastRawTx = broadcastRawTx;
exports.sendBitcoinWithOpReturn = sendBitcoinWithOpReturn;
__exportStar(require("./provider/types"), exports);
__exportStar(require("./types"), exports);
/** Public WojakCoin services, handy for dapps that also read chain data. */
exports.WOJAK_ENDPOINTS = {
    mainnet: {
        electrs: "https://api.wojakcoin.cash",
        ord: "https://ord.wojakcoin.cash",
        tokenIndexer: "https://wjk20.wojakcoin.cash",
        explorer: "https://explorer.wojakcoin.cash",
    },
};
/** Build the explorer URL for a transaction. */
const explorerTxUrl = (txid) => `${exports.WOJAK_ENDPOINTS.mainnet.explorer}/tx/${txid}`;
exports.explorerTxUrl = explorerTxUrl;
/**
 * Returns the injected Wojak Wallet provider, or `undefined` if the extension
 * is not installed / not yet injected.
 *
 * @example
 * const wojak = initWojak();
 * if (!wojak) return alert("Install Wojak Wallet");
 * const address = await wojak.provider.connect();
 */
const initWojak = () => {
    if (typeof window === "undefined" || !window.wojak)
        return undefined;
    return { provider: window.wojak };
};
exports.initWojak = initWojak;
/**
 * Broadcast a signed raw transaction hex to an Electrs-compatible REST node.
 *
 * @param electrsUrl - base URL of the electrs REST API (e.g. `"https://api.wojakcoin.cash"`)
 * @param rawHex - fully signed transaction hex
 * @returns the broadcast txid
 * @throws if the server returns an error or the response is not a valid txid
 */
async function broadcastRawTx(electrsUrl, rawHex) {
    const url = electrsUrl.replace(/\/$/, "") + "/tx";
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: rawHex,
    });
    const text = await res.text();
    if (!res.ok)
        throw new Error(`Broadcast failed (${res.status}): ${text}`);
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
async function sendBitcoinWithOpReturn(provider, toAddress, satoshis, opReturnPayload, options) {
    var _a;
    if (!/^[0-9a-f]{40}$/i.test(opReturnPayload)) {
        throw new Error(`sendBitcoinWithOpReturn: opReturnPayload must be a 40-character hex string ` +
            `(raw 20-byte EVM address, no 0x or 6a14 prefix). Got: "${opReturnPayload}"`);
    }
    // Path 1 — native sendWithOpReturn (sign + broadcast in one call)
    if (typeof provider.sendWithOpReturn === "function") {
        return provider.sendWithOpReturn(toAddress, satoshis, opReturnPayload, options);
    }
    // Path 2 — createTx (returns signed hex) + electrs broadcast
    if (!(options === null || options === void 0 ? void 0 : options.electrsUrl)) {
        throw new Error("sendBitcoinWithOpReturn: options.electrsUrl is required when the wallet " +
            "does not implement sendWithOpReturn.");
    }
    const signedHex = await provider.createTx({
        to: toAddress,
        amount: satoshis,
        receiverToPayFee: false,
        feeRate: (_a = options === null || options === void 0 ? void 0 : options.feeRate) !== null && _a !== void 0 ? _a : 10,
        opReturn: opReturnPayload,
        opReturnIsHex: true,
    });
    return broadcastRawTx(options.electrsUrl, signedHex);
}
/**
 * Synchronously detect any compatible provider (Wojak or Junkcoin).
 * @param preferredBrand - if set, check that global first.
 */
const detectProvider = (preferredBrand) => {
    if (typeof window === "undefined")
        return undefined;
    if (preferredBrand === "junkcoin" && window.junkcoin)
        return { provider: window.junkcoin, brand: "junkcoin" };
    if (preferredBrand === "wojak" && window.wojak)
        return { provider: window.wojak, brand: "wojak" };
    if (window.wojak)
        return { provider: window.wojak, brand: "wojak" };
    if (window.junkcoin)
        return { provider: window.junkcoin, brand: "junkcoin" };
    return undefined;
};
exports.detectProvider = detectProvider;
/** Get all installed compatible providers. */
const getAllProviders = () => {
    if (typeof window === "undefined")
        return [];
    const results = [];
    if (window.wojak)
        results.push({ provider: window.wojak, brand: "wojak" });
    if (window.junkcoin)
        results.push({ provider: window.junkcoin, brand: "junkcoin" });
    return results;
};
exports.getAllProviders = getAllProviders;
/**
 * Map a UTXO chain URI scheme (from .env JKC_URI_SCHEME) to the wallet brand.
 * Returns undefined if unknown.
 */
const uriSchemeToBrand = (scheme) => {
    if (!scheme)
        return undefined;
    const s = scheme.toLowerCase().trim();
    if (s === "wojakcoin" || s === "wojak")
        return "wojak";
    if (s === "junkcoin" || s === "jkc" || s === "junkcoin-testnet")
        return "junkcoin";
    return undefined;
};
exports.uriSchemeToBrand = uriSchemeToBrand;
/**
 * Resolves once ANY compatible provider (Wojak or Junkcoin) is injected.
 * @param preferredBrand - prioritise this wallet when both are installed.
 */
const getAnyProvider = (timeoutMs = 3000, preferredBrand) => {
    if (typeof window === "undefined")
        return Promise.resolve(undefined);
    const immediate = (0, exports.detectProvider)(preferredBrand);
    if (immediate)
        return Promise.resolve(immediate);
    return new Promise((resolve) => {
        let settled = false;
        const finish = (result) => {
            if (settled)
                return;
            settled = true;
            window.removeEventListener("wojak#initialized", onWojak);
            window.removeEventListener("junkcoin#initialized", onJunkcoin);
            resolve(result);
        };
        const onWojak = () => {
            if (window.wojak)
                finish({ provider: window.wojak, brand: "wojak" });
        };
        const onJunkcoin = () => {
            if (window.junkcoin)
                finish({ provider: window.junkcoin, brand: "junkcoin" });
        };
        window.addEventListener("wojak#initialized", onWojak, { once: true });
        window.addEventListener("junkcoin#initialized", onJunkcoin, {
            once: true,
        });
        setTimeout(() => finish((0, exports.detectProvider)(preferredBrand)), timeoutMs);
    });
};
exports.getAnyProvider = getAnyProvider;
/**
 * Resolves once the provider is injected (it loads asynchronously). Useful at
 * startup so you don't miss the wallet on a fast page load.
 *
 * @param timeoutMs how long to wait before giving up (default 3000ms).
 */
const getWojakProvider = (timeoutMs = 3000) => {
    if (typeof window === "undefined")
        return Promise.resolve(undefined);
    if (window.wojak)
        return Promise.resolve(window.wojak);
    return new Promise((resolve) => {
        let settled = false;
        const finish = (p) => {
            if (settled)
                return;
            settled = true;
            window.removeEventListener("wojak#initialized", onReady);
            resolve(p);
        };
        const onReady = () => finish(window.wojak);
        window.addEventListener("wojak#initialized", onReady, { once: true });
        setTimeout(() => finish(window.wojak), timeoutMs);
    });
};
exports.getWojakProvider = getWojakProvider;
