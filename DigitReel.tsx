import React, { useEffect, useState } from 'react';

interface DigitReelProps {
  targetDigit: number; // The number we want to land on (0-9)
  isSpinning: boolean;
  delay?: number; // Delay before stopping for cascading effect
  onStop?: () => void;
}

const DigitReel: React.FC<DigitReelProps> = ({ targetDigit, isSpinning, delay = 0, onStop }) => {
  const [displayDigit, setDisplayDigit] = useState(targetDigit);
  const [internalSpinning, setInternalSpinning] = useState(false);
  
  // Handle the logic for spinning
  useEffect(() => {
    let interval: any;
    let stopTimeout: any;

    if (isSpinning) {
      // Start spinning instantly
      setInternalSpinning(true);
      interval = setInterval(() => {
        setDisplayDigit(Math.floor(Math.random() * 10));
      }, 50); // Speed of number change
    } else if (!isSpinning && internalSpinning) {
      // If parent says stop, we wait for our delay then stop
      stopTimeout = setTimeout(() => {
        setInternalSpinning(false);
        setDisplayDigit(targetDigit);
        if (onStop) onStop();
      }, delay);
    }

    return () => {
      clearInterval(interval);
      clearTimeout(stopTimeout);
    };
  }, [isSpinning, targetDigit, delay, internalSpinning, onStop]);

  return (
    <div className="relative w-28 h-40 md:w-52 md:h-80 bg-gradient-to-b from-yellow-400 to-yellow-600 rounded-xl overflow-hidden border-[6px] border-yellow-200 shadow-[0_0_25px_rgba(255,215,0,0.6)] mx-1 md:mx-3">
      {/* Inner shadow for depth */}
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_30px_rgba(0,0,0,0.5)] z-10 rounded-xl"></div>
      
      {/* Highlight/Gloss */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent z-10 pointer-events-none"></div>

      <div className="flex items-center justify-center h-full">
        <span 
          className={`text-8xl md:text-[11rem] font-bold text-white drop-shadow-xl transform transition-all duration-100 leading-none ${internalSpinning ? 'blur-[2px] scale-110' : 'scale-100'}`}
          style={{ fontFamily: 'Roboto, sans-serif' }}
        >
          {displayDigit}
        </span>
      </div>
      
      {/* Mechanical lines/texture */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-black/10 z-0"></div>
      <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black/10 z-0"></div>
    </div>
  );
};

export default DigitReel;