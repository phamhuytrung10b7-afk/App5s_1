import re

with open('ContainerImportPrintModal.tsx', 'r') as f:
    lines = f.readlines()

first_portal = -1
for i, line in enumerate(lines):
    if '{/* PRINT-ONLY PORTAL */}' in line:
        first_portal = i
        break

if first_portal != -1:
    lines = lines[:first_portal]
    # We now have the file up to the end of the modal body.
    # We just need to add the correct print block and `  );\n};\nexport default ContainerImportPrintModal;\n`
    # Wait, let me check the exports.

