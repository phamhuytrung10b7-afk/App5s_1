import re

with open('StockInView.tsx', 'r') as f:
    content = f.read()

submit_code = """
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

content = content.replace("  const handleAutoStockInFromQr = ({", submit_code + "\n  const handleAutoStockInFromQr = ({")

with open('StockInView.tsx', 'w') as f:
    f.write(content)
