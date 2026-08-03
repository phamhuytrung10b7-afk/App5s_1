import { Part, Transaction, StockCheckRecord, AppSettings, ContainerBatch, ContainerQrTag, FifoLot, ModelBOM, ModelBOMItem } from './types';
import { initialParts, initialTransactions, initialSettings } from './sampleData';
import * as XLSX from 'xlsx';

const PARTS_KEY = 'thekho_parts_v1';
const TRANSACTIONS_KEY = 'thekho_transactions_v1';
const STOCK_CHECKS_KEY = 'thekho_stock_checks_v1';
const SETTINGS_KEY = 'thekho_settings_v1';
const CONTAINER_BATCHES_KEY = 'thekho_container_batches_v1';
const USED_QR_TOKENS_KEY = 'thekho_used_qr_tokens_v1';
const MODEL_BOMS_KEY = 'thekho_model_boms_v1';

// Helper for initial load
export const storageService = {
  // Settings
  getSettings(): AppSettings {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(initialSettings));
      return initialSettings;
    }
    try {
      const parsed = JSON.parse(raw);
      return {
        ...initialSettings,
        ...parsed,
        staffList: parsed.staffList && parsed.staffList.length ? parsed.staffList : initialSettings.staffList,
        stockInReasons: parsed.stockInReasons && parsed.stockInReasons.length ? parsed.stockInReasons : initialSettings.stockInReasons,
        stockOutPurposes: parsed.stockOutPurposes && parsed.stockOutPurposes.length ? parsed.stockOutPurposes : initialSettings.stockOutPurposes,
        productionOrders: parsed.productionOrders && parsed.productionOrders.length ? parsed.productionOrders : initialSettings.productionOrders,
      };
    } catch {
      return initialSettings;
    }
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  // Parts
  getParts(): Part[] {
    const raw = localStorage.getItem(PARTS_KEY);
    if (!raw) {
      localStorage.setItem(PARTS_KEY, JSON.stringify(initialParts));
      return initialParts;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialParts;
    }
  },

  getPartById(id: string): Part | undefined {
    const parts = this.getParts();
    return parts.find((p) => p.id === id);
  },

  saveParts(parts: Part[]): void {
    localStorage.setItem(PARTS_KEY, JSON.stringify(parts));
  },

  addPart(partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>): Part {
    const parts = this.getParts();
    const newPart: Part = {
      ...partData,
      id: 'part-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    parts.unshift(newPart);
    this.saveParts(parts);
    return newPart;
  },

  updatePart(id: string, updatedData: Partial<Part>): Part {
    const parts = this.getParts();
    const index = parts.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Không tìm thấy linh kiện');

    const updatedPart: Part = {
      ...parts[index],
      ...updatedData,
      updatedAt: new Date().toISOString(),
    };
    parts[index] = updatedPart;
    this.saveParts(parts);
    return updatedPart;
  },

  deletePart(id: string): void {
    const parts = this.getParts().filter((p) => p.id !== id);
    this.saveParts(parts);

    // Remove transactions for this part
    const txs = this.getTransactions().filter((t) => t.partId !== id);
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
  },

  // Transactions (The Kho)
  getTransactions(): Transaction[] {
    const raw = localStorage.getItem(TRANSACTIONS_KEY);
    if (!raw) {
      localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(initialTransactions));
      return initialTransactions;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return initialTransactions;
    }
  },

  saveTransactions(txs: Transaction[]): void {
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(txs));
  },

  // Get transactions for a specific part chronologically (ascending for bin card calculations)
  getBinCardHistory(partId: string): Transaction[] {
    const txs = this.getTransactions().filter((t) => t.partId === partId);
    // Sort by date ascending
    return txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  // Perform Stock-In
  addStockIn(params: {
    partId: string;
    quantity: number;
    date: string;
    person: string;
    reasonOrPurpose?: string;
    notes?: string;
  }): Transaction {
    const part = this.getPartById(params.partId);
    if (!part) throw new Error('Linh kiện không tồn tại');

    const stockBefore = part.currentStock;
    const stockAfter = stockBefore + params.quantity;

    // Update part current stock
    this.updatePart(part.id, { currentStock: stockAfter });

    // Create transaction
    const newTx: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      partId: part.id,
      partCode: part.code,
      partName: part.name,
      unit: part.unit,
      type: 'IN',
      quantity: params.quantity,
      date: params.date || new Date().toISOString(),
      person: params.person,
      reasonOrPurpose: params.reasonOrPurpose || 'Nhập kho',
      notes: params.notes || '',
      stockBefore,
      stockAfter,
    };

    const txs = this.getTransactions();
    txs.push(newTx);
    this.saveTransactions(txs);

    return newTx;
  },

  // Perform Stock-Out with Anti-Negative Stock Rule!
  addStockOut(params: {
    partId: string;
    quantity: number;
    date: string;
    person: string;
    productionOrder?: string;
    reasonOrPurpose?: string;
    notes?: string;
  }): Transaction {
    const part = this.getPartById(params.partId);
    if (!part) throw new Error('Linh kiện không tồn tại');

    if (params.quantity > part.currentStock) {
      throw new Error(`Số lượng xuất (${params.quantity} ${part.unit}) vượt quá số lượng tồn hiện tại trong kho (${part.currentStock} ${part.unit})!`);
    }

    const stockBefore = part.currentStock;
    const stockAfter = stockBefore - params.quantity;

    // Update part current stock
    this.updatePart(part.id, { currentStock: stockAfter });

    // Create transaction
    const newTx: Transaction = {
      id: 'tx-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      partId: part.id,
      partCode: part.code,
      partName: part.name,
      unit: part.unit,
      type: 'OUT',
      quantity: params.quantity,
      date: params.date || new Date().toISOString(),
      person: params.person,
      productionOrder: params.productionOrder || '',
      reasonOrPurpose: params.reasonOrPurpose || 'Xuất sản xuất',
      notes: params.notes || '',
      stockBefore,
      stockAfter,
    };

    const txs = this.getTransactions();
    txs.push(newTx);
    this.saveTransactions(txs);

    return newTx;
  },

  // Stock Audit Check & Adjustment
  performStockCheck(params: {
    partId: string;
    actualStock: number;
    performedBy: string;
    note?: string;
  }): { checkRecord: StockCheckRecord; adjustmentTx?: Transaction } {
    const part = this.getPartById(params.partId);
    if (!part) throw new Error('Linh kiện không tồn tại');

    const systemStock = part.currentStock;
    const difference = params.actualStock - systemStock;

    const checkRecord: StockCheckRecord = {
      id: 'chk-' + Date.now(),
      partId: part.id,
      partCode: part.code,
      partName: part.name,
      unit: part.unit,
      location: part.location,
      checkDate: new Date().toISOString(),
      systemStock,
      actualStock: params.actualStock,
      difference,
      performedBy: params.performedBy,
      note: params.note || '',
      status: 'COMPLETED',
    };

    // Save stock check record
    const checks = this.getStockCheckRecords();
    checks.unshift(checkRecord);
    localStorage.setItem(STOCK_CHECKS_KEY, JSON.stringify(checks));

    let adjustmentTx: Transaction | undefined;

    // If difference != 0, create an adjustment transaction to sync stock
    if (difference !== 0) {
      const isIncrease = difference > 0;
      const absDiff = Math.abs(difference);

      this.updatePart(part.id, { currentStock: params.actualStock });

      adjustmentTx = {
        id: 'tx-audit-' + Date.now(),
        partId: part.id,
        partCode: part.code,
        partName: part.name,
        unit: part.unit,
        type: 'AUDIT_ADJUSTMENT',
        quantity: absDiff,
        date: new Date().toISOString(),
        person: params.performedBy,
        reasonOrPurpose: `Cân đối kiểm kê kho (${isIncrease ? 'Cộng' : 'Trừ'} ${absDiff} ${part.unit})`,
        notes: params.note || `Điều chỉnh từ ${systemStock} sang ${params.actualStock}`,
        stockBefore: systemStock,
        stockAfter: params.actualStock,
      };

      const txs = this.getTransactions();
      txs.push(adjustmentTx);
      this.saveTransactions(txs);
    }

    return { checkRecord, adjustmentTx };
  },

  getStockCheckRecords(): StockCheckRecord[] {
    const raw = localStorage.getItem(STOCK_CHECKS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  // Reset to sample data
  resetToSampleData(): void {
    localStorage.setItem(PARTS_KEY, JSON.stringify(initialParts));
    localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(initialTransactions));
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(initialSettings));
    localStorage.removeItem(STOCK_CHECKS_KEY);
    localStorage.removeItem(CONTAINER_BATCHES_KEY);
    localStorage.removeItem(USED_QR_TOKENS_KEY);
  },

  // Import Excel helper according to custom layout (Warehouse, Item, Item description, Stock, Description, Unit)
  importPartsFromRows(rawRows: any[]): { added: number; updated: number } {
    const existingParts = this.getParts();
    let added = 0;
    let updated = 0;

    const parseStock = (val: any): number => {
      if (val === undefined || val === null || val === '') return 0;
      if (typeof val === 'number') return isNaN(val) ? 0 : val;
      let s = String(val).trim();
      if (!s) return 0;
      if (s.includes(',') && s.includes('.')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else if (s.includes(',')) {
        s = s.replace(',', '.');
      }
      const parsed = parseFloat(s);
      return isNaN(parsed) ? 0 : parsed;
    };

    rawRows.forEach((row) => {
      let warehouse = '';
      let itemCode = '';
      let itemName = '';
      let stockVal: any = 0;
      let desc = '';
      let unit = '';

      if (Array.isArray(row)) {
        // Array representation (Column index 0..5)
        warehouse = String(row[0] ?? '').trim();
        itemCode = String(row[1] ?? '').trim();
        itemName = String(row[2] ?? '').trim();
        stockVal = row[3];
        desc = String(row[4] ?? '').trim();
        unit = String(row[5] ?? '').trim();
      } else if (typeof row === 'object' && row !== null) {
        // Named keys representation
        warehouse = String(
          row['Warehouse'] || row['Warehouse nào'] || row['Kho'] || row['Vị Trí Lưu'] || row['Location'] || ''
        ).trim();

        itemCode = String(
          row['Item'] || row['Mã linh kiện'] || row['Mã Linh Kiện'] || row['Code'] || row['Mã'] || ''
        ).trim();

        itemName = String(
          row['Item description'] || row['Item Description'] || row['Tên linh kiện'] || row['Tên Linh Kiện'] || row['Name'] || row['Tên'] || ''
        ).trim();

        stockVal = row['Stock'] ?? row['Tồn kho'] ?? row['Tồn Kho'] ?? row['Tồn Hiện Tại'] ?? row['Tồn'] ?? 0;

        desc = String(
          row['Description'] || row['Mô tả'] || row['Mô Tả'] || row['Phân loại'] || ''
        ).trim();

        unit = String(
          row['Unit'] || row['Đơn vị tính'] || row['Đơn Vị'] || row['ĐVT'] || ''
        ).trim();
      }

      // Ignore header row or rows without item code or name
      if (!itemCode || !itemName) return;
      const lowerCode = itemCode.toLowerCase();
      if (lowerCode === 'item' || lowerCode === 'mã linh kiện' || lowerCode === 'code') return;

      const currentStock = parseStock(stockVal);
      const locationStr = warehouse || 'Kho 1';
      const unitStr = unit || 'Cái';

      const existingIndex = existingParts.findIndex(
        (p) => p.code.trim().toLowerCase() === lowerCode
      );

      if (existingIndex !== -1) {
        // Update existing part stock & info
        existingParts[existingIndex] = {
          ...existingParts[existingIndex],
          code: itemCode,
          name: itemName,
          description: desc || existingParts[existingIndex].description,
          location: locationStr,
          unit: unitStr,
          currentStock: currentStock,
          updatedAt: new Date().toISOString(),
        };
        updated++;
      } else {
        // Add new part
        const newPart: Part = {
          id: 'part-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
          code: itemCode,
          name: itemName,
          description: desc,
          location: locationStr,
          unit: unitStr,
          currentStock: currentStock,
          minStock: 10,
          barcode: itemCode,
          qrCode: itemCode,
          note: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        existingParts.unshift(newPart);
        added++;
      }
    });

    this.saveParts(existingParts);
    return { added, updated };
  },

  downloadImportTemplate(): void {
    const templateData = [
      {
        Warehouse: '2BVL',
        Item: '01-16-09-SHD8627-0005',
        'Item description': 'Vít nhọn 4x16, Inox, mũ D8',
        Stock: '69451,00',
        Description: 'LR-Linh kiện Máy lọc nước',
        Unit: 'Cái',
      },
      {
        Warehouse: '2BVL',
        Item: '01-16-09-SHD8627-0012',
        'Item description': 'Vít bulong M4x8, vàng(trắng), mũ D6.5 + đệm vênh, phẳng',
        Stock: '0,00',
        Description: 'LR-Linh kiện Nồi cơm điện',
        Unit: 'Cái',
      },
      {
        Warehouse: '2BVL',
        Item: '01-55-06-00-0001',
        'Item description': 'Tem bảo hành',
        Stock: '6734,00',
        Description: 'LR-Linh kiện chung',
        Unit: 'Cái',
      },
      {
        Warehouse: '2BVL',
        Item: '02-33-01-APB3551-0000',
        'Item description': 'Mặt kính in APB3551',
        Stock: '4,00',
        Description: 'LR-Linh kiện Bếp gas',
        Unit: 'Cái',
      },
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    ws['!cols'] = [
      { wch: 15 }, // Warehouse
      { wch: 25 }, // Item
      { wch: 45 }, // Item description
      { wch: 15 }, // Stock
      { wch: 30 }, // Description
      { wch: 12 }, // Unit
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'MauImportLinhKien');
    XLSX.writeFile(wb, 'mau_import_linh_kien_excel.xlsx');
  },

  // Backup & Restore
  backupData(): string {
    const backupObj = {
      version: '1.0',
      timestamp: new Date().toISOString(),
      settings: this.getSettings(),
      parts: this.getParts(),
      transactions: this.getTransactions(),
      stockChecks: this.getStockCheckRecords(),
    };
    return JSON.stringify(backupObj, null, 2);
  },

  restoreData(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.parts && Array.isArray(data.parts)) {
        localStorage.setItem(PARTS_KEY, JSON.stringify(data.parts));
      }
      if (data.transactions && Array.isArray(data.transactions)) {
        localStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(data.transactions));
      }
      if (data.settings) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(data.settings));
      }
      if (data.stockChecks && Array.isArray(data.stockChecks)) {
        localStorage.setItem(STOCK_CHECKS_KEY, JSON.stringify(data.stockChecks));
      }
      return true;
    } catch (e) {
      console.error('Lỗi khi restore dữ liệu:', e);
      return false;
    }
  },

  // Excel Utilities
  exportPartsToExcel(parts: Part[], fileName = 'danh_sach_linh_kien.xlsx'): void {
    const excelData = parts.map((p, index) => ({
      'STT': index + 1,
      'Mã Linh Kiện': p.code,
      'Tên Linh Kiện': p.name,
      'Vị Trí Lưu': p.location,
      'Đơn Vị': p.unit,
      'Tồn Hiện Tại': p.currentStock,
      'Tồn Tối Thiểu': p.minStock,
      'Trạng Thái':
        p.currentStock === 0
          ? 'Hết hàng'
          : p.currentStock <= p.minStock
          ? 'Sắp hết'
          : 'An toàn',
      'Mô Tả': p.description || '',
      'Mã Vạch Barcode': p.barcode || '',
      'Ghi Chú': p.note || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Linh Kiện');

    // Auto col width
    const colWidths = [
      { wch: 5 },
      { wch: 20 },
      { wch: 35 },
      { wch: 18 },
      { wch: 10 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
      { wch: 30 },
      { wch: 15 },
      { wch: 25 },
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, fileName);
  },

  exportBinCardToExcel(part: Part, transactions: Transaction[], fileName?: string): void {
    const settings = this.getSettings();
    const cleanFileName = fileName || `the_kho_${part.code}.xlsx`;

    const binCardData = transactions.map((t) => {
      const dateFormatted = new Date(t.date).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });

      return {
        'Ngày tháng': dateFormatted,
        'Diễn giải / Nội dung': t.reasonOrPurpose || (t.type === 'IN' ? 'Nhập kho' : 'Xuất kho'),
        'Nhập': t.type === 'IN' ? t.quantity : '',
        'Xuất': t.type === 'OUT' ? t.quantity : '',
        'Tồn cuối': t.stockAfter,
        'Người thực hiện': t.person || '',
        'Lệnh sản xuất': t.productionOrder || '',
        'Ghi chú': t.notes || '',
      };
    });

    // Create sheet with title AOA first
    const ws = XLSX.utils.aoa_to_sheet([
      [settings.companyName.toUpperCase()],
      [settings.warehouseName],
      ['THẺ KHO ĐIỆN TỬ'],
      [`Mã linh kiện: ${part.code} | Tên: ${part.name}`],
      [`Vị trí: ${part.location} | Đơn vị: ${part.unit} | Tồn hiện tại: ${part.currentStock}`],
      [],
    ]);

    // Append json data starting at A7
    XLSX.utils.sheet_add_json(ws, binCardData, { origin: 'A7' });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Thẻ Kho');
    XLSX.writeFile(wb, cleanFileName);
  },

  // Container Batches (History of QR codes generated from Excel)
  getContainerBatches(): ContainerBatch[] {
    const raw = localStorage.getItem(CONTAINER_BATCHES_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveContainerBatch(batch: ContainerBatch): void {
    const batches = this.getContainerBatches();
    // Replace if batch with same contNumber exists or add to front
    const existingIndex = batches.findIndex((b) => b.contNumber.trim().toLowerCase() === batch.contNumber.trim().toLowerCase());
    if (existingIndex !== -1) {
      batches[existingIndex] = batch;
    } else {
      batches.unshift(batch);
    }
    localStorage.setItem(CONTAINER_BATCHES_KEY, JSON.stringify(batches));
  },

  deleteContainerBatch(id: string): void {
    const batches = this.getContainerBatches().filter((b) => b.id !== id);
    localStorage.setItem(CONTAINER_BATCHES_KEY, JSON.stringify(batches));
  },

  // Model BOMs
  getModelBOMs(): ModelBOM[] {
    const raw = localStorage.getItem(MODEL_BOMS_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveModelBOM(bom: ModelBOM): void {
    const boms = this.getModelBOMs();
    const index = boms.findIndex(b => b.name.toLowerCase() === bom.name.toLowerCase());
    if (index !== -1) {
      boms[index] = bom;
    } else {
      boms.unshift(bom);
    }
    localStorage.setItem(MODEL_BOMS_KEY, JSON.stringify(boms));
  },

  deleteModelBOM(id: string): void {
    const boms = this.getModelBOMs().filter(b => b.id !== id);
    localStorage.setItem(MODEL_BOMS_KEY, JSON.stringify(boms));
  },

  importModelBOMFromRows(rawRows: any[], modelName: string): { added: number; name: string } {
    const items: ModelBOMItem[] = [];
    const validPartCodes = new Set(this.getParts().map(p => p.code.toLowerCase()));

    rawRows.forEach(row => {
      let itemCode = '';
      let itemName = '';
      let quantityVal: any = 0;
      let unit = '';

      if (Array.isArray(row)) {
        itemCode = String(row[0] ?? '').trim();
        itemName = String(row[1] ?? '').trim();
        quantityVal = row[2];
        unit = String(row[3] ?? '').trim();
      } else if (typeof row === 'object' && row !== null) {
        itemCode = String(row['Item'] || row['Mã linh kiện'] || row['Code'] || '').trim();
        itemName = String(row['Description'] || row['Tên linh kiện'] || row['Name'] || '').trim();
        quantityVal = row['Quantity'] ?? row['Số lượng'] ?? row['Định mức'] ?? 0;
        unit = String(row['Unit'] || row['Đơn vị'] || row['ĐVT'] || '').trim();
      }

      if (!itemCode || !itemName) return;
      if (itemCode.toLowerCase() === 'item') return;

      // Only import items that exist in our valid parts list
      if (!validPartCodes.has(itemCode.toLowerCase())) return;

      let quantity = 0;
      if (typeof quantityVal === 'number') {
        quantity = quantityVal;
      } else {
        let s = String(quantityVal).trim();
        if (s.includes(',') && s.includes('.')) {
          s = s.replace(/\./g, '').replace(',', '.');
        } else if (s.includes(',')) {
          s = s.replace(',', '.');
        }
        quantity = parseFloat(s) || 0;
      }

      if (quantity > 0) {
        items.push({
          partCode: itemCode,
          partName: itemName,
          quantity,
          unit: unit || 'Cái'
        });
      }
    });

    if (items.length > 0) {
      const bom: ModelBOM = {
        id: 'bom-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        name: modelName,
        items,
        createdAt: new Date().toISOString()
      };
      this.saveModelBOM(bom);
      return { added: items.length, name: modelName };
    }
    return { added: 0, name: modelName };
  },

  // Used QR Tokens (To prevent scanning the same Cont QR tag twice)
  getUsedQrTokens(): Record<string, { scannedAt: string; scannedBy?: string; partCode: string; quantity: number; contNumber: string }> {
    const raw = localStorage.getItem(USED_QR_TOKENS_KEY);
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  },

  isQrTokenUsed(tokenOrPayload: string): { isUsed: boolean; scannedAt?: string; scannedBy?: string; partCode?: string; quantity?: number; contNumber?: string } {
    if (!tokenOrPayload) return { isUsed: false };
    const tokens = this.getUsedQrTokens();
    
    // Check direct token / tagId key
    if (tokens[tokenOrPayload]) {
      const info = tokens[tokenOrPayload];
      return {
        isUsed: true,
        scannedAt: info.scannedAt,
        scannedBy: info.scannedBy,
        partCode: info.partCode,
        quantity: info.quantity,
        contNumber: info.contNumber,
      };
    }

    // Also check if raw payload string matches
    const keyStr = tokenOrPayload.trim();
    if (tokens[keyStr]) {
      const info = tokens[keyStr];
      return {
        isUsed: true,
        scannedAt: info.scannedAt,
        scannedBy: info.scannedBy,
        partCode: info.partCode,
        quantity: info.quantity,
        contNumber: info.contNumber,
      };
    }

    return { isUsed: false };
  },

  markQrTokenAsUsed(tokenOrPayload: string, details: { partCode: string; quantity: number; contNumber: string; person?: string }): void {
    if (!tokenOrPayload) return;
    const tokens = this.getUsedQrTokens();
    const nowStr = new Date().toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const info = {
      scannedAt: nowStr,
      scannedBy: details.person || 'Thủ kho',
      partCode: details.partCode,
      quantity: details.quantity,
      contNumber: details.contNumber,
    };

    tokens[tokenOrPayload] = info;

    // If payload contains pipe e.g. CONT_IN|LK01|1000|CONT123|TAG123|16/07/2026, also mark TAG123
    if (tokenOrPayload.includes('|')) {
      const parts = tokenOrPayload.split('|');
      if (parts[4]) {
        tokens[parts[4]] = info; // Mark tagId
      }
    }

    localStorage.setItem(USED_QR_TOKENS_KEY, JSON.stringify(tokens));
  },

  // FIFO Lot / Cont Batch Calculation
  getPartFifoLots(partId: string): FifoLot[] {
    const part = this.getPartById(partId);
    if (!part) return [];

    const txs = this.getTransactions().filter((t) => t.partId === partId);
    const inTxs = txs.filter((t) => t.type === 'IN').sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const outTxs = txs.filter((t) => t.type === 'OUT');

    const totalInQty = inTxs.reduce((sum, t) => sum + t.quantity, 0);
    const totalOutQty = outTxs.reduce((sum, t) => sum + t.quantity, 0);

    const rawLots: { id: string; contNumber: string; importDate: string; originalQty: number; notes?: string }[] = [];

    // 1. Initial baseline stock lot (Lô Tồn Khởi Tạo #1)
    const initialBaselineQty = part.currentStock + totalOutQty - totalInQty;
    if (initialBaselineQty > 0) {
      rawLots.push({
        id: `init-lot-${part.id}`,
        contNumber: 'Lô Tồn Khởi Tạo (Lô #1)',
        importDate: part.createdAt || '2026-01-01T00:00:00.000Z',
        originalQty: initialBaselineQty,
        notes: 'Dữ liệu tồn kho ban đầu',
      });
    }

    // 2. Add actual IN transactions (e.g. Scanned Cont QR or Stock In) as subsequent lots
    inTxs.forEach((tx) => {
      let contNum = '';
      if (tx.reasonOrPurpose) {
        const match = tx.reasonOrPurpose.match(/Cont\s*([\w\d-]+)/i);
        if (match) contNum = match[1];
      }
      if (!contNum && tx.notes) {
        const match = tx.notes.match(/Cont\s*([\w\d-]+)/i);
        if (match) contNum = match[1];
      }

      const displayCont = contNum ? `Cont ${contNum}` : (tx.reasonOrPurpose || 'Lô Nhập Kho');
      rawLots.push({
        id: `tx-in-${tx.id}`,
        contNumber: displayCont,
        importDate: tx.date,
        originalQty: tx.quantity,
        notes: tx.notes || tx.reasonOrPurpose,
      });
    });

    // Fallback if rawLots is somehow empty but part has currentStock
    if (rawLots.length === 0 && part.currentStock > 0) {
      rawLots.push({
        id: `init-lot-${part.id}`,
        contNumber: 'Lô Tồn Khởi Tạo (Lô #1)',
        importDate: part.createdAt || new Date().toISOString(),
        originalQty: part.currentStock + totalOutQty,
        notes: 'Dữ liệu tồn kho ban đầu',
      });
    }

    // Sort raw lots chronologically (Oldest first for FIFO)
    rawLots.sort((a, b) => new Date(a.importDate).getTime() - new Date(b.importDate).getTime());

    // Deduct totalOutQty sequentially using FIFO
    let remainingOutDeduction = totalOutQty;
    let foundFirstActive = false;

    const fifoLots: FifoLot[] = rawLots.map((lot) => {
      let consumed = 0;
      let remaining = lot.originalQty;

      if (remainingOutDeduction >= lot.originalQty) {
        consumed = lot.originalQty;
        remaining = 0;
        remainingOutDeduction -= lot.originalQty;
      } else if (remainingOutDeduction > 0) {
        consumed = remainingOutDeduction;
        remaining = lot.originalQty - remainingOutDeduction;
        remainingOutDeduction = 0;
      }

      let status: 'FIFO_NEXT' | 'WAITING' | 'DEPLETED' = 'DEPLETED';
      if (remaining > 0) {
        if (!foundFirstActive) {
          status = 'FIFO_NEXT';
          foundFirstActive = true;
        } else {
          status = 'WAITING';
        }
      }

      return {
        id: lot.id,
        partId: part.id,
        partCode: part.code,
        contNumber: lot.contNumber,
        importDate: lot.importDate,
        originalQty: lot.originalQty,
        consumedQty: consumed,
        remainingQty: remaining,
        status,
        notes: lot.notes,
      };
    });

    return fifoLots;
  },
};


