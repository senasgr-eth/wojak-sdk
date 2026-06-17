"use strict";
"use client";
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
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.useWojak = exports.WojakWalletProvider = void 0;
const React = __importStar(require("react"));
const index_1 = require("./index");
const WojakContext = React.createContext({
    installed: false,
    isConnected: false,
    connect: async () => undefined,
});
const WojakWalletProvider = ({ children, }) => {
    const [provider, setProvider] = React.useState();
    const [isConnected, setIsConnected] = React.useState(false);
    const [address, setAddress] = React.useState();
    React.useEffect(() => {
        let active = true;
        (0, index_1.getWojakProvider)().then(async (p) => {
            if (!active || !p)
                return;
            setProvider(p);
            try {
                const connected = await p.isConnected();
                setIsConnected(connected);
                if (connected)
                    setAddress(await p.getAccount());
            }
            catch {
                /* not connected yet */
            }
            const onAccounts = (acc) => {
                const next = Array.isArray(acc) ? acc[0] : acc === null || acc === void 0 ? void 0 : acc.address;
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
        if (!provider)
            return undefined;
        const acc = await provider.connect();
        setAddress(acc);
        setIsConnected(true);
        return acc;
    }, [provider]);
    const value = {
        wojak: provider ? { provider } : undefined,
        provider,
        installed: !!provider,
        isConnected,
        address,
        connect,
    };
    return (React.createElement(WojakContext.Provider, { value: value }, children));
};
exports.WojakWalletProvider = WojakWalletProvider;
/** Access the Wojak Wallet from any component inside WojakWalletProvider. */
const useWojak = () => React.useContext(WojakContext);
exports.useWojak = useWojak;
