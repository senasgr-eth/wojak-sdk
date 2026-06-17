/** A WojakCoin address (Base58, e.g. "WgX..."). */
export type Address = string;
/** A transaction id (hex). */
export type Txid = string;
/** Raw transaction hex. */
export type RawTxHex = string;
/** A PSBT serialized as base64. */
export type PsbtBase64 = string;
/** An inscription id, e.g. "<txid>i0". */
export type InscriptionId = string;
/** Networks the Wojak Wallet exposes to dapps. */
export type NetworkType = "mainnet" | "testnet";
/** Events emitted by the provider. */
export type WojakEvent = "connect" | "disconnect" | "close" | "accountsChanged" | "networkChanged";
/** A UTXO entry returned by {@link IWojakProvider.getUtxos}. */
export interface Utxo {
    txid: Txid;
    vout: number;
    /** Value in satoshis. */
    satoshis: number;
    /** Raw scriptPubKey hex, if the wallet provides it. */
    scriptPubKey?: string;
    /** Confirmation count. 0 = mempool. */
    confirmations?: number;
}
