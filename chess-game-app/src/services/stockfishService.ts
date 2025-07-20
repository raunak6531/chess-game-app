import type { Position } from '../types/chess';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

interface StockfishConfig {
  skill: number;
  depth: number;
  time: number;
  multiPV?: number;
}

interface StockfishMove {
  from: Position;
  to: Position;
  promotion?: string;
}

class StockfishService {
  private engine: any = null;
  private isReady = false;
  private isThinking = false;
  private currentDifficulty: Difficulty = 'intermediate';
  private moveCallback: ((move: StockfishMove) => void) | null = null;
  private thinkingCallback: ((isThinking: boolean) => void) | null = null;
  private currentTimeout: number | null = null;

  // Difficulty configurations based on the plan
  private difficultyConfigs: Record<Difficulty, StockfishConfig> = {
    beginner: {
      skill: 2,
      depth: 1,
      time: 100,
      multiPV: 3
    },
    intermediate: {
      skill: 10,
      depth: 3,
      time: 500,
      multiPV: 2
    },
    advanced: {
      skill: 16,
      depth: 5,
      time: 2000
    },
    expert: {
      skill: 20,
      depth: 8,
      time: 5000
    }
  };

  async initialize(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        console.error('Stockfish initialization timeout - no uciok received within 30 seconds');
        reject(new Error('Stockfish initialization timeout'));
      }, 30000); // Increased to 30 seconds

      try {
        console.log('Initializing Stockfish WASM engine from public files...');

        // Load Stockfish from the public directory using the global Stockfish function
        // First, we need to load the stockfish.js script which will create the global Stockfish function
        const script = document.createElement('script');
        script.src = '/stockfish.js';
        script.onload = async () => {
          try {
            console.log('Stockfish script loaded, creating engine...');

            // Check if Stockfish is available globally
            // @ts-ignore - Stockfish is loaded globally
            if (typeof (window as any).Stockfish !== 'function') {
              console.error('Stockfish function not found on window object');
              console.log('Available on window:', Object.keys(window).filter(key => key.toLowerCase().includes('stock')));
              clearTimeout(timeout);
              reject(new Error('Stockfish function not available'));
              return;
            }

            // Now create the Stockfish engine instance and WAIT for it to load
            console.log('Creating Stockfish instance (awaiting Promise)...');
            const stockfish = await (window as any).Stockfish();
            this.engine = stockfish;

            console.log('Stockfish instance resolved:', stockfish);
            console.log('Available methods:', Object.keys(stockfish));
            console.log('Instance properties:', Object.getOwnPropertyNames(stockfish));

            // Set up message handling - try different approaches
            if (typeof stockfish.onmessage !== 'undefined') {
              console.log('Using onmessage property');
              stockfish.onmessage = (message: any) => {
                console.log("=== MESSAGE VIA onmessage ===");
                console.log("Message:", message);
                this.handleStockfishMessage(message, timeout, resolve);
              };
            } else if (typeof stockfish.addMessageListener === 'function') {
              console.log('Using addMessageListener method');
              stockfish.addMessageListener((message: any) => {
                console.log("=== MESSAGE VIA addMessageListener ===");
                console.log("Message:", message);
                this.handleStockfishMessage(message, timeout, resolve);
              });
            } else {
              console.error('No message handling method found on resolved Stockfish instance');
              console.log('Trying to find message-related methods...');
              const methods = Object.getOwnPropertyNames(stockfish).concat(Object.getOwnPropertyNames(Object.getPrototypeOf(stockfish)));
              console.log('All methods and properties:', methods);
              const messageRelated = methods.filter(name => name.toLowerCase().includes('message') || name.toLowerCase().includes('listen'));
              console.log('Message-related methods:', messageRelated);
            }

            // Initialize UCI protocol
            console.log('Sending UCI command to resolved engine...');
            this.sendCommand('uci');

          } catch (error) {
            console.error('Error in script onload:', error);
            clearTimeout(timeout);
            reject(new Error(`Failed to initialize Stockfish: ${error}`));
          }
        };

        script.onerror = (error) => {
          clearTimeout(timeout);
          console.error('Failed to load Stockfish script:', error);
          reject(new Error(`Failed to load Stockfish script: ${error}`));
        };

        document.head.appendChild(script);

      } catch (error) {
        clearTimeout(timeout);
        console.error('Failed to initialize Stockfish WASM:', error);
        reject(new Error(`Failed to initialize Stockfish WASM: ${error}`));
      }
    });
  }

  private handleStockfishMessage(message: any, timeout: number, resolve: () => void): void {
    console.log("=== PROCESSING STOCKFISH MESSAGE ===");
    console.log("Raw message:", message);
    console.log("Type:", typeof message);

    // Try to extract the actual message content
    let messageText = '';
    if (typeof message === 'string') {
      messageText = message;
    } else if (message && typeof message.data === 'string') {
      messageText = message.data;
    } else {
      messageText = String(message);
    }

    console.log("Extracted message text:", messageText);

    // Check for uciok message (very robust check)
    if (messageText.toLowerCase().includes('uciok')) {
      console.log("SUCCESS: 'uciok' signal was detected!");
      clearTimeout(timeout);
      this.isReady = true;
      this.setupEngine();
      console.log('Stockfish WASM engine ready - uciok received!');
      resolve();
    } else {
      console.log("Not uciok, processing as regular message");
      this.handleEngineMessage(messageText);
    }
  }

  private setupEngine(): void {
    // Set up the engine with default settings
    this.sendCommand('ucinewgame');
    this.setDifficulty(this.currentDifficulty);
    this.sendCommand('isready');
  }

  private sendCommand(command: string): void {
    if (!this.engine) {
      console.error('Stockfish engine not initialized');
      return;
    }

    console.log('Sending to Stockfish:', command);
    console.log('Engine object:', this.engine);
    console.log('Available methods on engine:', Object.keys(this.engine));

    // Handle resolved Stockfish instance - try different methods
    if (typeof this.engine.postMessage === 'function') {
      console.log('Using postMessage method');
      this.engine.postMessage(command);
    } else if (typeof this.engine.send === 'function') {
      console.log('Using send method');
      this.engine.send(command);
    } else if (typeof this.engine === 'function') {
      console.log('Using direct function call');
      this.engine(command);
    } else {
      console.error('No command sending method found on engine');
      console.log('Engine methods:', Object.getOwnPropertyNames(this.engine));
    }
  }

  private handleEngineMessage(message: string): void {
    const trimmedMessage = message.trim();
    console.log('Processing Stockfish response:', trimmedMessage);

    if (trimmedMessage.startsWith('bestmove')) {
      this.isThinking = false;
      this.thinkingCallback?.(false);

      // Clear timeout since we got a response
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = null;
      }

      const parts = trimmedMessage.split(' ');
      const moveStr = parts[1];

      if (moveStr && moveStr !== '(none)') {
        const move = this.parseMove(moveStr);
        if (move) {
          console.log('Parsed Stockfish move:', move);
          this.moveCallback?.(move);
        } else {
          console.error('Failed to parse move:', moveStr);
        }
      } else {
        console.log('No move available from Stockfish');
      }
    } else if (trimmedMessage.startsWith('info')) {
      // Handle thinking information
      if (trimmedMessage.includes('depth') && trimmedMessage.includes('score')) {
        if (!this.isThinking) {
          this.isThinking = true;
          this.thinkingCallback?.(true);
        }
      }
    } else if (trimmedMessage === 'readyok') {
      console.log('Stockfish is ready for commands');
    } else if (trimmedMessage.startsWith('option name')) {
      console.log('Stockfish option:', trimmedMessage);
    } else {
      console.log('Other Stockfish message:', trimmedMessage);
    }
  }

  private parseMove(moveStr: string): StockfishMove | null {
    if (moveStr.length < 4) return null;

    const fromFile = moveStr.charCodeAt(0) - 97; // 'a' = 97
    const fromRank = parseInt(moveStr[1]) - 1;
    const toFile = moveStr.charCodeAt(2) - 97;
    const toRank = parseInt(moveStr[3]) - 1;

    const move: StockfishMove = {
      from: { row: fromRank, col: fromFile },
      to: { row: toRank, col: toFile }
    };

    // Handle promotion
    if (moveStr.length === 5) {
      move.promotion = moveStr[4];
    }

    return move;
  }

  setDifficulty(difficulty: Difficulty): void {
    // Validate difficulty and provide fallback
    if (!this.difficultyConfigs[difficulty]) {
      console.warn(`Invalid difficulty: ${difficulty}, falling back to intermediate`);
      difficulty = 'intermediate';
    }

    this.currentDifficulty = difficulty;
    const config = this.difficultyConfigs[difficulty];

    if (this.isReady && config) {
      this.sendCommand(`setoption name Skill Level value ${config.skill}`);

      if (config.multiPV) {
        this.sendCommand(`setoption name MultiPV value ${config.multiPV}`);
      }

      // Set threads for better performance (except for beginner)
      const threads = difficulty === 'beginner' ? 1 : Math.min(4, navigator.hardwareConcurrency || 2);
      this.sendCommand(`setoption name Threads value ${threads}`);
    }
  }

  setPosition(fen: string): void {
    if (!this.isReady) {
      console.error('Stockfish not ready');
      return;
    }

    console.log('Setting position:', fen);
    this.sendCommand(`position fen ${fen}`);
  }

  requestMove(onMove: (move: StockfishMove) => void, onThinking?: (isThinking: boolean) => void): void {
    if (!this.isReady) {
      console.error('Stockfish not ready');
      return;
    }

    if (this.isThinking) {
      console.log('Stockfish is already thinking');
      return;
    }

    this.moveCallback = onMove;
    this.thinkingCallback = onThinking || null;

    const config = this.difficultyConfigs[this.currentDifficulty];

    console.log(`Requesting move with difficulty: ${this.currentDifficulty}`, config);

    // Set thinking state
    this.isThinking = true;
    onThinking?.(true);

    // Use time-based search for consistent difficulty
    this.sendCommand(`go movetime ${config.time}`);

    // Set a safety timeout in case Stockfish doesn't respond
    this.currentTimeout = setTimeout(() => {
      console.warn('Stockfish timeout - no response received');
      this.isThinking = false;
      onThinking?.(false);
      this.currentTimeout = null;
    }, config.time + 2000) as unknown as number; // Add 2 seconds buffer
  }

  stopThinking(): void {
    if (this.isThinking) {
      this.sendCommand('stop');
      this.isThinking = false;
      this.thinkingCallback?.(false);

      // Clear any pending timeout
      if (this.currentTimeout) {
        clearTimeout(this.currentTimeout);
        this.currentTimeout = null;
      }
    }
  }

  getDifficulty(): Difficulty {
    return this.currentDifficulty;
  }

  isEngineReady(): boolean {
    return this.isReady;
  }

  isEngineThinking(): boolean {
    return this.isThinking;
  }

  destroy(): void {
    console.log('Destroying Stockfish WASM engine');

    // Clear any pending timeout
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }

    // Properly terminate the engine
    if (this.engine) {
      this.sendCommand('quit');
      if (this.engine.terminate) {
        this.engine.terminate();
      }
      this.engine = null;
    }

    this.isReady = false;
    this.isThinking = false;
  }
}

// Export singleton instance
export const stockfishService = new StockfishService();
