with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

idx1 = content.find('{/* PRINT-ONLY PORTAL */}')
idx2 = content.find('{/* PRINT-ONLY PORTAL */}', idx1 + 1)

print(content[idx1:idx1+100])
print("-----")
print(content[idx2-100:idx2+100])
