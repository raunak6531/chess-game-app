import React from 'react';

interface EngineStatusProps {
  isEngineReady: boolean;
  isComputerThinking: boolean;
}

export const EngineStatus: React.FC<EngineStatusProps> = ({ 
  isEngineReady, 
  isComputerThinking 
}) => {
  const isSharedArrayBufferAvailable = typeof SharedArrayBuffer !== 'undefined';
  
  return (
    <div className="bg-gray-100 p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold mb-2">Engine Status</h3>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isSharedArrayBufferAvailable ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm">
            SharedArrayBuffer: {isSharedArrayBufferAvailable ? 'Available' : 'Not Available'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${
            isEngineReady ? 'bg-green-500' : 'bg-red-500'
          }`} />
          <span className="text-sm">
            Stockfish Engine: {isEngineReady ? 'Ready' : 'Not Ready'}
          </span>
        </div>
        
        {isEngineReady && (
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isComputerThinking ? 'bg-yellow-500 animate-pulse' : 'bg-gray-400'
            }`} />
            <span className="text-sm">
              Computer: {isComputerThinking ? 'Thinking...' : 'Idle'}
            </span>
          </div>
        )}
        
        {!isSharedArrayBufferAvailable && (
          <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> SharedArrayBuffer is not available. This may prevent the chess engine from working properly. 
              The site needs to be served with proper security headers.
            </p>
          </div>
        )}
        
        {!isEngineReady && isSharedArrayBufferAvailable && (
          <div className="mt-3 p-3 bg-red-100 border border-red-400 rounded">
            <p className="text-sm text-red-800">
              <strong>Engine Error:</strong> The chess engine failed to initialize. 
              You can still play against another human player.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};