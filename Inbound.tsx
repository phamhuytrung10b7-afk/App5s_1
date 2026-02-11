import React, { useState, useRef, useEffect } from 'react';
import { inventoryService } from './inventoryService';
import { Scan, Plus, Trash2, CheckCircle, Settings, Warehouse, AlertTriangle, XCircle, FileText, ClipboardCheck, ArrowRight, History, ChevronDown, ChevronUp, Calendar, Search, ListFilter } from 'lucide-react';
import { playSound } from './sound';
import { ProductionPlan, UnitStatus, Transaction } from './types';

export const Inbound: React.FC = () => {
  const warehouses = inventoryService.getWarehouses();
  const plans = inventoryService.getProductionPlans();

  // --- TAB STATE ---
  const [activeTab, setActiveTab] = useState<'SCAN' | 'HISTORY'>('SCAN');
  
  // --- HISTORY STATE ---
  const [historyFrom, setHistoryFrom] = useState(new Date().toISOString().split('T')[0]);
  const [historyTo, setHistoryTo] = useState(new Date().toISOString().split('T')[0]);
  const [historyData, setHistoryData] = useState<Transaction[]>([]);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);

  // --- SCAN STATE ---
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [location, setLocation] = useState(warehouses.length > 0 ? warehouses[0].name : '');
  const [showHistory, setShowHistory] = useState(false);
  
  // Computed State based on selection
  const selectedPlan = plans.find(p => p.id === selectedPlanId);
  const selectedProduct = selectedPlan ? inventoryService.getProductById(selectedPlan.productId) : null;
  
  const [currentSerial, setCurrentSerial] = useState('');
  const [serialList, setSerialList] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);

  // Load History Effect
  useEffect(() => {
    if (activeTab === 'HISTORY') {
      const data = inventoryService.getHistoryByDateRange(['INBOUND'], historyFrom, historyTo);
      setHistoryData(data);
    }
  }, [activeTab, historyFrom, historyTo]);

  // Auto-focus input
  useEffect(() => {
    if (activeTab === 'SCAN') {
       inputRef.current?.focus();
    }
  }, [serialList, message, selectedPlanId, activeTab]);

  // Calculate Progress for UI using checkSerialImported
  const getPlanProgress = (plan: ProductionPlan) => {
      const total = plan.serials.length;
      const imported = plan.serials.filter(s => inventoryService.checkSerialImported(s)).length;
      const sessionCount = serialList.filter(s => plan.serials.includes(s)).length;
      return { total, imported, sessionCount, current: imported + sessionCount };
  };
  
  const progress = selectedPlan ? getPlanProgress(selectedPlan) : { total: 0, imported: 0, sessionCount: 0, current: 0 };
  
  const alreadyImportedSerials = selectedPlan 
    ? selectedPlan.serials.filter(s => inventoryService.checkSerialImported(s))
    : [];

  const handleAddSerial = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedPlan) {
       playSound('error');
       setMessage({ type: 'error', text: 'Vui lòng chọn Kế hoạch sản xuất trước!' });
       return;
    }

    const scannedCode = currentSerial.trim();
    if (!scannedCode) return;

    if (serialList.includes(scannedCode)) {
      playSound('warning');
      setMessage({ type: 'warning', text: `Mã ${scannedCode} đã vừa quét xong!` });
      setCurrentSerial('');
      return;
    }

    if (!selectedPlan.serials.includes(scannedCode)) {
      playSound('error');
      setMessage({ type: 'error', text: `LỖI: Mã ${scannedCode} KHÔNG thuộc kế hoạch "${selectedPlan.name}"!` });
      setCurrentSerial('');
      return;
    }

    const exists = inventoryService.checkSerialImported(scannedCode);
    if (exists) {
      const unit = inventoryService.getUnitBySerial(scannedCode);
      if (unit && unit.status === UnitStatus.SOLD) {
         playSound('success');
         setSerialList([...serialList, scannedCode]);
         setCurrentSerial('');
         setMessage({ type: 'warning', text: `Chú ý: Mã ${scannedCode} đã bán, đang thực hiện tái nhập kho.` });
         return;
      }
      if (unit && unit.status === UnitStatus.NEW) {
         const statusText = `(Trạng thái: ${unit.status})`;
         playSound('error');
         setMessage({ type: 'error', text: `Lỗi: Mã ${scannedCode} đang tồn kho! ${statusText}` });
         setCurrentSerial('');
         return;
      }
    }

    playSound('success');
    setSerialList([...serialList, scannedCode]);
    setCurrentSerial('');
    setMessage({ type: 'success', text: `Hợp lệ: ${scannedCode}` });
  };

  const handleSubmit = () => {
    try {
      if (!selectedProduct) throw new Error("Vui lòng chọn Kế hoạch hợp lệ");
      if (!location) throw new Error("Vui lòng chọn Kho nhập");
      if (serialList.length === 0) throw new Error("Danh sách trống");
      
      inventoryService.importUnits(selectedProduct.id, serialList, location);
      
      playSound('success');
      setMessage({ type: 'success', text: `Đã nhập kho thành công ${serialList.length} máy vào ${location}.` });
      setSerialList([]);
      setCurrentSerial('');
    } catch (err: any) {
      playSound('error');
      setMessage({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      
      {/* HEADER WITH TABS */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
         <div className="flex items-center gap-3">
             <div className="bg-green-100 p-3 rounded-full text-green-600">
                <Scan />
             </div>
             <div>
                <h2 className="text-xl font-bold text-slate-800">Quản lý Nhập Kho</h2>
                <p className="text-slate-500 text-sm">Xử lý nhập kho từ sản xuất và tra cứu lịch sử.</p>
             </div>
         </div>
         <div className="flex bg-slate-100 p-1 rounded-lg">
             <button 
                onClick={() => setActiveTab('SCAN')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'SCAN' ? 'bg-white shadow text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <Plus size={16}/> Nhập Mới
             </button>
             <button 
                onClick={() => setActiveTab('HISTORY')}
                className={`px-4 py-2 rounded-md text-sm font-bold transition-all flex items-center gap-2 ${activeTab === 'HISTORY' ? 'bg-white shadow text-green-700' : 'text-slate-500 hover:text-slate-700'}`}
             >
                <History size={16}/> Lịch sử Nhập
             </button>
         </div>
      </div>

      {/* --- TAB CONTENT: SCAN --- */}
      {activeTab === 'SCAN' && (
         <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
            {/* ... Existing Scan UI ... */}
            {plans.length === 0 ? (
               <div className="text-center p-8">
                  <ClipboardCheck className="h-10 w-10 text-slate-400 mx-auto mb-4" />
                  <h3 className="font-bold text-slate-700">Chưa có Kế hoạch Sản xuất</h3>
                  <a href="#/production-check" className="text-water-600 hover:underline mt-2 inline-block">Tạo Kế hoạch ngay</a>
               </div>
            ) : (
               <>
                  {message && (
                     <div className={`p-4 mb-6 rounded-lg flex items-center gap-2 animate-pulse-short ${
                        message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 
                        message.type === 'warning' ? 'bg-yellow-50 text-yellow-700 border border-yellow-100' :
                        'bg-red-50 text-red-700 border border-red-100'
                     }`}>
                        {message.type === 'success' && <CheckCircle size={20} />}
                        {message.type === 'warning' && <AlertTriangle size={20} />}
                        {message.type === 'error' && <XCircle size={20} />}
                        <span className="font-medium">{message.text}</span>
                     </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 bg-slate-50 p-6 rounded-xl border border-slate-200">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                           <ClipboardCheck size={16}/> Chọn Kế hoạch / Lô SX
                        </label>
                        <select 
                           className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-water-400 outline-none bg-white shadow-sm"
                           value={selectedPlanId}
                           onChange={(e) => {
                              setSelectedPlanId(e.target.value);
                              setSerialList([]);
                              setMessage(null);
                              setShowHistory(false);
                           }}
                        >
                           <option value="">-- Chọn Kế hoạch --</option>
                           {plans.map(p => {
                              const prog = getPlanProgress(p);
                              const isFull = prog.imported >= prog.total;
                              return (
                                 <option key={p.id} value={p.id} className={isFull ? 'text-green-600' : ''}>
                                    {p.name} {isFull ? '(Đã đủ)' : `(${prog.imported}/${prog.total})`}
                                 </option>
                              );
                           })}
                        </select>
                        
                        {selectedPlan && selectedProduct && (
                           <div className="mt-4 p-4 bg-white rounded border border-slate-200 text-sm">
                              <div className="flex justify-between mb-2">
                                 <span className="text-slate-500">Model:</span>
                                 <span className="font-bold text-slate-800">{selectedProduct.model}</span>
                              </div>
                              <div className="flex justify-between mb-2">
                                 <span className="text-slate-500">Tiến độ nhập:</span>
                                 <span className="font-bold text-slate-800">{progress.imported} / {progress.total}</span>
                              </div>
                              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3 relative">
                                 <div 
                                    className="bg-green-500 h-2 absolute top-0 left-0 transition-all duration-500" 
                                    style={{width: `${(progress.imported / progress.total) * 100}%`}}
                                 ></div>
                                 <div 
                                    className="bg-green-300 h-2 absolute top-0 transition-all duration-500" 
                                    style={{
                                       left: `${(progress.imported / progress.total) * 100}%`,
                                       width: `${(progress.sessionCount / progress.total) * 100}%`
                                    }}
                                 ></div>
                              </div>
                              <div className="flex justify-between mt-1 text-xs">
                                 <span className="text-slate-500">{Math.round((progress.current / progress.total) * 100)}%</span>
                                 {progress.sessionCount > 0 && (
                                    <span className="text-green-600 font-bold">+ {progress.sessionCount} đang quét</span>
                                 )}
                              </div>
                              
                              {alreadyImportedSerials.length > 0 && (
                                 <div className="mt-4 border-t border-slate-100 pt-2">
                                    <button 
                                       onClick={() => setShowHistory(!showHistory)}
                                       className="flex items-center gap-1 text-slate-500 hover:text-blue-600 text-xs font-medium w-full justify-center"
                                    >
                                       {showHistory ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                                       {showHistory ? 'Ẩn danh sách đã nhập' : 'Xem danh sách đã nhập'}
                                    </button>
                                    
                                    {showHistory && (
                                       <div className="mt-2 max-h-32 overflow-y-auto bg-slate-50 rounded p-2 text-xs border border-slate-100 custom-scrollbar">
                                          {alreadyImportedSerials.map((s, i) => (
                                             <div key={s} className="py-1 border-b border-slate-100 last:border-0 flex justify-between">
                                                <span className="font-mono text-slate-600">{i + 1}. {s}</span>
                                                <CheckCircle size={12} className="text-green-500"/>
                                             </div>
                                          ))}
                                       </div>
                                    )}
                                 </div>
                              )}
                           </div>
                        )}
                     </div>

                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                           <Warehouse size={16}/> Chọn Kho Nhập
                        </label>
                        {warehouses.length > 0 ? (
                           <select 
                              className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-water-400 outline-none bg-white shadow-sm"
                              value={location}
                              onChange={(e) => setLocation(e.target.value)}
                           >
                              {warehouses.map(wh => (
                              <option key={wh.id} value={wh.name}>{wh.name}</option>
                              ))}
                           </select>
                        ) : (
                           <div className="text-red-500 text-sm p-3 border border-red-200 rounded-lg bg-red-50">
                              Chưa có dữ liệu Kho.
                           </div>
                        )}

                        <div className="mt-4 bg-blue-50 p-4 rounded-lg border border-blue-100 text-sm text-blue-800">
                           <p className="font-bold flex items-center gap-2 mb-1"><FileText size={14}/> Quy định nhập kho:</p>
                           <ul className="list-disc list-inside opacity-80 space-y-1">
                              <li>Chỉ nhập mã thuộc Kế hoạch đã chọn.</li>
                              <li>Mã đã nhập (kể cả đã bán) không thể nhập lại.</li>
                           </ul>
                        </div>
                     </div>
                  </div>

                  {selectedPlan && (
                     <div className="border-t border-slate-100 pt-6 animate-fade-in">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Quét mã vạch (Barcode/QR)</label>
                        <form onSubmit={handleAddSerial} className="flex gap-2 mb-4">
                           <input 
                              ref={inputRef}
                              type="text"
                              placeholder="Đặt con trỏ vào đây và quét..."
                              className="flex-1 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-water-400 outline-none font-mono text-lg shadow-sm"
                              value={currentSerial}
                              onChange={(e) => setCurrentSerial(e.target.value)}
                              autoFocus
                              disabled={!selectedPlanId}
                           />
                           <button 
                              type="submit" 
                              className={`px-8 py-3 rounded-lg font-bold flex items-center gap-2 transition-colors ${
                                 !selectedPlanId ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-slate-800 text-white hover:bg-slate-700'
                              }`}
                              disabled={!selectedPlanId}
                           >
                              <Plus size={20} /> Thêm
                           </button>
                        </form>

                        {serialList.length > 0 && (
                           <div className="bg-white rounded-lg p-4 border border-slate-200 shadow-sm mt-6">
                              <div className="flex justify-between items-center mb-4">
                                 <h4 className="font-bold text-slate-700 flex items-center gap-2">
                                    <CheckCircle size={18} className="text-green-500"/>
                                    Danh sách chuẩn bị nhập ({serialList.length})
                                 </h4>
                                 <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded">Phiên làm việc hiện tại</span>
                              </div>
                              
                              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar flex flex-col-reverse bg-slate-50 p-2 rounded-lg border-inner">
                                 {serialList.map((sn, idx) => (
                                    <div key={idx} className="flex justify-between items-center bg-white p-3 rounded border border-slate-200 shadow-sm animate-slide-in">
                                       <div className="flex items-center gap-3">
                                          <span className="w-6 h-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                                          <span className="font-mono text-slate-800 font-bold text-lg">{sn}</span>
                                       </div>
                                       <button 
                                          onClick={() => setSerialList(serialList.filter(s => s !== sn))}
                                          className="text-slate-400 hover:text-red-500 transition-colors p-2"
                                          title="Xóa khỏi danh sách"
                                       >
                                          <Trash2 size={18} />
                                       </button>
                                    </div>
                                 ))}
                              </div>
                              <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                                 <button 
                                    onClick={handleSubmit}
                                    className="bg-water-600 text-white py-3 px-8 rounded-lg font-bold hover:bg-water-700 transition-colors shadow-lg shadow-water-200 flex items-center gap-2"
                                 >
                                    Xác nhận Nhập Kho <ArrowRight size={20}/>
                                 </button>
                              </div>
                           </div>
                        )}
                     </div>
                  )}
               </>
            )}
         </div>
      )}

      {/* --- TAB CONTENT: HISTORY --- */}
      {activeTab === 'HISTORY' && (
         <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-6">
             <div className="flex flex-col md:flex-row gap-4 items-end border-b border-slate-100 pb-6">
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Từ ngày</label>
                   <input 
                      type="date" 
                      className="p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-400"
                      value={historyFrom}
                      onChange={e => setHistoryFrom(e.target.value)}
                   />
                </div>
                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-1">Đến ngày</label>
                   <input 
                      type="date" 
                      className="p-2 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-green-400"
                      value={historyTo}
                      onChange={e => setHistoryTo(e.target.value)}
                   />
                </div>
                <div className="flex-1 text-right">
                   <p className="text-sm text-slate-500">Tìm thấy <span className="font-bold text-slate-800">{historyData.length}</span> lượt nhập kho.</p>
                </div>
             </div>

             <div className="space-y-4">
                {historyData.map(tx => {
                   const product = inventoryService.getProductById(tx.productId);
                   const isExpanded = expandedTx === tx.id;
                   
                   return (
                      <div key={tx.id} className="border border-slate-200 rounded-lg overflow-hidden transition-all hover:border-green-300">
                         <div 
                           className="bg-slate-50 p-4 flex justify-between items-center cursor-pointer"
                           onClick={() => setExpandedTx(isExpanded ? null : tx.id)}
                         >
                            <div className="flex items-center gap-4">
                               <div className="bg-green-100 p-2 rounded-full text-green-600">
                                  <Calendar size={18} />
                               </div>
                               <div>
                                  <div className="font-bold text-slate-800">{new Date(tx.date).toLocaleString('vi-VN')}</div>
                                  <div className="text-sm text-slate-500">
                                     {product?.model || tx.productId} • {tx.toLocation}
                                  </div>
                               </div>
                            </div>
                            <div className="flex items-center gap-4">
                               <div className="text-right">
                                  <div className="font-bold text-green-600 text-lg">+{tx.quantity}</div>
                                  <div className="text-xs text-slate-400">Máy</div>
                               </div>
                               <button className="text-slate-400 hover:text-green-600">
                                  {isExpanded ? <ChevronUp /> : <ChevronDown />}
                               </button>
                            </div>
                         </div>
                         
                         {isExpanded && (
                            <div className="p-4 bg-white border-t border-slate-100">
                               <h5 className="font-bold text-xs text-slate-500 uppercase tracking-wide mb-3 flex items-center gap-2">
                                  <ListFilter size={14}/> Danh sách mã Serial
                               </h5>
                               <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                  {tx.serialNumbers.map(sn => (
                                     <div key={sn} className="font-mono text-xs bg-slate-50 p-2 rounded border border-slate-100 text-center text-slate-600">
                                        {sn}
                                     </div>
                                  ))}
                               </div>
                            </div>
                         )}
                      </div>
                   )
                })}

                {historyData.length === 0 && (
                   <div className="text-center py-12 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      Không có dữ liệu nhập kho trong khoảng thời gian này.
                   </div>
                )}
             </div>
         </div>
      )}
    </div>
  );
};