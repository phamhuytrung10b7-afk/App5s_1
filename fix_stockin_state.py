import re

with open('StockInView.tsx', 'r') as f:
    content = f.read()

# Make sure the partial import state is there
if 'partialImportModal' not in content[:2000]:
    state_code = """  const [autoScanHistory, setAutoScanHistory] = useState<
    { id: string; partCode: string; partName: string; qty: number; unit: string; time: string; contNumber?: string; stockAfter: number }[]
  >([]);

  const [partialImportModal, setPartialImportModal] = useState<{
    isOpen: boolean;
    part: Part;
    tagId?: string;
    contNumber?: string;
    originalQty: number;
    alreadyImported: number;
  } | null>(null);
  
  const [importQtyInput, setImportQtyInput] = useState<number>(0);
  const [selectedLocation, setSelectedLocation] = useState<string>('');
"""
    content = re.sub(r'const \[autoScanHistory.*?\]\(\[\]\);', state_code, content, flags=re.DOTALL)

with open('StockInView.tsx', 'w') as f:
    f.write(content)
