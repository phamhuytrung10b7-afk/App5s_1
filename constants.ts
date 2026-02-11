
import { Product, SerialUnit, UnitStatus, Transaction, Warehouse, Customer } from './types';

export const INITIAL_PRODUCTS: Product[] = [];

export const INITIAL_UNITS: SerialUnit[] = [];

export const INITIAL_TRANSACTIONS: Transaction[] = [];

export const INITIAL_WAREHOUSES: Warehouse[] = [
  { id: 'wh-01', name: 'Kho Tổng (Hà Nội)', address: 'Thanh Xuân, Hà Nội' },
  { id: 'wh-02', name: 'Kho Chi Nhánh (HCM)', address: 'Quận 7, TP.HCM' },
  { id: 'wh-03', name: 'Kho Đà Nẵng', address: 'Hải Châu, Đà Nẵng' }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cus-01', name: 'Đại lý Điện máy Xanh', type: 'DEALER', phone: '18001061' },
  { id: 'cus-02', name: 'Đại lý Karofi Cầu Giấy', type: 'DEALER', phone: '0901234567' },
  { id: 'cus-03', name: 'Khách lẻ (Vãng lai)', type: 'RETAIL' }
];

export const NAV_ITEMS = [
  { label: 'Tổng quan', icon: 'LayoutDashboard', path: '/' },
  { label: 'Nhập kho', icon: 'Download', path: '/inbound' },
  { label: 'Xuất kho', icon: 'Upload', path: '/outbound' },
  { label: 'Tồn kho', icon: 'Package', path: '/inventory' },
  { label: 'Kiểm tra SX', icon: 'ClipboardCheck', path: '/production-check' },
  { label: 'Tra cứu IMEI', icon: 'Search', path: '/tracking' },
  { label: 'Cấu hình', icon: 'Settings', path: '/settings' },
];