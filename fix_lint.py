import re

# Fix SettingsView
with open('SettingsView.tsx', 'r') as f:
    settings_content = f.read()

settings_content = settings_content.replace(
"""      storageService.saveSettings({
        companyName,
        warehouseName,
        address,
        managerName,
        phone,
        staffList,
        stockInReasons,
        stockOutPurposes,
        productionOrders,
      });""",
"""      storageService.saveSettings({
        companyName,
        warehouseName,
        address,
        managerName,
        phone,
        staffList,
        stockInReasons,
        stockOutPurposes,
        productionOrders,
        locations: settings.locations || [],
      });"""
)

with open('SettingsView.tsx', 'w') as f:
    f.write(settings_content)


# Fix sampleData.ts
with open('sampleData.ts', 'r') as f:
    sample_content = f.read()

sample_content = sample_content.replace(
"""  productionOrders: [
    'LSX-2026-HL288',
    'LSX-2026-XQ911',
    'LSX-2026-VN552',
    'LSX-BOM-001',
    'LSX-DEMO-999'
  ]
};""",
"""  productionOrders: [
    'LSX-2026-HL288',
    'LSX-2026-XQ911',
    'LSX-2026-VN552',
    'LSX-BOM-001',
    'LSX-DEMO-999'
  ],
  locations: []
};""")

with open('sampleData.ts', 'w') as f:
    f.write(sample_content)


# Fix storage.ts
with open('storage.ts', 'r') as f:
    storage_content = f.read()

storage_content = storage_content.replace(
"""  addStockCheckRecord(record: Omit<StockCheckRecord, 'id'>): void {
    const checks = this.getStockCheckRecords();
    const newRecord: StockCheckRecord = {
      ...record,
      id: `check-${Date.now()}`
    };""",
"""  addStockCheckRecord(record: Omit<StockCheckRecord, 'id' | 'systemStock'> & { systemStock?: number }): void {
    const checks = this.getStockCheckRecords();
    const { systemStock, ...rest } = record;
    const newRecord: StockCheckRecord = {
      ...rest,
      id: `check-${Date.now()}`
    };"""
)

storage_content = storage_content.replace(
"""      return {
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
      };""",
"""      return {
        id: lot.id,
        partId: part.id,
        partCode: part.code,
        partName: part.name,
        contNumber: lot.contNumber,
        importDate: lot.importDate,
        originalQty: lot.originalQty,
        consumedQty: consumed,
        remainingQty: remaining,
        status,
        notes: lot.notes,
      };""")

with open('storage.ts', 'w') as f:
    f.write(storage_content)
