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
  ],
  locations: []
};""",
"""  productionOrders: [
    'LSX-2026-HL288',
    'LSX-2026-XQ911',
    'LSX-2026-VN552',
    'LSX-BOM-001',
    'LSX-DEMO-999'
  ],
  locations: []
} as AppSettings;""")

with open('sampleData.ts', 'w') as f:
    f.write(sample_content)

# Fix storage.ts
with open('storage.ts', 'r') as f:
    storage_content = f.read()

storage_content = storage_content.replace(
"""  addStockCheckRecord(record: Omit<StockCheckRecord, 'id' | 'systemStock'> & { systemStock?: number }): void {
    const checks = this.getStockCheckRecords();
    const { systemStock, ...rest } = record;
    const newRecord: StockCheckRecord = {
      ...rest,
      id: `check-${Date.now()}`
    };""",
"""  addStockCheckRecord(record: Omit<StockCheckRecord, 'id'> & { systemStock?: number }): void {
    const checks = this.getStockCheckRecords();
    const { systemStock, ...rest } = record as any;
    const newRecord: StockCheckRecord = {
      ...rest,
      id: `check-${Date.now()}`
    };""")

with open('storage.ts', 'w') as f:
    f.write(storage_content)
