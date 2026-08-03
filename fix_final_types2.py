with open('types.ts', 'r') as f:
    content = f.read()
content = content.replace("date: string;\n  checkedBy: string;", "checkDate: string;\n  checkedBy: string;")
with open('types.ts', 'w') as f:
    f.write(content)

with open('storage.ts', 'r') as f:
    storage = f.read()

# Fix FifoLot initialization
storage = storage.replace(
"""          partId: item.partId,
          partCode: item.partCode,
          contNumber:""", 
"""          partId: item.partId,
          partCode: item.partCode,
          partName: item.partName || item.name,
          contNumber:""")

with open('storage.ts', 'w') as f:
    f.write(storage)
