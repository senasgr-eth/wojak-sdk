import type { Address, InscriptionId, PsbtBase64, Txid } from "../types";

/** Payload for {@link IWojakProvider.createTx}. */
export interface CreateTxPayload {
  to: Address;
  /** amount in satoshis (1 WJK = 100,000,000 sats) */
  amount: number;
  receiverToPayFee: boolean;
  feeRate: number;
  /**
   * Optional OP_RETURN payload to embed in the transaction output.
   *
   * When `opReturnIsHex` is `true` (recommended for EVM address routing),
   * the wallet binary-decodes this string and produces on-chain:
   * `OP_RETURN OP_DATA20 <20 bytes>` → scriptPubKey `6a14<opReturn>`.
   *
   * When `opReturnIsHex` is `false` or omitted the string is UTF-8 encoded.
   *
   * Pass the raw 40-hex EVM address (no `0x` or `6a14` prefix).
   */
  opReturn?: string;
  /** Treat `opReturn` as hex bytes rather than UTF-8 text. Defaults to `false`. */
  opReturnIsHex?: boolean;
}

/**
 * Options for {@link IWojakProvider.sendWithOpReturn}.
 * The wallet builds the transaction, appends a bare OP_RETURN output whose
 * script is `OP_RETURN OP_DATA20 <payload>` (`6a14<40-hex>`), signs, and
 * broadcasts it in a single atomic operation.
 */
export interface SendWithOpReturnOptions {
  /** sat/vbyte fee rate; extension uses its default when omitted. */
  feeRate?: number;
}

interface BaseUserToSignInput {
  index: number;
  sighashTypes: number[] | undefined;
  disableTweakSigner?: boolean;
}

export interface AddressUserToSignInput extends BaseUserToSignInput {
  address: Address;
}

export interface PublicKeyUserToSignInput extends BaseUserToSignInput {
  publicKey: string;
}

export type UserToSignInput =
  | AddressUserToSignInput
  | PublicKeyUserToSignInput;

/** Options for {@link IWojakProvider.signPsbt}. */
export interface SignPsbtOptions {
  autoFinalized: boolean;
  toSignInputs?: UserToSignInput[];
}

/** One item of a {@link IWojakProvider.multiPsbtSign} batch. */
export interface MultiSignPsbtOptions {
  psbtBase64: PsbtBase64;
  options: SignPsbtOptions;
}

/** Result of inscribing a WJK-20 transfer. */
export interface InscribedTransferResult {
  mintedAmount: number;
}

/**
 * A single inscription request. `dataHex` is the hex-encoded inscription
 * payload (e.g. the bytes of a `wjk-20` JSON op, or an image).
 */
export interface InscribePayload {
  contentType: string;
  dataHex: string;
  /** receiver address; defaults to the connected account */
  receiver?: Address;
  feeRate: number;
}

/** Result of a single {@link IWojakProvider.inscribe}. */
export interface InscribeResult {
  txids: Txid[];
  inscriptionId: InscriptionId;
}

/** Result of {@link IWojakProvider.inscribeBatch}. */
export interface InscribeBatchResult {
  results: InscribeResult[];
}

/** A fully-signed, not-yet-broadcast inscription chain. */
export interface SignedInscription {
  inscriptionId: InscriptionId;
  /** ordered signed tx hex; the last entry is the reveal */
  txs: RawTx[];
  /** txid of the reveal (the tx a broadcaster waits to confirm) */
  revealTxid: Txid;
}

type RawTx = string;

/** Result of {@link IWojakProvider.inscribeBatchPresign}. */
export interface PresignBatchResult {
  inscriptions: SignedInscription[];
  receiver: Address;
  network: string;
}
