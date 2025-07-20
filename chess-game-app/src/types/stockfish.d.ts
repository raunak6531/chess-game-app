declare module 'stockfish' {
  interface StockfishEngine {
    (command: string): void;
    onmessage?: (message: string) => void;
  }

  function Stockfish(): StockfishEngine;
  export default Stockfish;
}

declare module 'stockfish.wasm' {
  interface StockfishWasmEngine {
    addMessageListener(callback: (message: string) => void): void;
    postMessage(command: string): void;
    terminate(): void;
  }

  function StockfishWasm(): Promise<StockfishWasmEngine>;
  export default StockfishWasm;
}

// Global Stockfish declaration
declare global {
  interface Window {
    Stockfish: () => {
      postMessage: (command: string) => void;
      onmessage: (message: string) => void;
      terminate: () => void;
    };
  }
}
