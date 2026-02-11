
import { Product, SerialUnit, UnitStatus, Transaction, Warehouse, Customer, ProductionPlan, SalesOrder, SalesOrderItem } from './types';
import { INITIAL_PRODUCTS, INITIAL_UNITS, INITIAL_TRANSACTIONS, INITIAL_WAREHOUSES, INITIAL_CUSTOMERS } from './constants';

const STORAGE_KEYS = {
  PRODUCTS: 'RO_MASTER_PRODUCTS',
  UNITS: 'RO_MASTER_UNITS',
  TRANSACTIONS: 'RO_MASTER_TRANSACTIONS',
  WAREHOUSES: 'RO_MASTER_WAREHOUSES',
  CUSTOMERS: 'RO_MASTER_CUSTOMERS',
  PLANS: 'RO_MASTER_PLANS',
  ORDERS: 'RO_MASTER_ORDERS'
};

class InventoryService {
  private products: Product[] = [];
  private units: SerialUnit[] = [];
  private transactions: Transaction[] = [];
  private warehouses: Warehouse[] = [];
  private customers: Customer[] = [];
  private productionPlans: ProductionPlan[] = []; 
  private salesOrders: SalesOrder[] = [];

  constructor() {
    this.loadData();
  }

  // --- PERSISTENCE METHODS ---

  private loadData() {
    try {
      const storedProducts = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      const storedUnits = localStorage.getItem(STORAGE_KEYS.UNITS);
      const storedTransactions = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      const storedWarehouses = localStorage.getItem(STORAGE_KEYS.WAREHOUSES);
      const storedCustomers = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
      const storedPlans = localStorage.getItem(STORAGE_KEYS.PLANS);
      const storedOrders = localStorage.getItem(STORAGE_KEYS.ORDERS);

      this.products = storedProducts ? JSON.parse(storedProducts) : [...INITIAL_PRODUCTS];
      this.units = storedUnits ? JSON.parse(storedUnits) : [...INITIAL_UNITS];
      this.transactions = storedTransactions ? JSON.parse(storedTransactions) : [...INITIAL_TRANSACTIONS];
      this.warehouses = storedWarehouses ? JSON.parse(storedWarehouses) : [...INITIAL_WAREHOUSES];
      this.customers = storedCustomers ? JSON.parse(storedCustomers) : [...INITIAL_CUSTOMERS];
      this.productionPlans = storedPlans ? JSON.parse(storedPlans) : [];
      this.salesOrders = storedOrders ? JSON.parse(storedOrders) : [];
    } catch (e) {
      console.error("Failed to load data from storage, falling back to defaults", e);
      this.resetDatabase(false); // Fallback but don't force reload
    }
  }

  private saveData() {
    try {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(this.products));
      localStorage.setItem(STORAGE_KEYS.UNITS, JSON.stringify(this.units));
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(this.transactions));
      localStorage.setItem(STORAGE_KEYS.WAREHOUSES, JSON.stringify(this.warehouses));
      localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(this.customers));
      localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(this.productionPlans));
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(this.salesOrders));
    } catch (e) {
      console.error("Failed to save data to storage", e);
    }
  }

  // Dangerous: Hard Reset
  resetDatabase(reload = true) {
    localStorage.clear();
    this.products = [...INITIAL_PRODUCTS];
    this.units = [...INITIAL_UNITS];
    this.transactions = [...INITIAL_TRANSACTIONS];
    this.warehouses = [...INITIAL_WAREHOUSES];
    this.customers = [...INITIAL_CUSTOMERS];
    this.productionPlans = [];
    this.salesOrders = [];
    
    // Re-save defaults to storage
    this.saveData();

    if (reload) {
      window.location.reload();
    }
  }

  // --- GETTERS ---

  getProducts() { return this.products; }
  getUnits() { return this.units; }
  getTransactions() { return this.transactions; }
  getWarehouses() { return this.warehouses; }
  getCustomers() { return this.customers; }
  
  getProductById(id: string) { return this.products.find(p => p.id === id); }
  getUnitBySerial(serial: string) { return this.units.find(u => u.serialNumber === serial); }

  getSerialHistory(serial: string): Transaction[] {
    return this.transactions
      .filter(t => t.serialNumbers.includes(serial))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  // --- Production Plan Management ---
  getProductionPlans() {
    return this.productionPlans.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }

  addProductionPlan(name: string, productId: string, serials: string[]) {
    const newPlan: ProductionPlan = {
      id: `plan-${Date.now()}`,
      name,
      productId,
      createdDate: new Date().toISOString(),
      serials
    };
    this.productionPlans = [newPlan, ...this.productionPlans];
    this.saveData();
    return newPlan;
  }

  updateProductionPlan(id: string, name: string, productId: string, serials: string[]) {
    const index = this.productionPlans.findIndex(p => p.id === id);
    if (index !== -1) {
      this.productionPlans[index] = {
        ...this.productionPlans[index],
        name,
        productId,
        serials
      };
      this.saveData();
    }
  }

  deleteProductionPlan(id: string) {
    this.productionPlans = this.productionPlans.filter(p => p.id !== id);
    this.saveData();
  }

  // --- Sales Order Management ---
  getSalesOrders() {
    return this.salesOrders.sort((a, b) => new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime());
  }

  addSalesOrder(code: string, targetName: string, items: SalesOrderItem[], type: 'SALE' | 'TRANSFER', destination?: string) {
    const newOrder: SalesOrder = {
      id: `so-${Date.now()}`,
      code,
      type,
      status: 'PENDING',
      customerName: type === 'SALE' ? targetName : undefined,
      destinationWarehouse: type === 'TRANSFER' ? destination : undefined,
      createdDate: new Date().toISOString(),
      items: items.map(i => ({ ...i, scannedCount: 0 }))
    };
    this.salesOrders = [newOrder, ...this.salesOrders];
    this.saveData();
    return newOrder;
  }

  deleteSalesOrder(id: string) {
    this.salesOrders = this.salesOrders.filter(o => o.id !== id);
    this.saveData();
  }

  // --- CRUD Management Methods ---
  
  addProduct(product: Product) {
    this.products = [...this.products, product];
    this.saveData();
  }

  deleteProduct(id: string) {
    const hasInventory = this.units.some(u => u.productId === id);
    if (hasInventory) {
      throw new Error("Không thể xóa Model này vì đang có hàng tồn kho hoặc lịch sử giao dịch.");
    }
    this.products = this.products.filter(p => p.id !== id);
    this.saveData();
  }

  addWarehouse(warehouse: Warehouse) {
    this.warehouses = [...this.warehouses, warehouse];
    this.saveData();
  }

  deleteWarehouse(id: string) {
    if (this.warehouses.length <= 1) {
       throw new Error("Phải giữ lại ít nhất 1 kho trong hệ thống.");
    }
    this.warehouses = this.warehouses.filter(w => w.id !== id);
    this.saveData();
  }

  addCustomer(customer: Customer) {
    this.customers = [...this.customers, customer];
    this.saveData();
  }

  deleteCustomer(id: string) {
    this.customers = this.customers.filter(c => c.id !== id);
    this.saveData();
  }

  // --- Logic Checks ---

  checkSerialExists(serial: string): boolean {
    return this.units.some(u => u.serialNumber === serial && u.status !== UnitStatus.SOLD);
  }

  checkSerialImported(serial: string): boolean {
    return this.units.some(u => u.serialNumber === serial);
  }

  // --- Operational Methods ---

  importUnits(productId: string, serials: string[], location: string) {
    const newUnits: SerialUnit[] = serials.map(serial => ({
      serialNumber: serial,
      productId,
      status: UnitStatus.NEW,
      warehouseLocation: location,
      importDate: new Date().toISOString()
    }));

    const duplicates = newUnits.filter(nu => this.units.some(u => u.serialNumber === nu.serialNumber));
    if (duplicates.length > 0) {
      throw new Error(`Phát hiện mã Serial bị trùng: ${duplicates.map(d => d.serialNumber).join(', ')}`);
    }

    this.units = [...this.units, ...newUnits];

    const transaction: Transaction = {
      id: `tx-in-${Date.now()}`,
      type: 'INBOUND',
      date: new Date().toISOString(),
      productId,
      quantity: serials.length,
      serialNumbers: serials,
      toLocation: location
    };
    this.transactions = [transaction, ...this.transactions];
    
    this.saveData();
    return transaction;
  }

  transferUnits(productId: string, serials: string[], toLocation: string) {
    const invalidSerials = serials.filter(s => {
      const unit = this.getUnitBySerial(s);
      return !unit || unit.status === UnitStatus.SOLD || unit.productId !== productId;
    });

    if (invalidSerials.length > 0) {
      throw new Error(`Serial không hợp lệ (đã bán hoặc sai model): ${invalidSerials.join(', ')}`);
    }

    this.units = this.units.map(u => {
      if (serials.includes(u.serialNumber)) {
        return {
          ...u,
          warehouseLocation: toLocation
        };
      }
      return u;
    });

    const transaction: Transaction = {
      id: `tx-tr-${Date.now()}`,
      type: 'TRANSFER',
      date: new Date().toISOString(),
      productId,
      quantity: serials.length,
      serialNumbers: serials,
      toLocation: toLocation
    };
    this.transactions = [transaction, ...this.transactions];
    
    this.saveData();
    return transaction;
  }

  exportUnits(productId: string, serials: string[], customer: string) {
    const invalidSerials = serials.filter(s => {
      const unit = this.getUnitBySerial(s);
      return !unit || unit.status === UnitStatus.SOLD || unit.productId !== productId;
    });

    if (invalidSerials.length > 0) {
      throw new Error(`Serial không hợp lệ hoặc không có sẵn: ${invalidSerials.join(', ')}`);
    }

    this.units = this.units.map(u => {
      if (serials.includes(u.serialNumber)) {
        return {
          ...u,
          status: UnitStatus.SOLD,
          exportDate: new Date().toISOString(),
          customerName: customer,
          warehouseLocation: 'OUT'
        };
      }
      return u;
    });

    const transaction: Transaction = {
      id: `tx-out-${Date.now()}`,
      type: 'OUTBOUND',
      date: new Date().toISOString(),
      productId,
      quantity: serials.length,
      serialNumbers: serials,
      customer: customer
    };
    this.transactions = [transaction, ...this.transactions];

    this.saveData();
    return transaction;
  }
}

export const inventoryService = new InventoryService();