import * as React from "react";
import { type IWojak } from "./index";
import type { IWojakProvider } from "./provider";
interface WojakContextProps {
    /** The injected provider bundle, or undefined until ready. */
    wojak?: IWojak;
    /** The raw provider (`window.wojak`), or undefined until ready. */
    provider?: IWojakProvider;
    /** Whether the extension is detected. */
    installed: boolean;
    /** Whether this site is connected to the wallet. */
    isConnected: boolean;
    /** Connected account address (after connect / accountsChanged). */
    address?: string;
    /** Trigger the connect approval flow. */
    connect: () => Promise<string | undefined>;
}
export declare const WojakWalletProvider: React.FC<{
    children: React.ReactNode;
}>;
/** Access the Wojak Wallet from any component inside WojakWalletProvider. */
export declare const useWojak: () => WojakContextProps;
export {};
