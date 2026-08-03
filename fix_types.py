with open('types.ts', 'r') as f:
    content = f.read()

stock_check_record = """
export interface StockCheckRecord {
  id: string;
  partId: string;
  expectedQuantity: number;
  actualQuantity: number;
  discrepancy: number;
  reason?: string;
  date: string;
  checkedBy: string;
}
"""
if "StockCheckRecord" not in content:
    content += stock_check_record
    
with open('types.ts', 'w') as f:
    f.write(content)

with open('storage.ts', 'r') as f:
    storage = f.read()
if "StockCheckRecord" not in storage.split('import')[1].split('from')[0]:
    storage = storage.replace("Transaction, AppSettings", "Transaction, StockCheckRecord, AppSettings")
with open('storage.ts', 'w') as f:
    f.write(storage)
