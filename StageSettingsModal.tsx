import React, { useState, useEffect, useRef } from 'react';
import { Save, X, Activity, ListPlus, CheckSquare, Upload, FileCheck } from 'lucide-react';
import { Button } from './Button';
import { Stage } from './types';
import { read, utils } from 'xlsx';

interface StageSettingsModalProps {
  isOpen: boolean;
  stages: Stage[];
  onSave: (newStages: Stage[]) => void;
  onClose: () => void;
}

export const StageSettingsModal: React.FC<StageSettingsModalProps> = ({ isOpen, stages, onSave, onClose }) => {
  const [localStages, setLocalStages] = useState<Stage[]>(stages);

  // Helper to ensure array is size 8
  const ensureSize8 = (arr?: any[]) => {
    const newArr = arr ? [...arr] : [];
    while (newArr.length < 8) newArr.push("");
    return newArr.slice(0, 8);
  };

  const ensureSize8Arrays = (arr?: any[][]) => {
    const newArr = arr ? [...arr] : [];
    while (newArr.length < 8) newArr.push([]);
    return newArr.slice(0, 8);
  };

  useEffect(() => {
    // Ensure compatibility with data structure
    const sanitizedStages = stages.map(s => ({
      ...s,
      additionalFieldLabels: ensureSize8(s.additionalFieldLabels),
      additionalFieldDefaults: ensureSize8(s.additionalFieldDefaults),
      additionalFieldMinValues: ensureSize8(s.additionalFieldMinValues),
      additionalFieldMaxValues: ensureSize8(s.additionalFieldMaxValues),
      additionalFieldWhitelists: ensureSize8Arrays(s.additionalFieldWhitelists),
      additionalFieldWhitelistFileNames: ensureSize8(s.additionalFieldWhitelistFileNames),
    }));
    setLocalStages(sanitizedStages);
  }, [stages, isOpen]);

  const handleNameChange = (id: number, newName: string) => {
    setLocalStages(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s));
  };

  const handleToggleMeasurement = (id: number) => {
    setLocalStages(prev => prev.map(s => s.id === id ? { ...s, enableMeasurement: !s.enableMeasurement } : s));
  };

  const handleLabelChange = (id: number, newLabel: string) => {
    setLocalStages(prev => prev.map(s => s.id === id ? { ...s, measurementLabel: newLabel } : s));
  };

  const handleStandardChange = (id: number, newVal: string) => {
    setLocalStages(prev => prev.map(s => s.id === id ? { ...s, measurementStandard: newVal } : s));
  };

  const handleAdditionalFieldConfig = (stageId: number, fieldIndex: number, type: 'label' | 'default' | 'min' | 'max', value: string) => {
    setLocalStages(prev => prev.map(s => {
      if (s.id !== stageId) return s;
      
      const newLabels = ensureSize8(s.additionalFieldLabels);
      const newDefaults = ensureSize8(s.additionalFieldDefaults);
      const newMinValues = ensureSize8(s.additionalFieldMinValues);
      const newMaxValues = ensureSize8(s.additionalFieldMaxValues);
      const newWhitelists = ensureSize8Arrays(s.additionalFieldWhitelists);
      const newWhitelistFileNames = ensureSize8(s.additionalFieldWhitelistFileNames);

      if (type === 'label') newLabels[fieldIndex] = value;
      if (type === 'default') newDefaults[fieldIndex] = value;
      if (type === 'min') newMinValues[fieldIndex] = value;
      if (type === 'max') newMaxValues[fieldIndex] = value;

      return { 
        ...s, 
        additionalFieldLabels: newLabels, 
        additionalFieldDefaults: newDefaults,
        additionalFieldMinValues: newMinValues,
        additionalFieldMaxValues: newMaxValues,
        additionalFieldWhitelists: newWhitelists,
        additionalFieldWhitelistFileNames: newWhitelistFileNames
      };
    }));
  };

  const handleAdditionalWhitelistUpload = async (stageId: number, fieldIndex: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        const whitelist = json
          .map(row => String(row[0]).trim())
          .filter(val => val && val !== "undefined" && val !== "null");

        setLocalStages(prev => prev.map(s => {
          if (s.id !== stageId) return s;
          const newWhitelists = ensureSize8Arrays(s.additionalFieldWhitelists);
          const newWhitelistFileNames = ensureSize8(s.additionalFieldWhitelistFileNames);
          newWhitelists[fieldIndex] = whitelist;
          newWhitelistFileNames[fieldIndex] = file.name;
          return { ...s, additionalFieldWhitelists: newWhitelists, additionalFieldWhitelistFileNames: newWhitelistFileNames };
        }));
      } catch (err) {
        console.error("Error parsing Excel:", err);
        alert("Lỗi khi đọc file Excel.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const removeAdditionalWhitelist = (stageId: number, fieldIndex: number) => {
    setLocalStages(prev => prev.map(s => {
      if (s.id !== stageId) return s;
      const newWhitelists = ensureSize8Arrays(s.additionalFieldWhitelists);
      const newWhitelistFileNames = ensureSize8(s.additionalFieldWhitelistFileNames);
      newWhitelists[fieldIndex] = [];
      newWhitelistFileNames[fieldIndex] = "";
      return { ...s, additionalFieldWhitelists: newWhitelists, additionalFieldWhitelistFileNames: newWhitelistFileNames };
    }));
  };

  const handleWhitelistUpload = async (stageId: number, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        // Extract first column as whitelist, skip header if needed
        // Assuming first row might be header, but let's take all non-empty values
        const whitelist = json
          .map(row => String(row[0]).trim())
          .filter(val => val && val !== "undefined" && val !== "null");

        setLocalStages(prev => prev.map(s => 
          s.id === stageId ? { ...s, whitelist, whitelistFileName: file.name } : s
        ));
      } catch (err) {
        console.error("Error parsing Excel:", err);
        alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra lại định dạng.");
      }
    };
    reader.readAsBinaryString(file);
  };

  const removeWhitelist = (stageId: number) => {
    setLocalStages(prev => prev.map(s => 
      s.id === stageId ? { ...s, whitelist: undefined, whitelistFileName: undefined } : s
    ));
  };

  const handleSave = () => {
    onSave(localStages);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full mx-4 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold flex items-center gap-2">
            ⚙️ Cấu hình Công Đoạn
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
          {localStages.map((stage) => (
            <div key={stage.id} className="p-5 bg-gray-50 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex flex-col md:flex-row gap-4 mb-4">
                {/* ID Badge */}
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold flex-shrink-0">
                  {stage.id}
                </div>

                {/* Stage Name Input */}
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
                    Tên công đoạn
                  </label>
                  <input 
                    type="text"
                    value={stage.name}
                    onChange={(e) => handleNameChange(stage.id, e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder={`Tên công đoạn ${stage.id}...`}
                  />
                </div>

                {/* Measurement Toggle */}
                <div className="flex items-center gap-2 mt-5 md:mt-0">
                    <input 
                      type="checkbox" 
                      id={`measure-${stage.id}`}
                      checked={!!stage.enableMeasurement}
                      onChange={() => handleToggleMeasurement(stage.id)}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor={`measure-${stage.id}`} className="text-sm font-bold text-gray-700 select-none cursor-pointer flex items-center gap-1">
                       <Activity size={16} /> Kích hoạt Test?
                    </label>
                 </div>
              </div>

              {/* Measurement Configuration Section */}
              {stage.enableMeasurement && (
                <div className="mt-4 pl-0 md:pl-14 md:border-l-2 border-blue-200 md:ml-5 animate-in slide-in-from-top-2">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Main Measurement Label */}
                      <div className="bg-white p-3 rounded border border-blue-200 flex flex-col gap-3">
                        <div>
                          <label className="block text-xs font-bold text-blue-700 uppercase mb-1">
                            1. Tên Kết quả chính (Bắt buộc)
                          </label>
                          <input 
                            type="text"
                            value={stage.measurementLabel || ''}
                            onChange={(e) => handleLabelChange(stage.id, e.target.value)}
                            className="w-full p-2 text-sm border border-blue-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="VD: Kết quả Test..."
                          />
                        </div>

                        {/* Measurement Standard Value */}
                        <div className="relative">
                          <label className="block text-xs font-bold text-green-700 uppercase mb-1 flex items-center gap-1">
                            <CheckSquare size={14}/> Giá trị Tiêu Chuẩn
                          </label>
                          <input 
                            type="text"
                            value={stage.measurementStandard || ''}
                            onChange={(e) => handleStandardChange(stage.id, e.target.value)}
                            className="w-full p-2 text-sm border-2 border-green-200 bg-green-50 rounded focus:ring-2 focus:ring-green-500 outline-none placeholder-green-300"
                            placeholder="VD: PASS (chữ) hoặc 10.5 (số)..."
                          />
                          <p className="text-[10px] text-gray-500 mt-1 font-medium">
                            * Nếu là <b>Chữ</b>: Phải khớp chính xác (VD: PASS).<br/>
                            * Nếu là <b>Số</b>: Kết quả đo phải <b>NHỎ HƠN</b> giá trị này (Max Limit).
                          </p>
                        </div>
                      </div>

                      {/* 8 Additional Fields */}
                      <div className="md:col-span-2 lg:col-span-1">
                         <label className="block text-xs font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                           <ListPlus size={16}/> 2. Cấu hình 8 thông số mở rộng
                         </label>
                         
                         <div className="grid grid-cols-2 gap-3">
                            {/* Loop 8 times */}
                            {Array.from({ length: 8 }).map((_, idx) => (
                              <div key={idx} className="bg-white p-2 rounded border border-gray-300 flex flex-col gap-2 relative">
                                <span className="absolute -top-2 -left-2 bg-gray-200 text-gray-600 text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">
                                  {idx + 1}
                                </span>
                                <div>
                                  <label className="text-[10px] font-semibold text-gray-500 uppercase">Tên thông số</label>
                                  <input
                                    type="text"
                                    value={stage.additionalFieldLabels?.[idx] || ""}
                                    onChange={(e) => handleAdditionalFieldConfig(stage.id, idx, 'label', e.target.value)}
                                    className="w-full p-1.5 text-xs border border-gray-200 rounded focus:border-blue-500 focus:outline-none"
                                    placeholder="Tắt..."
                                  />
                                </div>
                                <div className="grid grid-cols-3 gap-1">
                                  <div>
                                    <label className="text-[9px] font-semibold text-green-600 uppercase">Mặc định</label>
                                    <input
                                      type="text"
                                      value={stage.additionalFieldDefaults?.[idx] || ""}
                                      onChange={(e) => handleAdditionalFieldConfig(stage.id, idx, 'default', e.target.value)}
                                      className="w-full p-1 text-[10px] border border-green-200 bg-green-50 rounded focus:border-green-500 focus:outline-none placeholder-green-200"
                                      placeholder="Auto..."
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-semibold text-blue-600 uppercase">Min</label>
                                    <input
                                      type="text"
                                      value={stage.additionalFieldMinValues?.[idx] || ""}
                                      onChange={(e) => handleAdditionalFieldConfig(stage.id, idx, 'min', e.target.value)}
                                      className="w-full p-1 text-[10px] border border-blue-200 bg-blue-50 rounded focus:border-blue-500 focus:outline-none"
                                      placeholder="Min..."
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[9px] font-semibold text-red-600 uppercase">Max</label>
                                    <input
                                      type="text"
                                      value={stage.additionalFieldMaxValues?.[idx] || ""}
                                      onChange={(e) => handleAdditionalFieldConfig(stage.id, idx, 'max', e.target.value)}
                                      className="w-full p-1 text-[10px] border border-red-200 bg-red-50 rounded focus:border-red-500 focus:outline-none"
                                      placeholder="Max..."
                                    />
                                  </div>
                                </div>
                                <div className="mt-1 flex items-center justify-between gap-1">
                                  <div className="relative flex-1">
                                    <input 
                                      type="file" 
                                      accept=".xlsx, .xls"
                                      onChange={(e) => e.target.files?.[0] && handleAdditionalWhitelistUpload(stage.id, idx, e.target.files[0])}
                                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <button className="w-full py-0.5 text-[9px] bg-slate-100 text-slate-600 rounded border border-slate-200 hover:bg-slate-200 flex items-center justify-center gap-1">
                                      <Upload size={10} /> Whitelist
                                    </button>
                                  </div>
                                  {stage.additionalFieldWhitelistFileNames?.[idx] && (
                                    <div className="flex items-center gap-1 bg-green-50 text-green-600 px-1 rounded border border-green-100 text-[8px] max-w-[60px] truncate">
                                      <span className="truncate">{stage.additionalFieldWhitelistFileNames[idx]}</span>
                                      <button onClick={() => removeAdditionalWhitelist(stage.id, idx)} className="text-red-400 hover:text-red-600">
                                        <X size={8} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                         </div>
                      </div>

                      {/* Whitelist Upload Section */}
                      <div className="md:col-span-2 bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center gap-2">
                          <FileCheck size={16}/> 3. Danh sách Whitelist (Excel)
                        </label>
                        <div className="flex items-center gap-4">
                          <div className="relative">
                            <input 
                              type="file" 
                              accept=".xlsx, .xls"
                              onChange={(e) => e.target.files?.[0] && handleWhitelistUpload(stage.id, e.target.files[0])}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                            <Button variant="secondary" className="flex items-center gap-2 pointer-events-none">
                              <Upload size={16} /> Tải lên Whitelist
                            </Button>
                          </div>
                          
                          {stage.whitelistFileName ? (
                            <div className="flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1.5 rounded-full text-xs font-bold border border-green-200">
                              <FileCheck size={14} /> {stage.whitelistFileName} ({stage.whitelist?.length} mã)
                              <button 
                                onClick={() => removeWhitelist(stage.id)}
                                className="hover:text-red-500 transition-colors"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic">Chưa có file whitelist nào được tải lên.</span>
                          )}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2">
                          * File Excel phải có danh sách mã ở <b>Cột A</b>. Chỉ những mã trong danh sách này mới được phép Scan.
                        </p>
                      </div>
                   </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Hủy bỏ
          </Button>
          <Button variant="primary" onClick={handleSave} className="flex items-center gap-2">
            <Save size={18} /> Lưu Thay Đổi
          </Button>
        </div>
      </div>
    </div>
  );
};