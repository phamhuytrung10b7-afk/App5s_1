import re

with open('storage.ts', 'r') as f:
    content = f.read()

# Replace return blocks in isQrTokenUsed
content = content.replace("""        isUsed: true,
        scannedAt: info.scannedAt,
        scannedBy: info.scannedBy,
        partCode: info.partCode,
        quantity: info.quantity,
        importedQuantity: info.importedQuantity || 0,
        contNumber: info.contNumber,""", """        isUsed: (info.importedQuantity || 0) >= (info.quantity || 0),
        scannedAt: info.scannedAt,
        scannedBy: info.scannedBy,
        partCode: info.partCode,
        quantity: info.quantity,
        importedQuantity: info.importedQuantity || 0,
        contNumber: info.contNumber,""")

with open('storage.ts', 'w') as f:
    f.write(content)
