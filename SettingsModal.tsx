import React, { useState, useEffect } from 'react';
import { Prize, NumberConfig } from './types';
import { X, Plus, Trash2, Save, Settings as SettingsIcon, Upload, PlayCircle, CheckCircle2, Clock, Image as ImageIcon } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prizes: Prize[];
  setPrizes: (prizes: Prize[]) => void;
  numberConfig: NumberConfig;
  setNumberConfig: (config: NumberConfig) => void;
  currentPrizeIndex: number;
  onSelectPrize: (index: number) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  prizes, 
  setPrizes, 
  numberConfig, 
  setNumberConfig,
  currentPrizeIndex,
  onSelectPrize
}) => {
  const [activeTab, setActiveTab] = useState<'PRIZES' | 'NUMBERS'>('PRIZES');
  
  // Local state for editing
  const [localPrizes, setLocalPrizes] = useState<Prize[]>(prizes);
  const [localConfig, setLocalConfig] = useState<NumberConfig>(numberConfig);
  
  // Convert list + names map back to string format for textarea
  const generateListString = (list: number[], names: Record<number, string>) => {
      return list.map(num => {
          if (names[num]) return `${num} - ${names[num]}`;
          return num.toString();
      }).join('\n');
  };

  const [listInput, setListInput] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLocalPrizes(JSON.parse(JSON.stringify(prizes)));
      setLocalConfig(JSON.parse(JSON.stringify(numberConfig)));
      setListInput(generateListString(numberConfig.customList, numberConfig.names));
    }
  }, [isOpen, prizes, numberConfig]);

  const saveConfig = () => {
    const configToSave = { ...localConfig };
    
    // Parse the textarea input
    // Format supported: "123" or "123 - Name" or "123 Name"
    const newCustomList: number[] = [];
    const newNames: Record<number, string> = {};

    const lines = listInput.split(/\n+/);
    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;
        
        // Regex to separate Number and Name (matches "123", "123-Name", "123 - Name", "123 Name")
        const match = trimmed.match(/^(\d+)(?:[\s\-\.:]+(.+))?$/);
        
        if (match) {
            const num = parseInt(match[1]);
            if (!isNaN(num)) {
                newCustomList.push(num);
                if (match[2]) {
                    newNames[num] = match[2].trim();
                }
            }
        }
    });

    configToSave.customList = [...new Set(newCustomList)].sort((a,b) => a-b);
    configToSave.names = newNames;
    
    setPrizes(localPrizes);
    setNumberConfig(configToSave);
  };

  const handleSave = () => {
    saveConfig();
    onClose();
  };

  const handleSelectAndSpin = (index: number) => {
    saveConfig();
    onSelectPrize(index);
    onClose();
  };

  const updatePrize = (index: number, field: keyof Prize, value: any) => {
    const newPrizes = [...localPrizes];
    newPrizes[index] = { ...newPrizes[index], [field]: value };
    setLocalPrizes(newPrizes);
  };

  const handleImageUpload = (file: File, index: number) => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        alert("File ảnh quá lớn! Vui lòng chọn ảnh dưới 2MB.");
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) updatePrize(index, 'image', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleBackgroundUpload = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
        alert("File ảnh quá lớn! Vui lòng chọn ảnh dưới 5MB.");
        return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (reader.result) setLocalConfig({...localConfig, backgroundImage: reader.result as string});
    };
    reader.readAsDataURL(file);
  };

  const addPrize = () => {
    const newPrize: Prize = {
      id: Date.now().toString(),
      name: 'Giải Mới',
      image: 'https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600&auto=format&fit=crop',
      value: '',
      quantity: 1,
      winners: []
    };
    setLocalPrizes([...localPrizes, newPrize]);
  };

  const removePrize = (index: number) => {
    if (confirm('Xóa giải này?')) {
      const newPrizes = localPrizes.filter((_, i) => i !== index);
      setLocalPrizes(newPrizes);
    }
  };

  // Determine current active prize ID based on parent prop to show "Selected" state correctly
  // even if user is editing names
  const activePrizeId = prizes[currentPrizeIndex]?.id;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-red-900 p-4 flex justify-between items-center border-b border-yellow-500">
          <div className="flex items-center gap-2 text-yellow-400">
            <SettingsIcon />
            <h2 className="text-xl font-bold uppercase">Cấu hình</h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200">
          <button 
            className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors ${activeTab === 'PRIZES' ? 'bg-red-50 text-red-900 border-b-2 border-red-900' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('PRIZES')}
          >
            Danh sách Giải thưởng
          </button>
          <button 
            className={`flex-1 py-3 font-bold text-sm uppercase tracking-wide transition-colors ${activeTab === 'NUMBERS' ? 'bg-red-50 text-red-900 border-b-2 border-red-900' : 'text-gray-500 hover:bg-gray-50'}`}
            onClick={() => setActiveTab('NUMBERS')}
          >
            Cấu hình Quay Số
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
          
          {activeTab === 'PRIZES' && (
            <div className="space-y-4">
              {localPrizes.map((prize, idx) => {
                const isSelected = prize.id === activePrizeId;
                return (
                  <div key={prize.id} className={`bg-white p-4 rounded-lg shadow-sm border ${isSelected ? 'border-green-500 ring-1 ring-green-500' : 'border-gray-200'} flex flex-col md:flex-row gap-4 items-start md:items-center`}>
                    
                    {/* Image */}
                    <div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative group border border-gray-200">
                       <img src={prize.image} alt="" className="w-full h-full object-cover" />
                    </div>
                    
                    {/* Inputs */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                      <div className="col-span-1">
                        <label className="text-xs text-gray-500 block mb-1">Tên giải</label>
                        <input 
                          type="text" 
                          value={prize.name} 
                          onChange={(e) => updatePrize(idx, 'name', e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:border-red-500 outline-none"
                        />
                      </div>
                      {/* Removed Value Input */}
                      <div className="col-span-1">
                         <label className="text-xs text-gray-500 block mb-1">Số lượng</label>
                         <input 
                          type="number" 
                          min="1"
                          value={prize.quantity} 
                          onChange={(e) => updatePrize(idx, 'quantity', parseInt(e.target.value))}
                          className="w-full p-2 border border-gray-300 rounded text-sm focus:border-red-500 outline-none"
                        />
                      </div>
                      <div className="col-span-1">
                         <label className="text-xs text-gray-500 block mb-1">Ảnh</label>
                         <div className="flex gap-2">
                             <input 
                              type="text" 
                              value={prize.image} 
                              onChange={(e) => updatePrize(idx, 'image', e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded text-sm focus:border-red-500 outline-none truncate"
                              placeholder="URL..."
                            />
                            <label className="flex-shrink-0 cursor-pointer bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded flex items-center justify-center transition-colors">
                              <Upload size={18} />
                              <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], idx)} />
                            </label>
                         </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row md:flex-col gap-2 items-center border-t md:border-t-0 md:border-l border-gray-100 pt-3 md:pt-0 md:pl-4">
                        <button 
                          onClick={() => handleSelectAndSpin(idx)}
                          disabled={isSelected}
                          className={`flex items-center gap-1 px-3 py-2 rounded text-sm font-bold transition-all w-full md:w-auto justify-center ${
                              isSelected 
                              ? 'bg-green-100 text-green-700 cursor-default' 
                              : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md'
                          }`}
                        >
                          {isSelected ? (
                              <><CheckCircle2 size={16} /> Đang chọn</>
                          ) : (
                              <><PlayCircle size={16} /> Chọn quay</>
                          )}
                        </button>
                        
                        {!isSelected && (
                            <button 
                                onClick={() => removePrize(idx)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                title="Xóa giải"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                    </div>
                  </div>
                );
              })}
              
              <button 
                onClick={addPrize}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-red-500 hover:text-red-500 transition-colors flex items-center justify-center gap-2 font-bold"
              >
                <Plus size={20} /> Thêm Giải Mới
              </button>
            </div>
          )}

          {activeTab === 'NUMBERS' && (
            <div className="space-y-6">
               
               {/* Background Image Upload */}
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                             <ImageIcon className="text-red-600" />
                             <span className="font-bold text-gray-800 text-lg">Ảnh Nền (Background)</span>
                        </div>
                    </div>
                    <div className="flex items-start gap-4">
                        {localConfig.backgroundImage ? (
                             <div className="relative w-32 h-20 rounded-md overflow-hidden border border-gray-300 group">
                                <img src={localConfig.backgroundImage} alt="Background" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => setLocalConfig({...localConfig, backgroundImage: null})}
                                    className="absolute inset-0 bg-black/50 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity font-bold text-xs"
                                >
                                    Xóa
                                </button>
                             </div>
                        ) : (
                            <div className="w-32 h-20 bg-gray-100 rounded-md border border-dashed border-gray-300 flex items-center justify-center text-gray-400 text-xs text-center p-2">
                                Chưa có ảnh
                            </div>
                        )}
                        <div className="flex-1">
                             <p className="text-sm text-gray-600 mb-2">Tải lên ảnh nền để thay thế nền đỏ mặc định.</p>
                             <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors text-sm font-bold border border-blue-200">
                                <Upload size={16} /> Chọn ảnh từ máy
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleBackgroundUpload(e.target.files[0])} />
                             </label>
                        </div>
                    </div>
               </div>

               {/* Auto Stop Settings */}
               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                             <Clock className="text-red-600" />
                             <span className="font-bold text-gray-800 text-lg">Cài đặt Thời gian</span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input 
                                type="checkbox" 
                                className="sr-only peer" 
                                checked={localConfig.isAutoStop || false}
                                onChange={(e) => setLocalConfig({...localConfig, isAutoStop: e.target.checked})}
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-red-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
                            <span className="ml-3 text-sm font-medium text-gray-900">Tự động dừng</span>
                        </label>
                    </div>
                    
                    {localConfig.isAutoStop && (
                        <div className="mt-4 p-4 bg-gray-50 rounded border border-gray-200">
                             <label className="block text-sm text-gray-700 mb-2 font-bold">
                                Thời gian quay (giây)
                             </label>
                             <div className="flex items-center gap-3">
                                <input 
                                    type="number" 
                                    min="1" 
                                    max="60"
                                    value={localConfig.spinDuration || 5}
                                    onChange={(e) => setLocalConfig({...localConfig, spinDuration: Math.max(1, parseInt(e.target.value))})}
                                    className="w-24 p-2 border border-gray-300 rounded focus:border-red-500 outline-none font-bold text-center"
                                />
                                <span className="text-gray-500 text-sm">giây sẽ tự động dừng và hiện kết quả</span>
                             </div>
                        </div>
                    )}
               </div>

               <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <label className="flex items-center gap-3 mb-4 cursor-pointer">
                  <input 
                    type="radio" 
                    name="mode" 
                    checked={localConfig.mode === 'RANGE'} 
                    onChange={() => setLocalConfig({...localConfig, mode: 'RANGE'})}
                    className="w-5 h-5 text-red-600 focus:ring-red-500"
                  />
                  <span className="font-bold text-gray-800">Quay theo dải số (Range)</span>
                </label>
                
                <div className={`grid grid-cols-2 gap-4 pl-8 ${localConfig.mode !== 'RANGE' ? 'opacity-50 pointer-events-none' : ''}`}>
                   <div>
                     <label className="block text-sm text-gray-600 mb-1">Từ số</label>
                     <input 
                        type="number" 
                        value={localConfig.min}
                        onChange={(e) => setLocalConfig({...localConfig, min: parseInt(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded focus:border-red-500 outline-none"
                      />
                   </div>
                   <div>
                     <label className="block text-sm text-gray-600 mb-1">Đến số</label>
                     <input 
                        type="number" 
                        value={localConfig.max}
                        onChange={(e) => setLocalConfig({...localConfig, max: parseInt(e.target.value)})}
                        className="w-full p-2 border border-gray-300 rounded focus:border-red-500 outline-none"
                      />
                   </div>
                   <div className="col-span-2">
                       <p className="text-xs text-orange-600 italic">
                           Lưu ý: Chế độ Dải số không hỗ trợ hiển thị Tên người thắng. Hãy dùng chế độ Danh Sách bên dưới nếu muốn hiện tên.
                       </p>
                   </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <label className="flex items-center gap-3 mb-4 cursor-pointer">
                  <input 
                    type="radio" 
                    name="mode" 
                    checked={localConfig.mode === 'LIST'} 
                    onChange={() => setLocalConfig({...localConfig, mode: 'LIST'})}
                    className="w-5 h-5 text-red-600 focus:ring-red-500"
                  />
                  <span className="font-bold text-gray-800">Quay theo danh sách (Custom List)</span>
                </label>

                <div className={`pl-8 ${localConfig.mode !== 'LIST' ? 'opacity-50 pointer-events-none' : ''}`}>
                  <label className="block text-sm text-gray-600 mb-2">Nhập danh sách (Mỗi dòng một số hoặc "Số - Tên")</label>
                  <div className="bg-gray-50 border border-gray-200 rounded-md p-2 mb-2 text-xs text-gray-500 font-mono">
                      Ví dụ:<br/>
                      001 - Nguyễn Văn A<br/>
                      002 - Trần Thị B<br/>
                      105<br/>
                      999 - Lê Văn C
                  </div>
                  <textarea 
                    value={listInput}
                    onChange={(e) => setListInput(e.target.value)}
                    rows={8}
                    placeholder="Nhập danh sách tại đây..."
                    className="w-full p-3 border border-gray-300 rounded focus:border-red-500 outline-none font-mono text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Số lượng đã nhập: <span className="font-bold text-red-600">{
                       listInput ? listInput.split(/\n+/).filter(s => s.trim() !== '').length : 0
                    }</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-gray-200 flex justify-end gap-3">
          <button 
             onClick={onClose}
             className="px-6 py-2 text-gray-600 hover:bg-gray-100 rounded font-medium"
          >
            Hủy
          </button>
          <button 
             onClick={handleSave}
             className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-bold shadow-lg flex items-center gap-2"
          >
            <Save size={18} /> Lưu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;