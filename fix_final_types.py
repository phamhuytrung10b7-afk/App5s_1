with open('types.ts', 'r') as f:
    content = f.read()

content = content.replace("unit: string;\n  expectedQuantity: number;", "unit: string;\n  location: string;\n  expectedQuantity: number;")

with open('types.ts', 'w') as f:
    f.write(content)

with open('storage.ts', 'r') as f:
    storage = f.read()

# Fix FifoLot initialization
storage = storage.replace(
"""          partId: item.partId,
          partCode: item.partCode,""", 
"""          partId: item.partId,
          partCode: item.partCode,
          partName: item.partName,""")

with open('storage.ts', 'w') as f:
    f.write(storage)
