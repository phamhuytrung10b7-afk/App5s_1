
import React, { useState, useEffect, useRef } from 'react';
import { inventoryService } from './inventoryService';
import { exportPlanDetail } from './reportService';
import { SerialUnit, ProductionPlan } from './types';
import { ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Plus, Trash2, Calendar, FileText, ArrowLeft, LayoutList, Edit, FileSpreadsheet, Search, ArrowRight } from 'lucide-react';
import { read, utils } from 'xlsx';
import { playSound } from './sound';

interface CheckResult {
  serial: string;
  found: boolean;
  unit?: SerialUnit;
}

type ViewMode = 'LIST' | 'CREATE' | 'CHECK' | 'EDIT';

export const ProductionCheck: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('LIST');
  const [plans, setPlans] = useState<ProductionPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<ProductionPlan | null>(null);

  const [formName, setFormName] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [scannedList, setScannedList] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [results, setResults] = useState<CheckResult[]>([]);

  useEffect(() => {
    setPlans(inventoryService.getProductionPlans());
  }, [viewMode]);

  useEffect(() => {
    if ((viewMode === 'CREATE' || viewMode === 'EDIT') && inputRef.current) inputRef.current.focus();
  }, [viewMode, scannedList]);

  const handleSavePlan = () => {
    if (!formName || !formProductId || scannedList.length === 0) return;
    const uniqueSerials = Array.from(new Set(scannedList));
    if (viewMode === 'EDIT' && selectedPlan) inventoryService.updateProductionPlan(selectedPlan.id, formName, formProductId, uniqueSerials);
    else inventoryService.addProductionPlan(formName, formProductId, uniqueSerials);
    setViewMode('LIST');
    setFormName(''); setFormProductId(''); setScannedList([]);
  };

  const handleSelectPlan = (plan: ProductionPlan) => {
    setSelectedPlan(plan);
    setResults(plan.serials.map(serial => ({ serial, found: !!inventoryService.getUnitBySerial(serial), unit: inventoryService.getUnitBySerial(serial) })));
    setViewMode('CHECK');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
        const data = await file.arrayBuffer();
        const workbook = read(data);
        const jsonData = utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }) as any[][];
        const newSerials: string[] = [];
        jsonData.forEach(row => { if (row[0]) { const val = String(row[0]).trim(); if (val && !scannedList.includes(val)) newSerials.push(val); } });
        setScannedList([...newSerials, ...scannedList]);
        playSound('success');
    } catch (e) { playSound('error'); }
  };

  if (viewMode === 'CREATE' || viewMode === 'EDIT') {
    const products = inventoryService.getProducts();
    return (
      <div className="max-w-6xl mx-auto space-y-6">
         <div className="flex items-center gap-3"><button onClick={() => setViewMode('LIST')}><ArrowLeft size={24}/></button><h2 className="text-2xl font-bold">Kế hoạch sản xuất</h2></div>
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-xl border space-y-4">
                    <input className="w-full p-3 border rounded-lg" placeholder="Tên Lô *" value={formName} onChange={e => setFormName(e.target.value)} />
                    <select className="w-full p-3 border rounded-lg" value={formProductId} onChange={e => setFormProductId(e.target.value)}>
                        <option value="">-- Chọn Model --</option>
                        {products.map(p => (<option key={p.id} value={p.id}>{p.model}</option>))}
                    </select>
                </div>
                <div className="bg-white rounded-xl border p-4 h-[400px] flex flex-col">
                    <form onSubmit={e => { e.preventDefault(); if (currentInput) { setScannedList([currentInput.trim(), ...scannedList]); setCurrentInput(''); playSound('success'); } }} className="relative mb-4">
                         <input ref={inputRef} className="w-full p-3 border rounded-lg font-mono" placeholder="Quét mã..." value={currentInput} onChange={e => setCurrentInput(e.target.value)} />
                    </form>
                    <div className="flex-1 overflow-y-auto bg-slate-50 rounded p-2 mb-4">
                         {scannedList.map((sn, i) => (<div key={i} className="flex justify-between p-2 bg-white border rounded mb-1 font-mono"><span>{sn}</span><button onClick={() => setScannedList(scannedList.filter(s => s !== sn))}><Trash2 size={16}/></button></div>))}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-600 mb-4 underline">Tải từ Excel</button>
                    <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <button onClick={handleSavePlan} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold">Lưu Kế hoạch</button>
                </div>
            </div>
            <div className="lg:col-span-8 bg-white rounded-xl border h-[600px] overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {scannedList.map((sn, i) => (<div key={i} className="p-2 border rounded bg-slate-50 font-mono text-center">{sn}</div>))}
                </div>
            </div>
         </div>
      </div>
    );
  }

  if (viewMode === 'CHECK' && selectedPlan) {
    const total = results.length;
    const found = results.filter(r => r.found).length;
    return (
      <div className="space-y-6">
         <div className="flex justify-between items-center"><button onClick={() => setViewMode('LIST')}><ArrowLeft size={24}/></button><button onClick={() => exportPlanDetail(selectedPlan)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold">Xuất Excel</button></div>
         <div className="grid grid-cols-3 gap-4">
             <div className="bg-white p-6 border rounded-xl">Tổng: {total}</div>
             <div className="bg-green-50 p-6 border rounded-xl">Đã xong: {found}</div>
             <div className="bg-red-50 p-6 border rounded-xl">Còn lại: {total - found}</div>
         </div>
         <div className="bg-white p-6 border rounded-xl">
             <h3 className="font-bold mb-4">Chi tiết</h3>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                 {results.map(r => (<div key={r.serial} className={`p-2 border rounded font-mono text-xs ${r.found ? 'bg-green-50' : 'bg-red-50'}`}>{r.serial}</div>))}
             </div>
         </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">Đối chiếu sản xuất</h2><button onClick={() => setViewMode('CREATE')} className="bg-water-600 text-white px-4 py-2 rounded-lg font-bold">+ Tạo Lô Mới</button></div>
      <div className="bg-white rounded-xl border divide-y">
         {plans.map(p => (
            <div key={p.id} className="p-6 flex justify-between items-center hover:bg-slate-50 cursor-pointer" onClick={() => handleSelectPlan(p)}>
               <div><div className="font-bold">{p.name}</div><div className="text-sm text-slate-500">{inventoryService.getProductById(p.productId)?.model} • {p.serials.length} máy</div></div>
               <div className="flex gap-4">
                  <button onClick={e => { e.stopPropagation(); if(confirm('Xóa?')) { inventoryService.deleteProductionPlan(p.id); setPlans(inventoryService.getProductionPlans()); } }}><Trash2 className="text-red-400"/></button>
                  <ArrowRight />
               </div>
            </div>
         ))}
      </div>
    </div>
  );
};
