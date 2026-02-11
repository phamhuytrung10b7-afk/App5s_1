import React, { useState, useEffect, useRef } from 'react';
import { inventoryService } from './inventoryService';
import { exportPlanDetail } from './services/reportService';
import { SerialUnit, ProductionPlan } from './types';
import { ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Plus, Trash2, Calendar, FileText, ArrowLeft, Save, LayoutList, Edit, FileSpreadsheet, Upload, Scan, Search, ArrowRight } from 'lucide-react';
import { read, utils } from 'xlsx';
import { playSound } from './utils/sound';

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

  // Form State
  const [formName, setFormName] = useState('');
  const [formProductId, setFormProductId] = useState('');
  
  const [scannedList, setScannedList] = useState<string[]>([]);
  const [currentInput, setCurrentInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Mode State
  const [results, setResults] = useState<CheckResult[]>([]);

  useEffect(() => {
    loadPlans();
  }, [viewMode]);

  useEffect(() => {
    if ((viewMode === 'CREATE' || viewMode === 'EDIT') && inputRef.current) {
        inputRef.current.focus();
    }
  }, [viewMode, scannedList]);

  const loadPlans = () => {
    setPlans(inventoryService.getProductionPlans());
  };

  const handleSavePlan = () => {
    if (!formName || !formProductId || scannedList.length === 0) return;

    const uniqueSerials: string[] = Array.from(new Set(scannedList));

    if (viewMode === 'EDIT' && selectedPlan) {
      inventoryService.updateProductionPlan(selectedPlan.id, formName, formProductId, uniqueSerials);
    } else {
      inventoryService.addProductionPlan(formName, formProductId, uniqueSerials);
    }

    loadPlans();
    resetForm();
    setViewMode('LIST');
  };

  const resetForm = () => {
    setFormName('');
    setFormProductId('');
    setScannedList([]);
    setCurrentInput('');
  };

  const handleEditPlan = (plan: ProductionPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlan(plan);
    setFormName(plan.name);
    setFormProductId(plan.productId);
    setScannedList([...plan.serials]);
    setViewMode('EDIT');
  };

  const handleDeletePlan = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if(window.confirm('Bạn có chắc muốn xóa kế hoạch này?')) {
        inventoryService.deleteProductionPlan(id);
        loadPlans();
    }
  };

  const handleSelectPlan = (plan: ProductionPlan) => {
    setSelectedPlan(plan);
    const checkResults: CheckResult[] = plan.serials.map(serial => {
      const unit = inventoryService.getUnitBySerial(serial);
      return {
        serial,
        found: !!unit,
        unit: unit || undefined
      };
    });
    setResults(checkResults);
    setViewMode('CHECK');
  };

  const handleAddSerial = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const code = currentInput.trim();
    if (!code) return;

    if (scannedList.includes(code)) {
        playSound('warning');
        setCurrentInput('');
        return;
    }

    playSound('success');
    setScannedList([code, ...scannedList]);
    setCurrentInput('');
  };

  const handleDeleteSerial = (code: string) => {
      setScannedList(scannedList.filter(s => s !== code));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
        const data = await file.arrayBuffer();
        const workbook = read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        const newSerials: string[] = [];
        jsonData.forEach(row => {
            if (row[0]) {
                const val = String(row[0]).trim();
                if (val && !scannedList.includes(val) && !newSerials.includes(val)) {
                    newSerials.push(val);
                }
            }
        });

        if (newSerials.length > 0) {
            setScannedList([...newSerials, ...scannedList]);
            playSound('success');
        }
    } catch (error) {
        playSound('error');
    } finally {
        if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const total = results.length;
  const foundCount = results.filter(r => r.found).length;
  const missingCount = total - foundCount;
  const percentage = total > 0 ? Math.round((foundCount / total) * 100) : 0;
  const selectedProductInfo = selectedPlan ? inventoryService.getProductById(selectedPlan.productId) : null;

  if (viewMode === 'CREATE' || viewMode === 'EDIT') {
    const products = inventoryService.getProducts();
    const isEdit = viewMode === 'EDIT';

    return (
      <div className="max-w-6xl mx-auto space-y-6">
         <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
               <ArrowLeft size={24} className="text-slate-600"/>
            </button>
            <h2 className="text-2xl font-bold text-slate-800">
              {isEdit ? 'Chỉnh sửa Kế hoạch' : 'Tạo Kế hoạch Sản xuất Mới'}
            </h2>
         </div>

         <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-4 space-y-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 space-y-4">
                    <h3 className="font-bold text-slate-700 border-b border-slate-100 pb-2">1. Thông tin Chung</h3>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Tên Lô / Kế hoạch *</label>
                        <input className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-water-400 outline-none" value={formName} onChange={e => setFormName(e.target.value)} />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Model áp dụng *</label>
                        <select className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-water-400 outline-none" value={formProductId} onChange={e => setFormProductId(e.target.value)}>
                            <option value="">-- Chọn Model ({products.length}) --</option>
                            {products.map(p => (<option key={p.id} value={p.id}>{p.model} ({p.brand})</option>))}
                        </select>
                        {products.length === 0 && <p className="text-red-500 text-xs mt-1">Lỗi: Chưa có Model nào trong Cấu hình!</p>}
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 flex flex-col h-[400px]">
                    <form onSubmit={handleAddSerial} className="relative mb-4">
                         <Search className="absolute left-3 top-3.5 text-slate-400" size={20} />
                         <input ref={inputRef} className="w-full pl-10 p-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-400 font-mono text-lg" placeholder="Quét mã vạch..." value={currentInput} onChange={(e) => setCurrentInput(e.target.value)} />
                    </form>
                    <div className="flex-1 overflow-y-auto bg-slate-50 rounded-lg p-2 mb-4">
                         {scannedList.length === 0 ? (<div className="h-full flex items-center justify-center text-slate-400 text-sm italic">Chưa có mã.</div>) : (
                            scannedList.map((sn, idx) => (
                               <div key={idx} className="flex justify-between items-center py-2 px-3 border-b border-slate-200 bg-white rounded mb-1 shadow-sm">
                                  <span className="font-mono font-bold text-slate-700">{sn}</span>
                                  <button onClick={() => handleDeleteSerial(sn)} className="text-slate-300 hover:text-red-500"><XCircle size={16} /></button>
                               </div>
                            ))
                         )}
                    </div>
                    <div className="mb-4 text-center">
                        <input type="file" accept=".xlsx, .xls, .csv" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                        <button onClick={() => fileInputRef.current?.click()} className="text-xs text-blue-600 hover:underline flex items-center justify-center gap-1 w-full"><FileSpreadsheet size={14}/> Tải từ Excel</button>
                    </div>
                    <div className="mt-auto pt-4 border-t">
                         <div className="flex justify-between items-center mb-4 text-sm font-bold text-slate-600"><span>Số lượng:</span><span className="text-xl text-blue-600">{scannedList.length}</span></div>
                         <button onClick={handleSavePlan} disabled={scannedList.length === 0 || !formName || !formProductId} className="w-full bg-slate-800 text-white py-3 rounded-lg font-bold hover:bg-slate-700 disabled:bg-slate-300 flex items-center justify-center gap-2">Lưu Kế hoạch <ArrowRight size={18} /></button>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-8">
                <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-[740px]">
                    <div className="p-4 border-b bg-slate-50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-700 flex items-center gap-2"><LayoutList size={18}/> Danh sách Ban hành</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {scannedList.map((code, idx) => (
                                <div key={idx} className="bg-white p-3 rounded border border-slate-200 shadow-sm flex justify-between items-center group">
                                    <span className="font-mono text-slate-800 font-bold">{code}</span>
                                    <button onClick={() => handleDeleteSerial(code)} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
         </div>
      </div>
    );
  }

  if (viewMode === 'CHECK' && selectedPlan) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-slate-200 rounded-full transition-colors"><ArrowLeft size={24} className="text-slate-600"/></button>
               <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedPlan.name}</h2>
                  <p className="text-slate-500 text-sm">Model: <span className="font-semibold text-slate-700">{selectedProductInfo?.model}</span></p>
               </div>
            </div>
            <button onClick={() => exportPlanDetail(selectedPlan)} className="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-sm"><FileSpreadsheet size={16} /> Xuất Excel</button>
         </div>
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <p className="text-slate-500 text-sm">Tổng ban hành</p>
                <p className="text-3xl font-bold">{total}</p>
             </div>
             <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm">
                <p className="text-green-600 text-sm">Đã nhập kho</p>
                <p className="text-3xl font-bold text-green-700">{foundCount}</p>
             </div>
             <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm">
                <p className="text-red-600 text-sm">Chưa sản xuất</p>
                <p className="text-3xl font-bold text-red-700">{missingCount}</p>
             </div>
         </div>
         <div className="bg-white p-6 rounded-xl border border-slate-100">
            <div className="flex justify-between items-end mb-2"><h3 className="font-bold">Tiến độ</h3><span className="text-2xl font-bold text-water-600">{percentage}%</span></div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden"><div className="bg-water-600 h-4 rounded-full transition-all" style={{ width: `${percentage}%` }}></div></div>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full text-purple-600"><ClipboardCheck /></div>
            <div><h2 className="text-2xl font-bold">Đối chiếu Sản xuất</h2></div>
         </div>
         <button onClick={() => { resetForm(); setViewMode('CREATE'); }} className="bg-water-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-water-700">+ Tạo Kế hoạch Mới</button>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="divide-y divide-slate-100">
            {plans.map(plan => {
               const product = inventoryService.getProductById(plan.productId);
               return (
                  <div key={plan.id} className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group flex items-center justify-between" onClick={() => handleSelectPlan(plan)}>
                     <div className="flex items-start gap-4">
                        <div className="bg-blue-50 p-3 rounded-lg text-blue-600"><FileText size={24} /></div>
                        <div>
                           <h4 className="font-bold text-lg text-slate-800">{plan.name}</h4>
                           <span className="text-xs bg-slate-100 px-2 py-0.5 rounded text-slate-600">{product?.model}</span>
                        </div>
                     </div>
                     <div className="flex items-center gap-4">
                        <button onClick={(e) => handleEditPlan(plan, e)} className="p-2 text-slate-400 hover:text-blue-600"><Edit size={18} /></button>
                        <button onClick={(e) => handleDeletePlan(plan.id, e)} className="p-2 text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                        <ArrowRight className="text-slate-300 group-hover:translate-x-1 transition-transform" size={20} />
                     </div>
                  </div>
               );
            })}
         </div>
      </div>
    </div>
  );
};