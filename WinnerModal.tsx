import React from 'react';
import { X } from 'lucide-react';

interface WinnerModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizeName: string;
  winningNumber: number;
  winnerName?: string; // Add optional winner name
}

const WinnerModal: React.FC<WinnerModalProps> = ({ isOpen, onClose, prizeName, winningNumber, winnerName }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fadeIn">
      {/* Glow Effect behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] h-[80vh] bg-yellow-500/20 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="relative w-full max-w-7xl transform transition-all scale-100 animate-scaleIn">
        {/* Main Card Container */}
        <div className="bg-gradient-to-b from-[#4a0404] via-[#600000] to-[#2b0202] border-[6px] border-[#d4af37] rounded-[3rem] shadow-[0_0_150px_rgba(212,175,55,0.7)] overflow-hidden relative min-h-[70vh] flex flex-col justify-center">
            
            {/* Corner Decorations */}
            <div className="absolute top-0 left-0 w-40 h-40 border-t-[8px] border-l-[8px] border-[#ffd700] rounded-tl-[2.5rem] opacity-100 shadow-[0_0_20px_rgba(255,215,0,0.5)]"></div>
            <div className="absolute top-0 right-0 w-40 h-40 border-t-[8px] border-r-[8px] border-[#ffd700] rounded-tr-[2.5rem] opacity-100 shadow-[0_0_20px_rgba(255,215,0,0.5)]"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 border-b-[8px] border-l-[8px] border-[#ffd700] rounded-bl-[2.5rem] opacity-100 shadow-[0_0_20px_rgba(255,215,0,0.5)]"></div>
            <div className="absolute bottom-0 right-0 w-40 h-40 border-b-[8px] border-r-[8px] border-[#ffd700] rounded-br-[2.5rem] opacity-100 shadow-[0_0_20px_rgba(255,215,0,0.5)]"></div>

            {/* Sunburst/Rays Background Effect */}
            <div className="absolute inset-0 opacity-25 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-500 via-transparent to-transparent animate-pulse-slow"></div>

            {/* Close Button */}
            <button 
                onClick={onClose}
                className="absolute top-8 right-8 text-[#d4af37] hover:text-white transition-colors z-50 p-2 bg-black/20 rounded-full hover:bg-black/40"
            >
                <X size={48} />
            </button>

            {/* Content */}
            <div className="p-10 md:p-16 flex flex-col items-center justify-center text-center relative z-10">
                
                {/* Title: CHÚC MỪNG */}
                <h2 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#ffd700] via-[#fffacd] to-[#b8860b] font-festive mb-6 drop-shadow-[0_4px_10px_rgba(0,0,0,0.9)] tracking-widest leading-tight">
                    CHÚC MỪNG!
                </h2>

                <div className="w-96 h-2 bg-gradient-to-r from-transparent via-[#d4af37] to-transparent mb-12 opacity-80 shadow-[0_0_15px_#d4af37]"></div>

                {/* Subtitle */}
                <p className="text-yellow-100 text-2xl md:text-4xl uppercase tracking-[0.3em] mb-12 font-bold drop-shadow-lg">
                    Phần thưởng thuộc về anh/chị
                </p>

                {/* Prize Box */}
                <div className="w-full max-w-5xl bg-black/40 border-[3px] border-[#d4af37]/60 rounded-3xl p-12 mb-14 backdrop-blur-md relative group shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]">
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d4af37]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-3xl duration-1000 animate-pulse"></div>
                    <div className="text-4xl md:text-6xl font-black text-white drop-shadow-[0_0_30px_rgba(255,69,0,0.8)] leading-tight mb-4 uppercase">
                        {prizeName}
                    </div>
                     <div className="flex flex-col items-center mt-8 border-t border-white/20 pt-6">
                        <div className="text-[#ffd700] font-bold text-5xl md:text-7xl font-mono tracking-widest drop-shadow-[0_0_15px_rgba(255,215,0,0.8)]">
                            SỐ: {winningNumber.toString().padStart(3, '0')}
                        </div>
                        {winnerName && (
                            <div className="text-white font-festive text-5xl md:text-7xl mt-4 font-bold drop-shadow-lg animate-pulse">
                                {winnerName}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Button */}
                <button 
                    onClick={onClose}
                    className="group relative px-20 py-6 bg-gradient-to-b from-[#ffd700] to-[#d4af37] rounded-full shadow-[0_0_50px_rgba(212,175,55,0.6)] hover:shadow-[0_0_80px_rgba(212,175,55,1)] transition-all transform hover:scale-110 active:scale-95 border-4 border-[#fffacd]"
                >
                    <span className="text-[#5c0a0a] font-black text-3xl md:text-4xl uppercase tracking-[0.15em] relative z-10 group-hover:text-[#4a0404]">
                        Nhận Thưởng
                    </span>
                    <div className="absolute inset-0 rounded-full bg-white/50 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </button>

            </div>
        </div>
      </div>
      
      {/* Styles for simple animations */}
      <style>{`
        @keyframes scaleIn {
            0% { opacity: 0; transform: scale(0.5) translateY(50px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        .animate-scaleIn {
            animation: scaleIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        .animate-fadeIn {
            animation: fadeIn 0.4s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default WinnerModal;