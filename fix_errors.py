import re

# Fix BatchPrintQrModal
with open('BatchPrintQrModal.tsx', 'r') as f:
    batch = f.read()
if "useEffect" not in batch.split('import')[1].split('from')[0]:
    batch = batch.replace("useState", "useState, useEffect", 1)
with open('BatchPrintQrModal.tsx', 'w') as f:
    f.write(batch)

# Fix ContainerImportPrintModal Duplicate Settings2
with open('ContainerImportPrintModal.tsx', 'r') as f:
    cont = f.read()
# Find imports of Settings2
cont = re.sub(r'Settings2,\s*Settings2,', 'Settings2,', cont)
cont = re.sub(r'Settings2(.*?)Settings2', r'Settings2\1', cont, count=1)

with open('ContainerImportPrintModal.tsx', 'w') as f:
    f.write(cont)

