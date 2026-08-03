with open('storage.ts', 'r') as f:
    content = f.read()

content = content.replace("quantity: info.quantity,\n        contNumber: info.contNumber,", "quantity: info.quantity,\n        importedQuantity: info.importedQuantity || 0,\n        contNumber: info.contNumber,")

with open('storage.ts', 'w') as f:
    f.write(content)
