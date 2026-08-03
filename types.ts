export type TransactionType = 'IN' | 'OUT' | 'AUDIT_ADJUSTMENT';

export interface Part {
  id: string;
  code: string; // Mã linh kiện (e.g. LK-RES-10K)
  name: string; // Tên linh kiện
  description: string; // Mô tả
  imageUrl?: string; // Ảnh linh kiện
  location: string; // Vị trí lưu (e.g. Kệ A1-02, Khay 3)
  unit: string; // Đơn vị (e.g. Cái, Bộ, Cuộn, Con, Kg...)
  currentStock: number; // Tồn hiện tại
  minStock: number; // Tồn tối thiểu
  barcode: string; // Mã vạch
  qrCode: string; // Mã QR
  note?: string; // Ghi chú
  createdAt: string; // ISO Date
  updatedAt: string; // ISO Date
}

export interface Transaction {
  id: string;
  partId: string;
  partCode: string;
  partName: string;
  unit: string;
  type: TransactionType;
  quantity: number;
  date: string; // YYYY-MM-DD or ISO string
  person: string; // Người thực hiện (Người nhập hoặc Người lấy)
  productionOrder?: string; // Lệnh sản xuất (e.g. LSX-2026-088)
  reasonOrPurpose?: string; // Lý do nhập / Mục đích xuất
  notes?: string; // Ghi chú
  stockBefore: number; // Tồn trước giao dịch
  stockAfter: number; // Tồn cuối sau giao dịch
}

export interface AppSettings {
  companyName: string;
  warehouseName: string;
  address: string;
  managerName: string;
  phone: string;
  staffList: string[]; // Danh sách người thực hiện (Thủ kho / Kỹ thuật)
  stockInReasons: string[]; // Danh sách lý do nhập kho
  stockOutPurposes: string[]; // Danh sách mục đích xuất kho
  productionOrders: string[]; // Danh sách mã lệnh sản xuất (LSX)
}

export interface ModelBOMItem {
  partCode: string;
  partName: string;
  quantity: number;
  unit: string;
}

export interface ModelBOM {
  id: string;
  name: string; // Model name / Lệnh sản xuất
  items: ModelBOMItem[];
  createdAt: string;
}

export type ViewTab =
  | 'dashboard'
  | 'parts'
  | 'stock_in'
  | 'stock_out'
  | 'bin_card'
  | 'reports'
  | 'settings';

export interface ContainerQrTag {
  id: string; // Token ID e.g. "TAG-GAOU7800407-LK001-xxxx"
  partCode: string;
  partName: string;
  unit: string;
  quantity: number;
  contNumber: string;
  contDate: string;
  qrPayload: string; // CONT_IN|MãVT|SL|MãCont|TagID|NgàyCont
  printCopies: number;
  isUsed?: boolean;
  scannedAt?: string;
  scannedBy?: string;
}

export interface ContainerBatch {
  id: string; // Batch ID e.g. "batch-1721000..."
  contNumber: string;
  contDate: string;
  createdAt: string; // ISO
  totalItems: number;
  totalQuantity: number;
  items: ContainerQrTag[];
}

export interface FifoLot {
  id: string;
  partId: string;
  partCode: string;
  partName: string;
  contNumber: string; // Số Cont hoặc tên lô nhập
  importDate: string; // Ngày nhập kho
  originalQty: number; // Số lượng nhập ban đầu
  consumedQty: number; // Số lượng đã xuất
  remainingQty: number; // Số lượng còn tồn hiện tại trong mốc này
  status: 'FIFO_NEXT' | 'WAITING' | 'DEPLETED'; // FIFO_NEXT = Ưu tiên xuất trước #1
  notes?: string;
}

export interface StockCheckRecord {
  id: string;
  partId: string;
  partCode: string;
  partName: string;
  unit: string;
  location: string;
  expectedQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  reason?: string;
  checkDate: string;
  checkedBy: string;
}
