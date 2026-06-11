import type { Address, NetworkType, WojakEvent } from "../types";
import type {
  CreateTxPayload,
  InscribeBatchResult,
  InscribePayload,
  InscribeResult,
  InscribedTransferResult,
  MultiSignPsbtOptions,
  PresignBatchResult,
  SignPsbtOptions,
} from "./types";

/**
 * The Wojak Wallet provider, injected by the browser extension as
 * `window.wojak`. Every method that moves funds or signs data prompts the
 * user for explicit approval inside the wallet UI.
 */
export interface IWojakProvider {
  /**
   * Request the user to connect this site to their wallet.
   * @returns the connected account address.
   */
  connect(): Promise<Address>;

  /** Whether this site is already connected. */
  isConnected(): Promise<boolean>;

  /** The connected account address. */
  getAccount(): Promise<Address>;

  /** The connected account's display name. */
  getAccountName(): Promise<string>;

  /** The connected account's compressed public key (hex). */
  getPublicKey(): Promise<string>;

  /** Confirmed balance of the connected account, in satoshis. */
  getBalance(): Promise<number>;

  /** Current network. */
  getNetwork(): Promise<NetworkType>;

  /** Request the user to switch network. */
  switchNetwork(network: NetworkType): Promise<NetworkType>;

  /** Installed wallet version. */
  getVersion(): Promise<string>;

  /**
   * Build a funded, signed payment transaction (not broadcast).
   * @returns the raw transaction hex.
   */
  createTx(data: CreateTxPayload): Promise<string>;

  /** Estimate the fee (sats) for a raw tx hex at a given fee rate. */
  calculateFee(hex: string, feeRate: number): Promise<number>;

  /** Sign an arbitrary message; returns the signature. */
  signMessage(text: string): Promise<string>;

  /** Sign a PSBT (base64); returns the signed PSBT base64. */
  signPsbt(
    psbtBase64: string,
    options?: SignPsbtOptions
  ): Promise<string>;

  /** Sign several PSBTs behind a single approval. */
  multiPsbtSign(data: MultiSignPsbtOptions[]): Promise<string[]>;

  /** Inscribe a WJK-20 transfer for the given tick. */
  inscribeTransfer(tick: string): Promise<InscribedTransferResult>;

  /** Inscribe a single inscription and broadcast it. */
  inscribe(payload: InscribePayload): Promise<InscribeResult>;

  /** Inscribe a batch and broadcast in mempool-safe waves. */
  inscribeBatch(payloads: InscribePayload[]): Promise<InscribeBatchResult>;

  /**
   * Sign an entire batch behind one approval but DO NOT broadcast — returns
   * the signed chain so a relay can broadcast in waves after the page closes.
   */
  inscribeBatchPresign(
    payloads: InscribePayload[]
  ): Promise<PresignBatchResult>;

  /** Subscribe to a provider event. */
  on(event: WojakEvent, handler: (payload: any) => void): void;

  /** Unsubscribe from a provider event. */
  removeListener(event: WojakEvent, handler: (payload: any) => void): void;
}
