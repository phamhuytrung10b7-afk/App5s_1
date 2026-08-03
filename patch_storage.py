import re

with open('storage.ts', 'r') as f:
    content = f.read()

# Add empty locations array to default app settings
if 'locations: []' not in content:
    content = content.replace("productionOrders: ['LSX-2026-001'],\n    };", "productionOrders: ['LSX-2026-001'],\n      locations: [],\n    };")

# Add importedQuantity support
if 'importedQuantity: details.importedQuantity || 0,' not in content:
    content = content.replace("quantity: details.quantity,", "quantity: details.quantity,\n      importedQuantity: details.importedQuantity || 0,")

if 'importedQuantity?: number' not in content:
    content = content.replace("quantity: number;", "quantity: number; importedQuantity?: number;")
    content = content.replace("quantity?: number;", "quantity?: number; importedQuantity?: number;")

with open('storage.ts', 'w') as f:
    f.write(content)

