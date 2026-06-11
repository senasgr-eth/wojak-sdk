# Wojak SDK

Provider SDK for the **Wojak Wallet** browser extension — connect your dapp to
the [WojakCoin](https://wojakcoin.cash) (WJK) blockchain, request signatures,
send WJK, and create WJK-20 / ordinal inscriptions.

The extension injects a provider at `window.wojak`. This package gives you
typed access to it, an async helper that waits for injection, and an optional
React binding.

## Install

```bash
npm install wojak-sdk
# or
bun add wojak-sdk
```

`react` is an optional peer dependency, only needed for `wojak-sdk/react`.

## Quick start

```ts
import { getWojakProvider } from "wojak-sdk";

const provider = await getWojakProvider();
if (!provider) throw new Error("Install Wojak Wallet");

const address = await provider.connect();   // prompts the user
const sats = await provider.getBalance();
console.log(address, sats / 1e8, "WJK");
```

### Detect synchronously

```ts
import { initWojak } from "wojak-sdk";

const wojak = initWojak();          // undefined if not installed/not ready yet
await wojak?.provider.connect();
```

`window.wojak` is injected asynchronously, so on a fresh page load prefer
`getWojakProvider()` (it resolves on the `wojak#initialized` event).

## React

```tsx
import { WojakWalletProvider, useWojak } from "wojak-sdk/react";

function App() {
  return (
    <WojakWalletProvider>
      <Connect />
    </WojakWalletProvider>
  );
}

function Connect() {
  const { installed, isConnected, address, connect } = useWojak();
  if (!installed) return <p>Install Wojak Wallet</p>;
  return isConnected ? <p>{address}</p> : <button onClick={connect}>Connect</button>;
}
```

## API

Everything is `Promise`-based. Any method that signs or spends prompts the user
for approval in the wallet UI.

### Account & network

| Method | Returns | Description |
| --- | --- | --- |
| `connect()` | `Address` | Prompt to connect; returns the account address |
| `isConnected()` | `boolean` | Is this site already connected |
| `getAccount()` | `Address` | Connected account address |
| `getAccountName()` | `string` | Account display name |
| `getPublicKey()` | `string` | Compressed pubkey (hex) |
| `getBalance()` | `number` | Confirmed balance in **satoshis** |
| `getNetwork()` | `"mainnet" \| "testnet"` | Current network |
| `switchNetwork(n)` | `NetworkType` | Prompt to switch network |
| `getVersion()` | `string` | Installed wallet version |

### Transactions & signing

| Method | Returns | Description |
| --- | --- | --- |
| `createTx(payload)` | `string` | Funded, signed payment tx hex (not broadcast) |
| `calculateFee(hex, feeRate)` | `number` | Estimated fee in sats |
| `signMessage(text)` | `string` | Message signature |
| `signPsbt(psbtBase64, options?)` | `string` | Signed PSBT (base64) |
| `multiPsbtSign(items)` | `string[]` | Sign multiple PSBTs behind one approval |

```ts
const rawTx = await provider.createTx({
  to: "WgX...",
  amount: 100_000_000, // 1 WJK in sats
  receiverToPayFee: false,
  feeRate: 10,
});
```

### Inscriptions & WJK-20

| Method | Returns | Description |
| --- | --- | --- |
| `inscribe(payload)` | `{ txids, inscriptionId }` | Inscribe one item and broadcast |
| `inscribeBatch(payloads)` | `{ results }` | Inscribe many in mempool-safe waves |
| `inscribeBatchPresign(payloads)` | `{ inscriptions, receiver, network }` | Sign a whole batch without broadcasting (for relays) |
| `inscribeTransfer(tick)` | `{ mintedAmount }` | Inscribe a WJK-20 transfer |

```ts
const toHex = (s: string) =>
  [...new TextEncoder().encode(s)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

const res = await provider.inscribe({
  contentType: "text/plain;charset=utf-8",
  dataHex: toHex(JSON.stringify({ p: "wjk-20", op: "transfer", tick: "wojak", amt: "1" })),
  feeRate: 10,
});
console.log(res.inscriptionId);
```

### Events

```ts
provider.on("accountsChanged", (accounts) => { /* ... */ });
provider.on("networkChanged", (network) => { /* ... */ });
provider.on("disconnect", () => { /* ... */ });
```

### Endpoints helper

```ts
import { WOJAK_ENDPOINTS, explorerTxUrl } from "wojak-sdk";

WOJAK_ENDPOINTS.mainnet.electrs;      // https://api.wojakcoin.cash
explorerTxUrl("<txid>");              // https://explorer.wojakcoin.cash/tx/<txid>
```

## Examples

- [`examples/vanilla`](./examples/vanilla) — zero-build HTML page. Open it in a
  browser with the wallet installed.
- [`examples/react`](./examples/react) — minimal React app using the hook.

## Building from source

```bash
npm install
npm run build      # emits dist/
```

## License

MIT
