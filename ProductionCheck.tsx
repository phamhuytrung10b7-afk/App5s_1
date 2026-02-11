import React, { useState, useEffect } from 'react';
import { inventoryService } from './inventoryService';
import { SerialUnit, ProductionPlan } from './types';
import { ClipboardCheck, CheckCircle, XCircle, AlertTriangle, Plus, Trash2, Calendar, FileText, ArrowLeft, Save, LayoutList, Edit } from 'lucide-react';

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

  // Form State (Used for both Create and Edit)
  const [formName, setFormName] = useState('');
  const [formProductId, setFormProductId] = useState('');
  const [formSerialInput, setFormSerialInput] = useState('');

  // Check Mode State
  const [results, setResults] = useState<CheckResult[]>([]);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = () => {
    setPlans(inventoryService.getProductionPlans());
  };

  const handleSavePlan = () => {
    if (!formName || !formProductId || !formSerialInput.trim()) return;

    const serials = formSerialInput
      .split(/[\n, ]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    const uniqueSerials = Array.from(new Set(serials)) as string[];

    if (viewMode === 'EDIT' && selectedPlan) {
      inventoryService.updateProductionPlan(selectedPlan.id, formName, formProductId, uniqueSerials);
    } else {
      inventoryService.addProductionPlan(formName, formProductId, uniqueSerials);
    }

    loadPlans();
    
    // Reset and go back to list
    setFormName('');
    setFormSerialInput('');
    setFormProductId('');
    setViewMode('LIST');
  };

  const handleEditPlan = (plan: ProductionPlan, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPlan(plan);
    setFormName(plan.name);
    setFormProductId(plan.productId);
    setFormSerialInput(plan.serials.join('\n'));
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
    // Execute check immediately
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

  // --- STATISTICS FOR CHECK MODE ---
  const total = results.length;
  const foundCount = results.filter(r => r.found).length;
  const missingCount = total - foundCount;
  const percentage = total > 0 ? Math.round((foundCount / total) * 100) : 0;
  const selectedProductInfo = selectedPlan ? inventoryService.getProductById(selectedPlan.productId) : null;


  // --- VIEW: CREATE / EDIT PLAN ---
  if (viewMode === 'CREATE' || viewMode === 'EDIT') {
    const products = inventoryService.getProducts();
    const isEdit = viewMode === 'EDIT';

    return (
      <div className="max-w-4xl mx-auto space-y-6">
         <div className="flex items-center gap-3 mb-6">
            <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
               <ArrowLeft size={24} className="text-slate-600"/>
            </button>
            <h2 className="text-2xl font-bold text-slate-800">
              {isEdit ? 'Chỉnh sửa Kế hoạch' : 'Tạo Kế hoạch Sản xuất Mới'}
            </h2>
         </div>

         <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Tên Lô / Kế hoạch *</label>
                  <input 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-water-400 outline-none"
                    placeholder="VD: Lô SX Tháng 10 - Đợt 1"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                  />
               </div>
               <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Model áp dụng *</label>
                  <select 
                    className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-water-400 outline-none"
                    value={formProductId}
                    onChange={e => setFormProductId(e.target.value)}
                  >
                     <option value="">-- Chọn Model --</option>
                     {products.map(p => (
                        <option key={p.id} value={p.id}>{p.model} ({p.brand})</option>
                     ))}
                  </select>
               </div>
            </div>

            <div>
               <label className="block text-sm font-bold text-slate-700 mb-2">Danh sách Serial Ban hành *</label>
               <p className="text-xs text-slate-500 mb-2">Dán danh sách serial vào đây (mỗi mã một dòng). Bạn có thể thêm hoặc xóa bớt.</p>
               <textarea
                  className="w-full p-4 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-water-400 font-mono text-sm h-64"
                  placeholder="SN-001&#10;SN-002&#10;SN-003..."
                  value={formSerialInput}
                  onChange={e => setFormSerialInput(e.target.value)}
               />
               <p className="text-right text-xs text-slate-400 mt-2">
                  {formSerialInput.split(/[\n, ]+/).filter(s => s.length > 0).length} mã đang nhập
               </p>
            </div>

            <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
               <button onClick={() => setViewMode('LIST')} className="px-6 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">
                  Hủy bỏ
               </button>
               <button 
                  onClick={handleSavePlan}
                  disabled={!formName || !formProductId || !formSerialInput}
                  className="px-6 py-2 bg-water-600 text-white font-bold rounded-lg hover:bg-water-700 transition-colors flex items-center gap-2 disabled:bg-slate-300 disabled:cursor-not-allowed"
               >
                  <Save size={18} /> {isEdit ? 'Cập nhật' : 'Lưu Kế hoạch'}
               </button>
            </div>
         </div>
      </div>
    );
  }

  // --- VIEW: CHECK DETAILS ---
  if (viewMode === 'CHECK' && selectedPlan) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
               <button onClick={() => setViewMode('LIST')} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <ArrowLeft size={24} className="text-slate-600"/>
               </button>
               <div>
                  <h2 className="text-2xl font-bold text-slate-800">{selectedPlan.name}</h2>
                  <p className="text-slate-500 flex items-center gap-2 text-sm">
                     <FileText size={14}/> Model: <span className="font-semibold text-slate-700">{selectedProductInfo?.model || selectedPlan.productId}</span> 
                     <span className="text-slate-300">|</span>
                     <Calendar size={14}/> Ngày tạo: {new Date(selectedPlan.createdDate).toLocaleDateString('vi-VN')}
                  </p>
               </div>
            </div>
            <div className="bg-slate-100 px-4 py-2 rounded-lg">
               <span className="text-xs text-slate-500 uppercase font-bold">Trạng thái</span>
               <div className="font-bold text-slate-800">{percentage === 100 ? 'Hoàn thành' : 'Đang sản xuất'}</div>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-slate-500 text-sm font-medium">Tổng ban hành</p>
                   <p className="text-3xl font-bold text-slate-800">{total}</p>
                </div>
                <div className="bg-slate-100 p-3 rounded-full text-slate-600"><LayoutList /></div>
             </div>
             <div className="bg-green-50 p-6 rounded-xl border border-green-100 shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-green-600 text-sm font-medium">Đã nhập kho</p>
                   <p className="text-3xl font-bold text-green-700">{foundCount}</p>
                </div>
                <div className="bg-green-100 p-3 rounded-full text-green-600"><CheckCircle /></div>
             </div>
             <div className="bg-red-50 p-6 rounded-xl border border-red-100 shadow-sm flex items-center justify-between">
                <div>
                   <p className="text-red-600 text-sm font-medium">Chưa sản xuất</p>
                   <p className="text-3xl font-bold text-red-700">{missingCount}</p>
                </div>
                <div className="bg-red-100 p-3 rounded-full text-red-600"><AlertTriangle /></div>
             </div>
         </div>

         {/* Progress */}
         <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex justify-between items-end mb-2">
               <h3 className="font-bold text-slate-700">Tiến độ hoàn thành</h3>
               <span className="text-2xl font-bold text-water-600">{percentage}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden">
               <div 
                  className="bg-water-600 h-4 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
               ></div>
            </div>
         </div>

         {/* Detailed Lists */}
         <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[500px]">
            {/* Missing List */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
               <div className="bg-red-50 p-3 border-b border-red-100 flex justify-between items-center">
                  <h4 className="font-bold text-red-700 flex items-center gap-2">
                     <XCircle size={18} /> Chưa sản xuất ({missingCount})
                  </h4>
               </div>
               <div className="flex-1 overflow-y-auto p-2">
                  {results.filter(r => !r.found).map(r => (
                  <div key={r.serial} className="p-3 hover:bg-red-50 rounded border-b border-transparent hover:border-red-100 transition-colors flex items-center gap-3">
                     <AlertTriangle size={16} className="text-red-400" />
                     <span className="font-mono text-slate-700 font-medium">{r.serial}</span>
                  </div>
                  ))}
                  {missingCount === 0 && (
                  <div className="text-center p-12 text-green-500">
                     <CheckCircle size={48} className="mx-auto mb-4 opacity-50" />
                     <p className="font-medium">Tuyệt vời! Đã hoàn thành toàn bộ lô hàng.</p>
                  </div>
                  )}
               </div>
            </div>

            {/* Found List */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm flex flex-col overflow-hidden">
               <div className="bg-green-50 p-3 border-b border-green-100 flex justify-between items-center">
                  <h4 className="font-bold text-green-700 flex items-center gap-2">
                     <CheckCircle size={18} /> Đã hoàn thành ({foundCount})
                  </h4>
               </div>
               <div className="flex-1 overflow-y-auto p-2">
                  {results.filter(r => r.found).map(r => (
                  <div key={r.serial} className="p-3 hover:bg-green-50 rounded border-b border-transparent hover:border-green-100 transition-colors">
                     <div className="flex justify-between items-center">
                        <span className="font-mono text-slate-800 font-medium">{r.serial}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                           r.unit?.status === 'NEW' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                           {r.unit?.status}
                        </span>
                     </div>
                     <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-slate-300"></div>
                        {r.unit?.warehouseLocation}
                     </p>
                  </div>
                  ))}
                  {foundCount === 0 && (
                  <div className="text-center p-12 text-slate-400">
                     <p>Chưa có sản phẩm nào nhập kho.</p>
                  </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    );
  }

  // --- VIEW: LIST (DEFAULT) ---
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
         <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-full text-purple-600">
               <ClipboardCheck />
            </div>
            <div>
               <h2 className="text-2xl font-bold text-slate-800">Đối chiếu Sản xuất</h2>
               <p className="text-slate-500">Quản lý và theo dõi tiến độ các lô sản xuất.</p>
            </div>
         </div>
         <button 
            onClick={() => {
               setFormName('');
               setFormProductId('');
               setFormSerialInput('');
               setViewMode('CREATE');
            }}
            className="bg-water-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-water-700 transition-colors flex items-center gap-2 shadow-lg shadow-water-200"
         >
            <Plus size={20} /> Tạo Kế hoạch Mới
         </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
         <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
            <h4 className="font-bold text-slate-700">Danh sách Kế hoạch ({plans.length})</h4>
         </div>
         
         {plans.length === 0 ? (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center">
               <div className="bg-slate-100 p-4 rounded-full mb-4">
                  <LayoutList size={32} />
               </div>
               <h3 className="text-lg font-medium text-slate-600">Chưa có kế hoạch nào</h3>
               <p className="mb-6">Hãy tạo kế hoạch mới để bắt đầu theo dõi tiến độ sản xuất.</p>
               <button 
                  onClick={() => setViewMode('CREATE')}
                  className="text-water-600 font-medium hover:underline"
               >
                  + Tạo ngay bây giờ
               </button>
            </div>
         ) : (
            <div className="divide-y divide-slate-100">
               {plans.map(plan => {
                  const product = inventoryService.getProductById(plan.productId);
                  return (
                     <div 
                        key={plan.id} 
                        className="p-6 hover:bg-slate-50 transition-colors cursor-pointer group flex items-center justify-between"
                        onClick={() => handleSelectPlan(plan)}
                     >
                        <div className="flex items-start gap-4">
                           <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                              <FileText size={24} />
                           </div>
                           <div>
                              <h4 className="font-bold text-lg text-slate-800 group-hover:text-water-600 transition-colors">{plan.name}</h4>
                              <div className="flex items-center gap-3 text-sm text-slate-500 mt-1">
                                 <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                    {product?.model || 'Unknown Model'}
                                 </span>
                                 <span className="flex items-center gap-1">
                                    <Calendar size={14} /> {new Date(plan.createdDate).toLocaleDateString('vi-VN')}
                                 </span>
                              </div>
                           </div>
                        </div>

                        <div className="flex items-center gap-2">
                           <div className="text-right mr-4">
                              <p className="text-xs text-slate-400 font-bold uppercase">Số lượng</p>
                              <p className="text-xl font-bold text-slate-800">{plan.serials.length}</p>
                           </div>
                           <button 
                              onClick={(e) => handleEditPlan(plan, e)}
                              className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all"
                              title="Chỉnh sửa"
                           >
                              <Edit size={20} />
                           </button>
                           <button 
                              onClick={(e) => handleDeletePlan(plan.id, e)}
                              className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                              title="Xóa kế hoạch"
                           >
                              <Trash2 size={20} />
                           </button>
                           <div className="text-slate-300 group-hover:translate-x-1 transition-transform pl-2">
                              <ArrowLeft className="rotate-180" size={20} />
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         )}
      </div>
    </div>
  );
};