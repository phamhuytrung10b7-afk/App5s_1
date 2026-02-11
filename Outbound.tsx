import React, { useState, useRef, useEffect } from 'react';
import { inventoryService } from './inventoryService';
import { Upload, CheckCircle, XCircle, Search, Settings, ArrowRightLeft, Users, Warehouse, Store, AlertTriangle, ArrowRight } from 'lucide-react';
import { playSound } from './sound';

export const Outbound: React.FC = () => {
  const products = inventoryService.getProducts();
  const warehouses = inventoryService.getWarehouses();
  const customers = inventoryService.getCustomers();
  
  // Selection State
  const [outboundType, setOutboundType] = useState<'SALE' | 'TRANSFER'>('SALE');
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [targetId, setTargetId] = useState<string>(''); // Customer ID or Warehouse ID
  
  // Scanning State
  const [serialInput, setSerialInput] = useState('');
  const [sessionScans, setSessionScans] = useState<string[]>([]);
  const [message, setMessage] = useState<{type: 'success' | 'error' | 'warning', text: string} | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [sessionScans, message, selectedProductId]);

  const handleScan = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedProductId) {
       playSound('error');
       setMessage({ type: 'error', text: 'Vui lòng chọn Model sản phẩm trước!' });
       return;
    }

    const scannedCode = serialInput.trim();
    if (!scannedCode) return;

    // 1. Check duplicate in Session
    if (sessionScans.includes(scannedCode)) {
       playSound('warning');
       setMessage({ type: 'warning', text: 'Mã này vừa quét xong.' });
       setSerialInput('');
       return;
    }

    // 2. Check Inventory Existence & Status
    const unit = inventoryService.getUnitBySerial(scannedCode);
    
    if (!unit) {
       playSound('error');
       setMessage({ type: 'error', text: `Mã ${scannedCode} không tồn tại trong kho!` });
       setSerialInput('');
       return;
    }

    if (unit.productId !== selectedProductId) {
       playSound('error');
       setMessage({ type: 'error', text: `Mã này thuộc Model khác, không phải ${inventoryService.getProductById(selectedProductId)?.model}` });
       setSerialInput('');
       return;
    }

    if (unit.status !== 'NEW') {
       playSound('error');
       setMessage({ type: 'error', text: `Mã ${scannedCode} không khả dụng (Trạng thái: ${unit.status})` });
       setSerialInput('');
       return;
    }

    // 3. Success
    playSound('success');
    setSessionScans([...sessionScans, scannedCode]);
    setMessage({ type: 'success', text: `OK: ${scannedCode}` });
    setSerialInput('');
  };

  const handleSubmit = () => {
     if (!selectedProductId || !targetId || sessionScans.length === 0) return;

     try {
        if (outboundType === 'SALE') {
            const customer = customers.find(c => c.id === targetId)?.name || 'Khách lẻ';
            inventoryService.exportUnits(selectedProductId, sessionScans, customer);
        } else {
            const wh = warehouses.find(w => w.id === targetId)?.name || 'Kho khác';
            inventoryService.transferUnits(selectedProductId, sessionScans, wh);
        }
        
        playSound('success');
        setMessage({ type: 'success', text: `Đã xuất ${sessionScans.length} máy thành công!` });
        setSessionScans([]);
     } catch (err: any) {
        playSound('error');
        setMessage({ type: 'error', text: err.message });
     }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="bg-blue-100 p-3 rounded-full text-blue-600">
            <Upload />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Xuất Kho / Điều Chuyển</h2>
            <p className="text-slate-500">Quét mã vạch để xuất bán hoặc chuyển kho nội bộ.</p>
          </div>
        </div>

        {/* Dynamic Alert Banner */}
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
          {/* Column 1: Configuration */}
          <div className="space-y-4">
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Loại giao dịch</label>
                <div className="flex bg-white rounded-lg p-1 border border-slate-200">
                   <button 
                      className={`flex-1 py-2 rounded-md font-medium text-sm transition-all flex justify-center items-center gap-2 ${outboundType === 'SALE' ? 'bg-blue-100 text-blue-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                      onClick={() => setOutboundType('SALE')}
                   >
                      <Store size={16}/> Xuất Bán
                   </button>
                   <button 
                      className={`flex-1 py-2 rounded-md font-medium text-sm transition-all flex justify-center items-center gap-2 ${outboundType === 'TRANSFER' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                      onClick={() => setOutboundType('TRANSFER')}
                   >
                      <ArrowRightLeft size={16}/> Điều Chuyển
                   </button>
                </div>
             </div>

             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">
                   {outboundType === 'SALE' ? 'Khách hàng / Đại lý' : 'Kho nhận hàng'}
                </label>
                <select 
                   className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white shadow-sm"
                   value={targetId}
                   onChange={(e) => setTargetId(e.target.value)}
                >
                   <option value="">
                      {outboundType === 'SALE' ? '-- Chọn Khách hàng --' : '-- Chọn Kho đến --'}
                   </option>
                   {outboundType === 'SALE' 
                      ? customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                      : warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)
                   }
                </select>
             </div>
             
             <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Model Sản phẩm</label>
                <select 
                   className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-400 outline-none bg-white shadow-sm"
                   value={selectedProductId}
                   onChange={(e) => {
                      setSelectedProductId(e.target.value);
                      setSessionScans([]); 
                   }}
                >
                   <option value="">-- Chọn Model cần xuất --</option>
                   {products.map(p => (
                      <option key={p.id} value={p.id}>{p.model} ({p.brand})</option>
                   ))}
                </select>
             </div>
          </div>

          {/* Column 2: Scanning */}
          <div className={`flex flex-col ${!selectedProductId ? 'opacity-50 pointer-events-none' : ''} transition-opacity`}>
             <label className="block text-sm font-bold text-slate-700 mb-2">Quét mã Serial</label>
             <div className="flex-1 bg-white rounded-lg border border-slate-200 p-4 flex flex-col">
                <form onSubmit={handleScan} className="relative mb-4">
                   <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                   <input 
                      ref={inputRef}
                      className="w-full pl-10 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 font-mono text-lg"
                      placeholder="Quét mã vạch..."
                      value={serialInput}
                      onChange={(e) => setSerialInput(e.target.value)}
                      disabled={!selectedProductId}
                   />
                </form>

                <div className="flex-1 overflow-y-auto max-h-48 border-t border-slate-100 pt-2 custom-scrollbar flex flex-col-reverse">
                   {sessionScans.map((sn, idx) => (
                      <div key={sn} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0 animate-slide-in">
                         <span className="font-mono font-bold text-slate-700">{sn}</span>
                         <button onClick={() => setSessionScans(sessionScans.filter(s => s !== sn))} className="text-red-400 hover:text-red-600 text-sm">Xóa</button>
                      </div>
                   ))}
                   {sessionScans.length === 0 && (
                      <div className="text-center text-slate-400 mt-8 text-sm">
                         Chưa có mã nào được quét.
                      </div>
                   )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-slate-100">
                   <div className="flex justify-between items-center mb-4 text-sm font-bold text-slate-600">
                      <span>Số lượng:</span>
                      <span className="text-xl text-blue-600">{sessionScans.length}</span>
                   </div>
                   <button 
                      onClick={handleSubmit}
                      disabled={sessionScans.length === 0 || !targetId}
                      className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                   >
                      Xác nhận Xuất <ArrowRight size={18} />
                   </button>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};