"use client";

import * as React from "react";
import { getWojakProvider, type IWojak } from "./index";
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

const WojakContext = React.createContext<WojakContextProps>({
  installed: false,
  isConnected: false,
  connect: async () => undefined,
});

export const WojakWalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [provider, setProvider] = React.useState<IWojakProvider>();
  const [isConnected, setIsConnected] = React.useState(false);
  const [address, setAddress] = React.useState<string>();

  React.useEffect(() => {
    let active = true;
    getWojakProvider().then(async (p) => {
      if (!active || !p) return;
      setProvider(p);
      try {
        const connected = await p.isConnected();
        setIsConnected(connected);
        if (connected) setAddress(await p.getAccount());
      } catch {
        /* not connected yet */
      }

      const onAccounts = (acc: { address?: string } | string[] | undefined) => {
        const next = Array.isArray(acc) ? acc[0] : acc?.address;
        setAddress(next);
        setIsConnected(!!next);
      };
      const onDisconnect = () => {
        setIsConnected(false);
        setAddress(undefined);
      };
      p.on("accountsChanged", onAccounts);
      p.on("disconnect", onDisconnect);
    });
    return () => {
      active = false;
    };
  }, []);

  const connect = React.useCallback(async () => {
    if (!provider) return undefined;
    const acc = await provider.connect();
    setAddress(acc);
    setIsConnected(true);
    return acc;
  }, [provider]);

  const value: WojakContextProps = {
    wojak: provider ? { provider } : undefined,
    provider,
    installed: !!provider,
    isConnected,
    address,
    connect,
  };

  return (
    <WojakContext.Provider value={value}>{children}</WojakContext.Provider>
  );
};

/** Access the Wojak Wallet from any component inside WojakWalletProvider. */
export const useWojak = (): WojakContextProps =>
  React.useContext(WojakContext);
