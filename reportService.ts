
import { utils, writeFile } from 'xlsx';
import { inventoryService } from './inventoryService';
import { UnitStatus, ProductionPlan, Transaction, SalesOrder } from './types';

export const exportDraftScannedList = (serials: string[], title: string, extraInfo: string = '') => {
  const wb = utils.book_new();
  const data = serials.map((s, idx) => ({
    'STT': idx + 1,
    'Mã Serial / IMEI': s,
    'Thông tin bổ sung': extraInfo
  }));
  const ws = utils.json_to_sheet(data);
  ws['!cols'] = [{ wch: 10 }, { wch: 30 }, { wch: 30 }];
  utils.book_append_sheet(wb, ws, "Danh sách nháp");
  writeFile(wb, `RO_NHAP_${title.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportExcelReport = () => {
  const wb = utils.book_new();

  // 1. Lịch sử Nhập kho
  const inboundTx = inventoryService.getTransactions().filter(t => t.type === 'INBOUND');
  const inboundSheetData = inboundTx.map(tx => {
      const product = inventoryService.getProductById(tx.productId);
      return {
          'Ngày Nhập': new Date(tx.date).toLocaleDateString('vi-VN'),
          'Model': product?.model || tx.productId,
          'Tên Lô / Kế hoạch': tx.planName || '-',
          'Kho Nhập': tx.toLocation,
          'Số Lượng': tx.quantity,
          'Loại': tx.isReimportTx ? 'Tái nhập' : 'Nhập mới',
          'Danh sách IMEI': tx.serialNumbers.join(', ')
      };
  });
  const wsInbound = utils.json_to_sheet(inboundSheetData.length > 0 ? inboundSheetData : [{ "Thông báo": "Chưa có dữ liệu" }]);
  utils.book_append_sheet(wb, wsInbound, "Lịch sử Nhập kho");

  // 2. Báo cáo Tồn kho
  const products = inventoryService.getProducts();
  const units = inventoryService.getUnits();
  const inventorySheetData = products.map(p => {
      const pUnits = units.filter(u => u.productId === p.id);
      return {
          'Tên Model': p.model,
          'Thương hiệu': p.brand,
          'Thông số': p.specs,
          'Tồn kho (Mới)': pUnits.filter(u => u.status === UnitStatus.NEW).length,
          'Đã bán': pUnits.filter(u => u.status === UnitStatus.SOLD).length,
          'Tổng': pUnits.length
      };
  });
  const wsInventory = utils.json_to_sheet(inventorySheetData.length > 0 ? inventorySheetData : [{ "Thông báo": "Chưa có dữ liệu" }]);
  utils.book_append_sheet(wb, wsInventory, "Báo cáo Tồn kho");

  writeFile(wb, `RO_Report_General_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportTransactionHistory = (data: Transaction[], title: string) => {
    const wb = utils.book_new();
    const sheetData = data.map(tx => {
        const product = inventoryService.getProductById(tx.productId);
        
        let displayType = '';
        if (tx.type === 'INBOUND') {
            displayType = tx.isReimportTx ? 'Nhập kho (Tái nhập)' : 'Nhập kho (Mới)';
        } else if (tx.type === 'OUTBOUND') {
            displayType = 'Xuất kho';
        } else if (tx.type === 'TRANSFER') {
            displayType = 'Điều chuyển';
        }

        return {
            'Thời gian': new Date(tx.date).toLocaleString('vi-VN'),
            'Loại': displayType,
            'Model': product?.model || tx.productId,
            'Tên Lô / Kế hoạch': tx.planName || '-',
            'Số lượng': tx.quantity,
            'Đối tác/Vị trí': tx.type === 'OUTBOUND' ? tx.customer : (tx.toLocation || '-'),
            'Danh sách Serial': tx.serialNumbers.join(', ')
        };
    });
    const ws = utils.json_to_sheet(sheetData);
    utils.book_append_sheet(wb, ws, "Dữ liệu");
    writeFile(wb, `RO_${title.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportPlanDetail = (plan: ProductionPlan) => {
   const wb = utils.book_new();
   const data = plan.serials.map((s, index) => {
       const unit = inventoryService.getUnitBySerial(s);
       let statusVi = 'Chưa sản xuất';
       if (unit) {
           if (unit.status === UnitStatus.NEW) statusVi = 'Đã nhập kho (Tồn)';
           else if (unit.status === UnitStatus.SOLD) statusVi = 'Đã bán';
       }
       return {
           'STT': index + 1,
           'Serial / IMEI': s,
           'Trạng thái': statusVi,
           'Vị trí hiện tại': unit?.warehouseLocation || '-',
           'Ngày nhập': unit?.importDate ? new Date(unit.importDate).toLocaleDateString('vi-VN') : '-'
       }
   });
   const ws = utils.json_to_sheet(data);
   utils.book_append_sheet(wb, ws, "Chi tiết Kế hoạch");
   writeFile(wb, `Plan_${plan.name.replace(/\s/g, '_')}.xlsx`);
};

export const exportSalesOrdersReport = (orders: SalesOrder[]) => {
  const wb = utils.book_new();
  const data = orders.map(order => {
    return {
      'Mã Đơn': order.code,
      'Loại': order.type === 'SALE' ? 'Xuất bán' : 'Điều chuyển',
      'Trạng thái': order.status === 'COMPLETED' ? 'Hoàn thành' : 'Chờ xử lý',
      'Khách hàng / Kho đến': order.customerName || order.destinationWarehouse || '-',
      'Ngày tạo': new Date(order.createdDate).toLocaleString('vi-VN'),
      'Chi tiết': order.items.map(item => {
        const p = inventoryService.getProductById(item.productId);
        return `${p?.model || 'N/A'} (x${item.quantity}, đã quét: ${item.scannedCount})`;
      }).join('; ')
    };
  });
  const ws = utils.json_to_sheet(data.length > 0 ? data : [{ "Thông báo": "Chưa có đơn hàng" }]);
  utils.book_append_sheet(wb, ws, "Danh sách Đơn hàng");
  writeFile(wb, `RO_Orders_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const exportFullDatabase = () => {
    const wb = utils.book_new();
    
    const units = inventoryService.getUnits().map((u, index) => {
        const prod = inventoryService.getProductById(u.productId);
        return {
            'STT': index + 1,
            'Số Serial / IMEI': u.serialNumber, 
            'Model': prod?.model || u.productId, 
            'Trạng thái': u.status === UnitStatus.NEW ? 'Tồn kho' : 'Đã bán',
            'Vị trí hiện tại': u.warehouseLocation, 
            'Ngày nhập kho': new Date(u.importDate).toLocaleString('vi-VN'),
            'Ngày xuất kho': u.exportDate ? new Date(u.exportDate).toLocaleString('vi-VN') : '-', 
            'Tên Khách hàng': u.customerName || '-',
            'Đã từng Tái nhập': u.isReimported ? 'Có' : 'Không'
        };
    });
    
    const ws = utils.json_to_sheet(units.length > 0 ? units : [{ "Thông báo": "Hệ thống chưa có dữ liệu máy" }]);
    
    ws['!cols'] = [
      { wch: 5 },  { wch: 25 }, { wch: 20 }, { wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 15 }
    ];

    utils.book_append_sheet(wb, ws, "Dữ liệu chi tiết");
    writeFile(wb, `RO_FULL_DATA_${new Date().toISOString().split('T')[0]}.xlsx`);
};
