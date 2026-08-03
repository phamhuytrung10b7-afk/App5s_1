with open('StockInView.tsx', 'r') as f:
    content = f.read()

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

content = content.replace("  const [autoScanHistory, setAutoScanHistory] = useState<\n    { id: string; partCode: string; partName: string; qty: number; unit: string; time: string; contNumber?: string; stockAfter: number }[]\n  >([]);", state_code)

with open('StockInView.tsx', 'w') as f:
    f.write(content)
