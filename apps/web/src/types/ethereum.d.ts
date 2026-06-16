// Extends the global Window type with MiniPay-specific ethereum provider fields.
// window.ethereum.isMiniPay is injected by Opera Mini's built-in wallet.
interface Window {
  ethereum?: {
    isMiniPay?: boolean;
    isMetaMask?: boolean;
    request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
    on: (event: string, handler: (...args: unknown[]) => void) => void;
    removeListener: (event: string, handler: (...args: unknown[]) => void) => void;
  };
}
