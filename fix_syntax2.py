with open('ContainerImportPrintModal.tsx', 'r') as f:
    lines = f.readlines()

# Let's find the first '{/* PRINT-ONLY PORTAL */}' and the second one.
first = -1
second = -1
for i, line in enumerate(lines):
    if '{/* PRINT-ONLY PORTAL */}' in line:
        if first == -1:
            first = i
        else:
            second = i

print(f"first: {first}, second: {second}")
