
import { Product, SerialUnit, UnitStatus, Transaction, Warehouse, Customer, ProductionPlan, SalesOrder, SalesOrderItem } from './types';

const STORAGE_KEY = 'RO_MASTER_PRO_DATABASE_V2';

class InventoryService {
  private products: Product[] = [];
  private units: SerialUnit[] = [];
  private transactions: Transaction[] = [];
  private warehouses: Warehouse[] = [];
  private customers: Customer[] = [];
  private productionPlans: ProductionPlan[] = []; 
  private salesOrders: SalesOrder[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    const savedData = localStorage.getItem(STORAGE_KEY);
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        this.products = parsed.products || [];
        this.units = parsed.units || [];
        this.transactions = parsed.transactions || [];
        this.warehouses = parsed.warehouses || [];
        this.customers = parsed.customers || [];
        this.productionPlans = parsed.productionPlans || [];
        this.salesOrders = parsed.salesOrders || [];
        return;
      } catch (e) {
        console.error("Lỗi đọc dữ liệu lưu trữ:", e);
      }
    }
    // Dữ liệu mặc định nếu kho trống
    this.products = [];
    this.units = [];
    this.transactions = [];
    this.warehouses = [{ id: 'wh-default', name: 'Kho Tổng', address: 'Trụ sở chính' }];
    this.customers = [];
    this.productionPlans = [];
    this.salesOrders = [];
    this.persist();
  }

  private persist() {
    const data = {
      products: this.products,
      units: this.units,
      transactions: this.transactions,
      warehouses: this.warehouses,
      customers: this.customers,
      productionPlans: this.productionPlans,
      salesOrders: this.salesOrders
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  resetDatabase() {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }

  // GETTERS
  getProducts() { return this.products; }
  getUnits() { return this.units; }
  getTransactions() { return this.transactions; }
  getWarehouses() { return this.warehouses; }
  getCustomers() { return this.customers; }
  getProductionPlans() { return this.productionPlans; }
  getSalesOrders() { return this.salesOrders; }
  
  getProductById(id: string) { return this.products.find(p => p.id === id); }
  getUnitBySerial(serial: string) { return this.units.find(u => u.serialNumber === serial); }
  
  getSerialHistory(serial: string) {
    return this.transactions.filter(t => t.serialNumbers.includes(serial))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  getHistoryByDateRange(types: string[], startStr: string, endStr: string): Transaction[] {
    const start = startStr ? new Date(startStr).setHours(0,0,0,0) : 0;
    const end = endStr ? new Date(endStr).setHours(23,59,59,999) : 9999999999999;
    return this.transactions
      .filter(t => types.includes(t.type) && new Date(t.date).getTime() >= start && new Date(t.date).getTime() <= end)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  // PRODUCT ACTIONS
  addProduct(p: Product) { this.products = [...this.products, p]; this.persist(); }
  updateProduct(id: string, updates: Partial<Product>) {
    this.products = this.products.map(p => p.id === id ? { ...p, ...updates } : p);
    this.persist();
  }
  deleteProduct(id: string) {
    if (this.units.some(u => u.productId === id)) throw new Error("Model này đã có dữ liệu IMEI, không thể xóa.");
    this.products = this.products.filter(p => p.id !== id);
    this.persist();
  }
  
  // WAREHOUSE ACTIONS
  addWarehouse(wh: Warehouse) { this.warehouses = [...this.warehouses, wh]; this.persist(); }
  updateWarehouse(id: string, updates: Partial<Warehouse>) {
    this.warehouses = this.warehouses.map(w => w.id === id ? { ...w, ...updates } : w);
    this.persist();
  }
  deleteWarehouse(id: string) {
    const wh = this.warehouses.find(w => w.id === id);
    if (wh && this.units.some(u => u.warehouseLocation === wh.name && u.status === UnitStatus.NEW)) {
      throw new Error("Kho này vẫn còn máy tồn kho.");
    }
    this.warehouses = this.warehouses.filter(w => w.id !== id);
    this.persist();
  }

  // CUSTOMER ACTIONS
  addCustomer(c: Customer) { this.customers = [...this.customers, c]; this.persist(); }
  updateCustomer(id: string, updates: Partial<Customer>) {
    this.customers = this.customers.map(c => c.id === id ? { ...c, ...updates } : c);
    this.persist();
  }
  deleteCustomer(id: string) { this.customers = this.customers.filter(c => c.id !== id); this.persist(); }

  // PRODUCTION PLAN ACTIONS
  addProductionPlan(name: string, productId: string, serials: string[]) {
    const plan = { id: `plan-${Date.now()}`, name, productId, createdDate: new Date().toISOString(), serials };
    this.productionPlans = [plan, ...this.productionPlans];
    this.persist();
    return plan;
  }
  updateProductionPlan(id: string, name: string, productId: string, serials: string[]) {
    this.productionPlans = this.productionPlans.map(p => p.id === id ? { ...p, name, productId, serials } : p);
    this.persist();
  }
  deleteProductionPlan(id: string) { this.productionPlans = this.productionPlans.filter(p => p.id !== id); this.persist(); }

  // SALES ORDER ACTIONS
  addSalesOrder(code: string, targetName: string, items: SalesOrderItem[], type: 'SALE' | 'TRANSFER', destination?: string) {
    const order: SalesOrder = {
      id: `so-${Date.now()}`,
      code,
      type,
      status: 'PENDING',
      customerName: type === 'SALE' ? targetName : undefined,
      destinationWarehouse: type === 'TRANSFER' ? destination : undefined,
      createdDate: new Date().toISOString(),
      items: items.map(i => ({ ...i, scannedCount: 0 }))
    };
    this.salesOrders = [order, ...this.salesOrders];
    this.persist();
    return order;
  }
  deleteSalesOrder(id: string) { this.salesOrders = this.salesOrders.filter(o => o.id !== id); this.persist(); }

  // CORE OPERATIONS
  importUnits(productId: string, serials: string[], location: string, planName?: string) {
    const updatedUnits = [...this.units];
    let isReimportSession = false;

    serials.forEach(s => {
      const idx = updatedUnits.findIndex(u => u.serialNumber === s);
      if (idx !== -1) {
        if (updatedUnits[idx].status === UnitStatus.NEW) throw new Error(`Mã ${s} đang tồn kho.`);
        updatedUnits[idx] = { ...updatedUnits[idx], status: UnitStatus.NEW, warehouseLocation: location, importDate: new Date().toISOString(), isReimported: true };
        isReimportSession = true;
      } else {
        updatedUnits.push({ serialNumber: s, productId, status: UnitStatus.NEW, warehouseLocation: location, importDate: new Date().toISOString(), isReimported: false });
      }
    });

    this.units = updatedUnits;
    const tx: Transaction = { id: `tx-in-${Date.now()}`, type: 'INBOUND', date: new Date().toISOString(), productId, quantity: serials.length, serialNumbers: serials, toLocation: location, isReimportTx: isReimportSession, planName };
    this.transactions = [tx, ...this.transactions];
    this.persist();
    return tx;
  }

  transferUnits(productId: string, serials: string[], toLoc: string) {
    this.units = this.units.map(u => serials.includes(u.serialNumber) ? { ...u, warehouseLocation: toLoc } : u);
    const tx: Transaction = { id: `tx-tr-${Date.now()}`, type: 'TRANSFER', date: new Date().toISOString(), productId, quantity: serials.length, serialNumbers: serials, toLocation: toLoc };
    this.transactions = [tx, ...this.transactions];
    this.persist();
    return tx;
  }

  exportUnits(productId: string, serials: string[], customer: string) {
    this.units = this.units.map(u => serials.includes(u.serialNumber) ? { ...u, status: UnitStatus.SOLD, exportDate: new Date().toISOString(), customerName: customer, warehouseLocation: 'OUT' } : u);
    const tx: Transaction = { id: `tx-out-${Date.now()}`, type: 'OUTBOUND', date: new Date().toISOString(), productId, quantity: serials.length, serialNumbers: serials, customer };
    this.transactions = [tx, ...this.transactions];
    this.persist();
    return tx;
  }

  checkSerialImported(s: string) { return this.units.some(u => u.serialNumber === s); }
}

export const inventoryService = new InventoryService();
