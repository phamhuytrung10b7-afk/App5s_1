import React from 'react';
import { Prize } from './types';
import { X, Trophy } from 'lucide-react';

interface HistoryModalProps {
  prizes: Prize[];
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
  names?: Record<number, string>; // Pass names map to look up winners
}

const HistoryModal: React.FC<HistoryModalProps> = ({ prizes, isOpen, onClose, onClear, names = {} }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-red-900 border-2 border-yellow-500 rounded-xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl relative overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 bg-red-950 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Trophy className="text-yellow-400" size={32} />
            <h2 className="text-2xl font-bold text-yellow-400 uppercase font-festive">Danh Sách Trúng Thưởng</h2>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {prizes.map((prize) => (
            prize.winners.length > 0 && (
              <div key={prize.id} className="bg-black/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                  <h3 className="text-lg font-bold text-white">{prize.name}</h3>
                  {/* Prize value removed here */}
                </div>
                <div className="flex flex-col gap-2">
                  {prize.winners.map((num, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 p-2 rounded">
                        <span className="bg-yellow-500 text-red-900 font-bold px-3 py-1 rounded-full shadow-lg border border-yellow-300 min-w-[3rem] text-center">
                          {num.toString().padStart(3, '0')}
                        </span>
                        {names[num] && (
                            <span className="text-white font-bold text-lg flex-1 text-right ml-4">{names[num]}</span>
                        )}
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}
          {prizes.every(p => p.winners.length === 0) && (
             <div className="text-center text-white/40 py-10 italic">Chưa có ai trúng thưởng. Hãy bắt đầu quay!</div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-red-950 flex justify-end gap-3">
            <button 
                onClick={() => { if(confirm('Bạn có chắc muốn xóa hết dữ liệu không?')) onClear() }}
                className="px-4 py-2 text-red-300 hover:bg-red-900/50 rounded transition-colors text-sm"
            >
                Reset Dữ liệu
            </button>
            <button 
                onClick={onClose}
                className="px-6 py-2 bg-yellow-500 hover:bg-yellow-400 text-red-900 font-bold rounded shadow-lg transition-transform active:scale-95"
            >
                Đóng
            </button>
        </div>
      </div>
    </div>
  );
};

export default HistoryModal;