import * as React from "react";
import { WojakWalletProvider, useWojak } from "wojak-sdk/react";

/**
 * Minimal React example. Wrap your app in <WojakWalletProvider> and use the
 * useWojak() hook anywhere to access the wallet.
 *
 *   import { createRoot } from "react-dom/client";
 *   createRoot(document.getElementById("root")!).render(<App />);
 */
export default function App() {
  return (
    <WojakWalletProvider>
      <Wallet />
    </WojakWalletProvider>
  );
}

function Wallet() {
  const { installed, isConnected, address, connect, provider } = useWojak();
  const [balance, setBalance] = React.useState<number>();

  if (!installed) {
    return (
      <p>
        Wojak Wallet not detected.{" "}
        <a href="https://github.com/reallyshadydev/wojak-wallet-extension/releases">
          Install it
        </a>{" "}
        and reload.
      </p>
    );
  }

  return (
    <div style={{ fontFamily: "system-ui", maxWidth: 480, margin: "40px auto" }}>
      <h1>Wojak Wallet — React</h1>

      {!isConnected ? (
        <button onClick={() => connect()}>Connect</button>
      ) : (
        <>
          <p>
            <strong>Address:</strong> {address}
          </p>
          <button
            onClick={async () => setBalance(await provider!.getBalance())}
          >
            Get balance
          </button>
          {balance !== undefined && (
            <p>
              <strong>Balance:</strong> {balance / 1e8} WJK
            </p>
          )}
          <button
            onClick={async () => {
              const sig = await provider!.signMessage("gm from Wojak");
              alert(sig);
            }}
          >
            Sign message
          </button>
        </>
      )}
    </div>
  );
}
