with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

# I will find the first `{/* PRINT-ONLY PORTAL */}`
idx1 = content.find('{/* PRINT-ONLY PORTAL */}')
idx2 = content.find('{/* PRINT-ONLY PORTAL */}', idx1 + 1)

print(f"First portal at {idx1}, second at {idx2}")
