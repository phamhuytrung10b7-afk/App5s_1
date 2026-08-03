with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

first_portal = content.find('{/* PRINT-ONLY PORTAL */}')
clean_content = content[:first_portal]
print(clean_content[-500:])
