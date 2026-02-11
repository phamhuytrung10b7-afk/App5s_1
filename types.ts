
export enum UnitStatus {
  NEW = 'NEW',
  SOLD = 'SOLD',
  WARRANTY = 'WARRANTY',
  EXHIBITION = 'EXHIBITION'
}

export interface Product {
  id: string;
  model: string;
  brand: string;
  specs: string; // e.g., "9 Levels", "10 Levels"
}

export interface Warehouse {
  id: string;
  name: string;
  address?: string;
}

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  type: 'DEALER' | 'RETAIL'; // Đại lý hoặc Khách lẻ
}

export interface SerialUnit {
  serialNumber: string;
  productId: string;
  status: UnitStatus;
  warehouseLocation: string; // Current location name
  importDate: string;
  exportDate?: string;
  customerName?: string;
  isReimported?: boolean; // Đánh dấu đã từng tái nhập
}

export interface Transaction {
  id: string;
  type: 'INBOUND' | 'OUTBOUND' | 'TRANSFER';
  date: string;
  productId: string;
  quantity: number;
  serialNumbers: string[];
  toLocation?: string; // For transfers
  customer?: string;   // For outbound sales
  isReimportTx?: boolean; // Đánh dấu giao dịch tái nhập
  planName?: string;    // Tên lô / Kế hoạch sản xuất (Dùng cho Inbound)
}

export interface InventoryStats {
  totalUnits: number;
  lowStockModels: string[];
  recentTransactions: Transaction[];
}

export interface ProductionPlan {
  id: string;
  name: string; // Tên lô / Kế hoạch (VD: SX Tháng 10/2024)
  productId: string; // Model áp dụng
  createdDate: string;
  serials: string[]; // Danh sách serial ban hành
}

export interface SalesOrderItem {
  productId: string;
  quantity: number;
  scannedCount: number;
}

export interface SalesOrder {
  id: string;
  code: string;
  type: 'SALE' | 'TRANSFER';
  status: 'PENDING' | 'COMPLETED';
  customerName?: string;
  destinationWarehouse?: string;
  createdDate: string;
  items: SalesOrderItem[];
}
