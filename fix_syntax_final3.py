with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

first_portal = content.find('{/* PRINT-ONLY PORTAL */}')
# We know clean_content = content[:first_portal] is valid.
# Now we just need to append the correct print_block and `  );\n};\n`

clean_content = content[:first_portal]
