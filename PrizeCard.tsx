import React from 'react';
import { Prize } from './types';
import { Gift } from 'lucide-react';

interface PrizeCardProps {
  prize: Prize;
  onNextPrize: () => void;
  onPrevPrize: () => void;
}

const PrizeCard: React.FC<PrizeCardProps> = ({ prize, onNextPrize, onPrevPrize }) => {
  return (
    <div className="bg-gradient-to-br from-orange-500 to-red-600 p-2 rounded-3xl shadow-2xl transform hover:scale-105 transition-transform duration-300 w-80 md:w-[500px]">
      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
        <div className="relative aspect-square rounded-xl overflow-hidden mb-6 bg-black/20 shadow-inner group">
          <img 
            src={prize.image} 
            alt={prize.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          />
          {/* Prize value overlay removed here */}
        </div>
        
        <div className="text-center">
            <div className="flex items-center justify-between mb-4">
                 <button onClick={onPrevPrize} className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                 </button>
                 <h2 className="text-2xl md:text-4xl font-bold text-white font-festive uppercase drop-shadow-md leading-tight px-2">{prize.name}</h2>
                 <button onClick={onNextPrize} className="text-white/50 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                 </button>
            </div>
          
          <div className="flex items-center justify-center gap-3 mt-4 bg-black/30 py-2 px-6 rounded-full mx-auto w-fit">
            <Gift size={24} className="text-yellow-400" />
            <span className="text-white text-lg">Số lượng: <span className="font-bold text-yellow-300 text-xl">{prize.quantity - prize.winners.length}/{prize.quantity}</span></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrizeCard;