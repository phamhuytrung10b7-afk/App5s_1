import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameState, Prize, NumberConfig } from './types';
import { INITIAL_PRIZES, MAX_NUMBER } from './constants';
import DigitReel from './DigitReel';
import PrizeCard from './PrizeCard';
import HistoryModal from './HistoryModal';
import SettingsModal from './SettingsModal';
import WinnerModal from './WinnerModal';
import { runFireworks } from './confetti';
import { Settings, Volume2, VolumeX, List, RefreshCcw, Play, Square, Timer } from 'lucide-react';

const STORAGE_KEY_PRIZES = 'tet_lucky_draw_prizes';
const STORAGE_KEY_CONFIG = 'tet_lucky_draw_config';

// Audio Assets
const SPIN_AUDIO_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-epic-impact-drums-trailers-2990.mp3';
const WIN_AUDIO_URL = 'https://assets.mixkit.co/sfx/preview/mixkit-fireworks-bang-and-crackle-2029.mp3';

const App: React.FC = () => {
  // --- Initialization from LocalStorage ---
  const getInitialPrizes = (): Prize[] => {
    const saved = localStorage.getItem(STORAGE_KEY_PRIZES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved prizes", e);
      }
    }
    return INITIAL_PRIZES;
  };

  const getInitialConfig = (): NumberConfig => {
    const saved = localStorage.getItem(STORAGE_KEY_CONFIG);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Error parsing saved config", e);
      }
    }
    return {
      mode: 'RANGE',
      min: 1,
      max: MAX_NUMBER,
      customList: [],
      names: {},
      isAutoStop: false,
      spinDuration: 5,
      backgroundImage: null
    };
  };

  // --- State ---
  const [prizes, setPrizes] = useState<Prize[]>(getInitialPrizes);
  const [numberConfig, setNumberConfig] = useState<NumberConfig>(getInitialConfig);
  
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [gameState, setGameState] = useState<GameState>(GameState.IDLE);
  const [targetNumber, setTargetNumber] = useState<number>(0); 
  const [displayNumber, setDisplayNumber] = useState<number>(0); 
  const [isMuted, setIsMuted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showWinnerModal, setShowWinnerModal] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [reelsStopped, setReelsStopped] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Audio Refs
  const spinAudioRef = useRef<HTMLAudioElement | null>(null);
  const winAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize Audio
  useEffect(() => {
    spinAudioRef.current = new Audio(SPIN_AUDIO_URL);
    spinAudioRef.current.loop = true;
    winAudioRef.current = new Audio(WIN_AUDIO_URL);
    
    return () => {
        if (spinAudioRef.current) {
            spinAudioRef.current.pause();
            spinAudioRef.current = null;
        }
        if (winAudioRef.current) {
            winAudioRef.current.pause();
            winAudioRef.current = null;
        }
    };
  }, []);

  // Sync Mute State
  useEffect(() => {
    if (spinAudioRef.current) spinAudioRef.current.muted = isMuted;
    if (winAudioRef.current) winAudioRef.current.muted = isMuted;
  }, [isMuted]);

  // Handle Game State Audio Triggers
  useEffect(() => {
    if (gameState === GameState.SPINNING) {
        if (spinAudioRef.current) {
            spinAudioRef.current.currentTime = 0;
            spinAudioRef.current.play().catch(e => console.log("Audio play blocked", e));
        }
    } else if (gameState === GameState.STOPPING) {
        // We keep playing spin music until the last reel stops or fade it out
    } else if (gameState === GameState.CELEBRATING) {
        if (spinAudioRef.current) spinAudioRef.current.pause();
        if (winAudioRef.current) {
            winAudioRef.current.currentTime = 0;
            winAudioRef.current.play().catch(e => console.log("Audio play blocked", e));
        }
    } else if (gameState === GameState.IDLE) {
        if (spinAudioRef.current) spinAudioRef.current.pause();
    }
  }, [gameState]);

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_PRIZES, JSON.stringify(prizes));
  }, [prizes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_CONFIG, JSON.stringify(numberConfig));
  }, [numberConfig]);

  // Ensure current prize index is valid if prizes change
  useEffect(() => {
    if (currentPrizeIndex >= prizes.length) {
      setCurrentPrizeIndex(0);
    }
  }, [prizes.length, currentPrizeIndex]);

  const currentPrize = prizes[currentPrizeIndex] || prizes[0];
  const canSpin = currentPrize && currentPrize.winners.length < currentPrize.quantity;

  // --- Helpers ---
  const getMaxNumberLength = () => {
    if (numberConfig.mode === 'RANGE') {
        return numberConfig.max.toString().length;
    } else {
        if (numberConfig.customList.length === 0) return 3;
        const maxInList = Math.max(...numberConfig.customList);
        return maxInList.toString().length;
    }
  };

  const padLength = Math.max(3, getMaxNumberLength());

  const generateRandomNumber = (): number | null => {
    const allWinners = prizes.flatMap(p => p.winners);
    let availableNumbers: number[] = [];

    if (numberConfig.mode === 'RANGE') {
        for (let i = numberConfig.min; i <= numberConfig.max; i++) {
            if (!allWinners.includes(i)) {
                availableNumbers.push(i);
            }
        }
    } else {
        availableNumbers = numberConfig.customList.filter(n => !allWinners.includes(n));
    }

    if (availableNumbers.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * availableNumbers.length);
    return availableNumbers[randomIndex];
  };

  const handleStartSpin = () => {
    if (!canSpin || gameState !== GameState.IDLE) return;
    const winNum = generateRandomNumber();
    if (winNum === null) {
        alert("Đã hết số quay khả dụng trong kho số!");
        return;
    }
    setGameState(GameState.SPINNING);
    setReelsStopped(0);
    setTargetNumber(winNum);
  };

  const handleStopSpin = () => {
    if (gameState !== GameState.SPINNING) return;
    setGameState(GameState.STOPPING);
  };

  // --- Auto Stop Logic ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (gameState === GameState.SPINNING && numberConfig.isAutoStop) {
        setCountdown(numberConfig.spinDuration);
        interval = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setGameState(GameState.STOPPING);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
    }
    return () => clearInterval(interval);
  }, [gameState, numberConfig.isAutoStop, numberConfig.spinDuration]);

  const handleReelStop = useCallback(() => {
    setReelsStopped(prev => prev + 1);
  }, []);

  const handleClaimPrize = () => {
    setShowWinnerModal(false);
    setGameState(GameState.IDLE);
    if (winAudioRef.current) winAudioRef.current.pause();
  };

  useEffect(() => {
      if (reelsStopped === padLength && gameState === GameState.STOPPING) {
          setGameState(GameState.CELEBRATING);
      }
  }, [reelsStopped, gameState, padLength]);

  useEffect(() => {
    if (gameState === GameState.CELEBRATING) {
      setShowFlash(true);
      setTimeout(() => setShowFlash(false), 300);
      if (canvasRef.current) runFireworks(canvasRef.current);
      
      const newPrizes = [...prizes];
      if (newPrizes[currentPrizeIndex]) {
          newPrizes[currentPrizeIndex].winners = [...newPrizes[currentPrizeIndex].winners, targetNumber];
          setPrizes(newPrizes);
      }
      
      setDisplayNumber(targetNumber);
      setTimeout(() => {
        setShowWinnerModal(true);
      }, 800);
    }
  }, [gameState, currentPrizeIndex, targetNumber]);

  const nextPrize = () => setCurrentPrizeIndex((prev) => (prev + 1) % prizes.length);
  const prevPrize = () => setCurrentPrizeIndex((prev) => (prev - 1 + prizes.length) % prizes.length);

  const resetData = () => {
    const clearedPrizes = prizes.map(p => ({ ...p, winners: [] }));
    setPrizes(clearedPrizes);
    setGameState(GameState.IDLE);
    setTargetNumber(0);
    setDisplayNumber(0);
    setShowHistory(false);
  };

  const targetString = targetNumber.toString().padStart(padLength, '0');
  const displayString = displayNumber.toString().padStart(padLength, '0');
  
  const digitArray = Array.from({ length: padLength }, (_, i) => {
     return gameState === GameState.IDLE 
        ? parseInt(displayString[i]) 
        : parseInt(targetString[i]);
  });

  const winnerName = numberConfig.names[targetNumber] || '';

  if (!currentPrize) return <div className="text-white text-center mt-20">Vui lòng thêm giải thưởng trong cài đặt.</div>;

  return (
    <div 
        className="relative min-h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-cover bg-center"
        style={{ 
            backgroundColor: numberConfig.backgroundImage ? 'transparent' : '#8B0000',
            backgroundImage: numberConfig.backgroundImage ? `url(${numberConfig.backgroundImage})` : 'none'
        }}
    >
      {!numberConfig.backgroundImage && (
        <>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_#b91c1c_0%,_#7f1d1d_60%,_#450a0a_100%)] z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border-[2px] border-yellow-600/30 rounded-full opacity-50 z-0 animate-spin-slow" style={{ animationDuration: '60s' }}>
                <div className="absolute inset-2 border-[1px] border-yellow-500/20 rounded-full border-dashed"></div>
                <div className="absolute inset-16 border-[4px] border-yellow-600/10 rounded-full"></div>
            </div>
        </>
      )}

      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50"></canvas>
      <div className={`absolute inset-0 bg-white z-[60] pointer-events-none transition-opacity duration-300 ease-out ${showFlash ? 'opacity-80' : 'opacity-0'}`}></div>

      <main className="relative z-10 w-full max-w-[95vw] xl:max-w-[1600px] mx-auto px-4 h-screen flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20">
        <div className="order-2 md:order-1 flex-shrink-0">
          <PrizeCard prize={currentPrize} onNextPrize={nextPrize} onPrevPrize={prevPrize} />
        </div>

        <div className="order-1 md:order-2 flex flex-col items-center">
          <div className="bg-white px-10 py-4 rounded-full shadow-lg border-4 border-yellow-400 mb-10 transform -skew-x-6">
             <h1 className="text-3xl md:text-6xl font-black text-red-700 uppercase tracking-widest font-festive text-center whitespace-nowrap">
               {currentPrize.name}
             </h1>
          </div>

          <div className={`bg-red-900/80 p-6 md:p-10 rounded-[3rem] border-8 border-yellow-500 shadow-2xl relative transition-transform duration-200 ${gameState === GameState.CELEBRATING ? 'scale-110' : 'scale-100'}`}>
            <div className="flex items-center justify-center bg-black/40 p-6 rounded-3xl border-2 border-yellow-600/30 gap-1 md:gap-3">
              {digitArray.map((digit, idx) => (
                  <DigitReel 
                    key={idx}
                    targetDigit={digit} 
                    isSpinning={gameState === GameState.SPINNING} 
                    delay={idx * 800} 
                    onStop={handleReelStop}
                  />
              ))}
            </div>
          </div>

          <div className="mt-10 text-center">
             <p className={`font-festive text-3xl italic opacity-80 ${numberConfig.backgroundImage ? 'text-white drop-shadow-lg font-bold' : 'text-yellow-200'}`}>
               "Chúc mừng năm mới - Vạn sự như ý"
             </p>
          </div>
        </div>
      </main>

      <div className="absolute bottom-6 right-6 z-20 flex flex-col gap-3 items-end">
         <div className="flex gap-3">
            {gameState === GameState.IDLE && canSpin && (
                <button onClick={handleStartSpin} className="bg-green-600 hover:bg-green-500 text-white font-bold py-4 px-10 rounded-2xl shadow-[0_6px_0_rgb(21,128,61)] active:shadow-none active:translate-y-[6px] transition-all flex items-center gap-3 text-2xl uppercase">
                  <Play fill="currentColor" size={28} /> Quay
                </button>
            )}

            {gameState === GameState.SPINNING && (
                numberConfig.isAutoStop ? (
                    <button disabled className="bg-orange-600 text-white font-bold py-4 px-10 rounded-2xl shadow-[0_6px_0_rgb(194,65,12)] transition-all flex items-center gap-3 text-2xl uppercase cursor-wait">
                      <Timer size={28} /> {countdown}s...
                    </button>
                ) : (
                    <button onClick={handleStopSpin} className="bg-red-600 hover:bg-red-500 text-white font-bold py-4 px-10 rounded-2xl shadow-[0_6px_0_rgb(185,28,28)] active:shadow-none active:translate-y-[6px] transition-all flex items-center gap-3 text-2xl uppercase">
                      <Square fill="currentColor" size={28} /> Dừng
                    </button>
                )
            )}

            {!canSpin && gameState === GameState.IDLE && (
                <button disabled className="bg-gray-500 text-gray-300 font-bold py-4 px-10 rounded-2xl cursor-not-allowed uppercase text-xl">
                    Đã trao hết
                </button>
            )}
         </div>

         <div className="flex gap-2 mt-2">
            <button onClick={() => setShowSettings(true)} className="bg-gray-700 hover:bg-gray-600 text-white p-3 rounded-lg shadow-lg transition-colors border border-gray-500" title="Cài đặt">
                <Settings size={20} />
            </button>
            <button onClick={() => setShowHistory(true)} className="bg-yellow-600 hover:bg-yellow-500 text-white p-3 rounded-lg shadow-lg transition-colors" title="Danh sách trúng thưởng">
                <List size={20} />
            </button>
            <button onClick={() => setIsMuted(!isMuted)} className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-lg backdrop-blur-sm transition-colors">
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button onClick={() => { if(confirm('Reset toàn bộ ứng dụng về mặc định?')) { localStorage.clear(); window.location.reload(); } }} className="bg-black/40 hover:bg-black/60 text-white p-3 rounded-lg backdrop-blur-sm transition-colors" title="Làm mới hoàn toàn">
                <RefreshCcw size={20} />
            </button>
         </div>
      </div>

      <WinnerModal isOpen={showWinnerModal} onClose={handleClaimPrize} prizeName={currentPrize.name} winningNumber={targetNumber} winnerName={winnerName} />
      <HistoryModal prizes={prizes} isOpen={showHistory} onClose={() => setShowHistory(false)} onClear={resetData} names={numberConfig.names} />
      <SettingsModal isOpen={showSettings} onClose={() => setShowSettings(false)} prizes={prizes} setPrizes={setPrizes} numberConfig={numberConfig} setNumberConfig={setNumberConfig} currentPrizeIndex={currentPrizeIndex} onSelectPrize={setCurrentPrizeIndex} />
    </div>
  );
};

export default App;