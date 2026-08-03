def check_braces(filename):
    with open(filename, 'r') as f:
        content = f.read()
    
    # Just print the last 200 lines to see structure
    lines = content.split('\n')
    for i, line in enumerate(lines[-200:]):
        print(f"{len(lines)-200+i+1}| {line}")

check_braces('ContainerImportPrintModal.tsx')
