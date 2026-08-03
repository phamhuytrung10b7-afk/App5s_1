import re

with open('StockInView.tsx', 'r') as f:
    content = f.read()

# Add partial modal state
state_code = """  const [autoScanHistory, setAutoScanHistory] = useState<
    { id: string; partCode: string; partName: string; qty: number; unit: string; time: string; contNumber?: string; stockAfter: number }[]
  >([]);

  const [partialImportModal, setPartialImportModal] = useState<{
    isOpen: boolean;
    part: Part;
    tagId?: string;
    contNumber?: string;
    originalQty: number;
    alreadyImported: number;
  } | null>(null);
  
  const [importQtyInput, setImportQtyInput] = useState<number>(0);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
"""

content = re.sub(r'const \[autoScanHistory.*?\]\(\[\]\);', state_code, content, flags=re.DOTALL)

# Replace handleAutoStockInFromQr
new_handler = """  const handleAutoStockInFromQr = ({
    part,
    qty,
    contNumber,
    tagId,
  }: {
    part: Part;
    qty?: number;
    contNumber?: string;
    tagId?: string;
  }) => {
    if (!qty || qty <= 0 || !contNumber) {
      setSelectedPartId(part.id);
      setMainTab('manual');
      setMessage({
        type: 'success',
        text: `ℹ️ Đã tìm thấy linh kiện [${part.code}] ${part.name}. Vui lòng nhập số lượng và bấm 'Xác Nhận Nhập Kho'.`,
      });
      return;
    }

    const usedCheck = storageService.isQrTokenUsed(tagId || '');
    const alreadyImported = usedCheck.importedQuantity || 0;
    const remaining = qty - alreadyImported;

    if (remaining <= 0) {
       setMessage({ type: 'error', text: `Tem này đã được nhập đủ số lượng (${qty})!` });
       return;
    }

    setImportQtyInput(remaining);
    setSelectedLocation('');
    setPartialImportModal({
      isOpen: true,
      part,
      tagId,
      contNumber,
      originalQty: qty,
      alreadyImported
    });
  };

  const submitPartialImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partialImportModal) return;
    
    if (importQtyInput <= 0) {
      alert('Số lượng nhập phải lớn hơn 0');
      return;
    }
    
    const remaining = partialImportModal.originalQty - partialImportModal.alreadyImported;
    if (importQtyInput > remaining) {
      alert(`Số lượng nhập vượt quá số lượng còn lại (${remaining})`);
      return;
    }

    const { part, tagId, contNumber, originalQty, alreadyImported } = partialImportModal;
    const reasonText = `Nhập kho theo Cont ${contNumber}`;
    
    const tx = storageService.addStockIn({
      partId: part.id,
      quantity: importQtyInput,
      date: new Date().toISOString(),
      person: defaultPerson,
      reasonOrPurpose: reasonText,
      notes: tagId ? `Tem QR Cont ID: ${tagId}` : 'Quét mã tự động Tem Cont',
      locationId: selectedLocation
    });
    
    // Update part location in storage if a new location was selected (optional, but good for part master data)
    if (selectedLocation) {
        const p = storageService.getPartById(part.id);
        if (p) {
            storageService.updatePart({ ...p, location: selectedLocation });
        }
    }

    if (tagId) {
      storageService.markQrTokenAsUsed(tagId, {
        partCode: part.code,
        quantity: originalQty,
        importedQuantity: alreadyImported + importQtyInput,
        contNumber: contNumber || '',
        person: defaultPerson,
      });
    }

    const nowTimeStr = new Date().toLocaleTimeString('vi-VN');
    setAutoScanHistory((prev) => [
      {
        id: `${part.id}-${Date.now()}`,
        partCode: part.code,
        partName: part.name,
        qty: importQtyInput,
        unit: part.unit,
        time: nowTimeStr,
        contNumber,
        stockAfter: tx.stockAfter,
      },
      ...prev,
    ]);

    setMessage({
      type: 'success',
      text: `✅ Nhập thành công ${importQtyInput} ${part.unit} linh kiện [${part.code}]!`,
    });
    setPartialImportModal(null);
  };
"""

content = re.sub(r'const handleAutoStockInFromQr =.*?setMessage\(\{[\s\S]*?text: `✅ Nhập thành công.*?\n\s+\}\);\n\s+\};', new_handler, content, flags=re.DOTALL)

# Add PartialImportModal render
modal_render = """
      {/* PARTIAL IMPORT MODAL */}
      {partialImportModal && partialImportModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-emerald-50">
              <h3 className="font-bold text-emerald-800 flex items-center">
                <Package className="w-5 h-5 mr-2 text-emerald-600" />
                Xác Nhận Nhập Kho Cont
              </h3>
            </div>
            
            <form onSubmit={submitPartialImport} className="p-5 space-y-4 overflow-y-auto">
              <div className="bg-slate-50 p-3 rounded-xl space-y-1">
                <p className="text-sm font-semibold text-slate-800">[{partialImportModal.part.code}] {partialImportModal.part.name}</p>
                <p className="text-xs text-slate-500">Mã Cont: <span className="font-bold text-slate-700">{partialImportModal.contNumber}</span></p>
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-200">
                  <span className="text-xs text-slate-500">Đã nhập: <strong className="text-emerald-600">{partialImportModal.alreadyImported}</strong> / {partialImportModal.originalQty}</span>
                  <span className="text-xs font-bold text-amber-600">Còn lại: {partialImportModal.originalQty - partialImportModal.alreadyImported}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Số lượng nhập đợt này</label>
                <input
                  type="number"
                  min="1"
                  max={partialImportModal.originalQty - partialImportModal.alreadyImported}
                  required
                  value={importQtyInput || ''}
                  onChange={(e) => setImportQtyInput(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-sm font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vị trí khoang / kệ lưu trữ</label>
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 text-sm"
                  required
                >
                  <option value="">-- Chọn vị trí --</option>
                  {settings.locations?.map(loc => (
                    <option key={loc.id} value={loc.name}>{loc.name} {loc.description ? `(${loc.description})` : ''}</option>
                  ))}
                </select>
                {(!settings.locations || settings.locations.length === 0) && (
                   <p className="text-[10px] text-red-500 mt-1">Chưa có vị trí nào được tạo. Vui lòng vào Cài đặt Sơ đồ Kho để tạo khoang/kệ.</p>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setPartialImportModal(null)}
                  className="px-4 py-2 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl text-sm transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!selectedLocation}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Xác Nhận Nhập
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
"""

content = content.replace("{/* TAB 1: AUTO SCAN MODE */}", modal_render + "\n      {/* TAB 1: AUTO SCAN MODE */}")

with open('StockInView.tsx', 'w') as f:
    f.write(content)

