import re

with open('types.ts', 'r') as f:
    content = f.read()

# Add WarehouseLocation
if 'interface WarehouseLocation' not in content:
    content = content.replace("export interface AppSettings {", "export interface WarehouseLocation {\n  id: string;\n  name: string; // e.g. A1, B2\n  description?: string;\n}\n\nexport interface AppSettings {")

# Add locations to AppSettings
if 'locations: WarehouseLocation[]' not in content:
    content = content.replace("  productionOrders: string[]; // Danh sách mã lệnh sản xuất (LSX)\n}", "  productionOrders: string[]; // Danh sách mã lệnh sản xuất (LSX)\n  locations: WarehouseLocation[];\n}")

# Modify ContainerQrTag
if 'importedQuantity?: number;' not in content:
    content = content.replace("  isUsed?: boolean;\n", "  isUsed?: boolean;\n  importedQuantity?: number;\n")

# Add location to Transaction? Yes, it's good to track location in Transaction so we know where it went
if 'locationId?: string;' not in content:
    content = content.replace("  person: string; // Người thực hiện (Người nhập hoặc Người lấy)\n", "  person: string; // Người thực hiện (Người nhập hoặc Người lấy)\n  locationId?: string; // Nơi lưu trữ thực tế\n")

with open('types.ts', 'w') as f:
    f.write(content)

