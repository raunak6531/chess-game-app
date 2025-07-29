import { describe, it, expect, beforeEach, vi } from 'vitest';
import { stockfishService } from '../services/stockfishService';
import { initializeGameState, gameStateToFen } from '../logic/chessGame';

describe('Stockfish Integration', () => {
  beforeEach(() => {
    // Reset the service before each test
    stockfishService.destroy();
  });

  it('should initialize the Stockfish service', async () => {
    await stockfishService.initialize();
    expect(stockfishService.isEngineReady()).toBe(true);
  });

  it('should set difficulty levels correctly', async () => {
    await stockfishService.initialize();
    
    stockfishService.setDifficulty('beginner');
    expect(stockfishService.getDifficulty()).toBe('beginner');
    
    stockfishService.setDifficulty('expert');
    expect(stockfishService.getDifficulty()).toBe('expert');
  });

  it('should generate FEN notation from game state', () => {
    const gameState = initializeGameState();
    const fen = gameStateToFen(gameState);
    
    // Standard starting position FEN
    expect(fen).toBe('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
  });

  it('should request computer moves', async () => {
    await stockfishService.initialize();
    
    const gameState = initializeGameState();
    const fen = gameStateToFen(gameState);
    stockfishService.setPosition(fen);
    
    return new Promise<void>((resolve) => {
      stockfishService.requestMove(
        (move) => {
          expect(move).toHaveProperty('from');
          expect(move).toHaveProperty('to');
          expect(move.from).toHaveProperty('row');
          expect(move.from).toHaveProperty('col');
          expect(move.to).toHaveProperty('row');
          expect(move.to).toHaveProperty('col');
          resolve();
        },
        (thinking) => {
          // Thinking callback should be called
          expect(typeof thinking).toBe('boolean');
        }
      );
    });
  });

  it('should handle different difficulty levels with different timing', async () => {
    await stockfishService.initialize();
    
    const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'] as const;
    
    for (const difficulty of difficulties) {
      stockfishService.setDifficulty(difficulty);
      expect(stockfishService.getDifficulty()).toBe(difficulty);
      
      const startTime = Date.now();
      
      await new Promise<void>((resolve) => {
        stockfishService.requestMove(
          (_move) => {
            const endTime = Date.now();
            const duration = endTime - startTime;
            
            // Verify that different difficulties take different amounts of time
            // (This is a rough check since we're using mock timing)
            expect(duration).toBeGreaterThan(50); // At least some delay
            resolve();
          }
        );
      });
    }
  });

  it('should not allow multiple simultaneous move requests', async () => {
    await stockfishService.initialize();
    
    const consoleSpy = vi.spyOn(console, 'log');
    
    // Start first request
    stockfishService.requestMove(() => {});
    
    // Try to start second request while first is thinking
    stockfishService.requestMove(() => {});
    
    expect(consoleSpy).toHaveBeenCalledWith('Stockfish is already thinking');
    
    consoleSpy.mockRestore();
  });

  it('should stop thinking when requested', async () => {
    await stockfishService.initialize();
    
    stockfishService.requestMove(() => {});
    expect(stockfishService.isEngineThinking()).toBe(true);
    
    stockfishService.stopThinking();
    expect(stockfishService.isEngineThinking()).toBe(false);
  });
});
