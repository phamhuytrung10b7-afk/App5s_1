export type TransactionType = 'IN' | 'OUT' | 'AUDIT_ADJUSTMENT';

export interface PartLocationStock {
  locationName: string; // e.g. "Kệ A1"
  quantity: number;     // e.g. 2000
}

export interface Part {
  id: string;
  code: string; // Mã linh kiện (e.g. LK-RES-10K)
  name: string; // Tên linh kiện
  description: string; // Mô tả
  imageUrl?: string; // Ảnh linh kiện
  location: string; // Vị trí lưu tổng hợp (e.g. Kệ A1 (2000), Kệ A2 (1647))
  locations?: PartLocationStock[]; // Chi tiết phân bổ tồn kho theo từng kệ
  unit: string; // Đơn vị (e.g. Cái, Bộ, Cuộn, Con, Kg...)
  currentStock: number; // Tổng tồn hiện tại
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
  locationId?: string; // Nơi lưu trữ thực tế
  productionOrder?: string; // Lệnh sản xuất (e.g. LSX-2026-088)
  reasonOrPurpose?: string; // Lý do nhập / Mục đích xuất
  notes?: string; // Ghi chú
  stockBefore: number; // Tồn trước giao dịch
  stockAfter: number; // Tồn cuối sau giao dịch
}

export interface WarehouseLocation {
  id: string;
  name: string; // e.g. A1, B2
  description?: string;
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
  assemblyLines?: string[]; // Danh sách Dây Chuyền / Bàn Máy Yêu Cầu Cấp Hàng (Vị trí nhận hàng)
  locations: WarehouseLocation[];
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
  | 'kitting'
  | 'buffer'
  | 'andon'
  | 'bin_card'
  | 'warehouse_map'
  | 'reports'
  | 'settings';

export interface KittingQueueItem {
  id: string;
  transactionId: string; // liên kết phiếu Xuất Kho thô gốc
  partCode: string;
  partName: string;
  unit: string;
  rawQuantity: number; // SL xuất thô carton
  kittedQuantity: number; // SL thực tế bóc đóng thùng xanh
  scrapQuantity: number; // SL phế phẩm/hỏng do móp vỡ thùng thô
  bufferLocation: string; // Mã kệ OUTBUFFER, ví dụ: BUFFER-A1-02
  status: 'PENDING_KITTING' | 'IN_BUFFER' | 'DELIVERED';
  startTime?: string;
  endTime?: string;
  durationMinutes?: number; // Thời gian bóc tách
  operatorName?: string; // Tên nhân viên bóc tách
  kittingProductivity?: number; // PCS/Giờ = kittedQuantity / (durationMinutes / 60)
  createdAt: string;
}

export interface BufferLocationMap {
  locationId: string; // e.g. BUFFER-A1-01
  description?: string; // Mô tả vị trí kệ (e.g. Khoang 01 - Tầng 1 - Vị trí 1)
  partCode?: string;
  partName?: string;
  unit?: string;
  currentStockQty: number;
  containerStandardQty: number; // Quy cách thùng xanh (e.g. 50 cái/thùng)
  status: 'EMPTY' | 'READY' | 'CALL_PENDING';
  lastUpdated: string; // Dùng kiểm soát FIFO tại Buffer
}

export interface MaterialCallRequest {
  requestId: string;
  assemblyLine: string; // Dây chuyền/Bàn máy gọi
  partCode: string;
  partName: string;
  unit: string;
  requestedQty: number;
  bufferLocation: string; // Kệ Buffer lấy hàng hoặc "KHU BÓC TÁCH KITTING"
  isDirectKitting?: boolean; // Tín hiệu Bóc tách & Giao thẳng (Cross-docking)
  requestedBy: string;
  requestedAt: string;
  status: 'CALLING' | 'DELIVERING' | 'COMPLETED';
  deliveredBy?: string;
  deliveredAt?: string;
}

export interface ContainerQrTag {
  id: string; // Token ID e.g. "TAG-GAOU7800407-LK001-xxxx"
  partCode: string;
  partName: string;
  unit: string;
  quantity: number;
  contNumber: string;
  contDate: string;
  supplier?: string; // Nhà cung cấp
  mfgDate?: string; // Ngày sản xuất
  qrPayload: string; // CONT_IN|MãVT|SL|MãCont|TagID|NgàyCont|Supplier|MfgDate
  printCopies: number;
  isUsed?: boolean;
  importedQuantity?: number;
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
  contNumber: string; // Số Cont hoặc tên ghi chú Cont
  locationName?: string; // Tên Kệ / Vị trí nhập kho (e.g. Kệ A1)
  importDate: string; // Ngày nhập kho
  originalQty: number; // Số lượng nhập ban đầu
  consumedQty: number; // Số lượng đã xuất
  remainingQty: number; // Số lượng còn tồn hiện tại trong mốc này
  status: 'FIFO_NEXT' | 'WAITING' | 'DEPLETED'; // FIFO_NEXT = Ưu tiên xuất trước #1
  notes?: string;
  isInitialBaseline?: boolean; // Đánh dấu lô tồn khởi tạo ban đầu
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
  actualStock?: number;
  discrepancy: number;
  reason?: string;
  checkDate: string;
  checkedBy: string;
  systemStock?: number;
  difference?: number;
  performedBy?: string;
  status?: string;
  note?: string;
}
