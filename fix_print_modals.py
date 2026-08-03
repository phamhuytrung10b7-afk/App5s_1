import re

def process_file(filename, is_container):
    with open(filename, 'r') as f:
        content = f.read()

    # 1. Add createPortal import
    if 'createPortal' not in content:
        content = content.replace("from 'react';", "from 'react';\nimport { createPortal } from 'react-dom';")

    # 2. Change labelLayout state
    content = content.replace("useState<'a7'>('a7')", "useState<'double' | 'single' | 'a7'>('double')")

    # 3. Add options to layout select
    if 'Khổ A7' not in content or 'Tem Đôi' not in content:
        select_match = re.search(r'<select\s+value=\{labelLayout\}[^>]*>.*?</select>', content, re.DOTALL)
        if select_match:
            old_select = select_match.group(0)
            new_select = re.sub(r'>\s*<option.*</option>\s*</select>', '>\n                <option value="double">Tem Đôi (73x22mm - 2 Tem/Hàng)</option>\n                <option value="single">Tem Đơn (35x22mm - 1 Tem/Hàng)</option>\n                <option value="a7">Khổ A7 (74x105mm - 1 Tem)</option>\n              </select>', old_select, flags=re.DOTALL)
            content = content.replace(old_select, new_select)

    # 4. Replace preview rendering logic
    start_str = '{/* PRINT-ONLY CSS CONTAINER'
    start_idx = content.find(start_str)
    
    if start_idx != -1:
        # We need to replace the preview logic before it.
        # Find the preview map function
        preview_start = content.find('{labelRows.map((row, rowIndex) => (')
        if preview_start != -1 and preview_start < start_idx:
            # Replace everything from preview_start to start_idx - 10
            pass # wait, it's easier to use sed or just string replace if we know the exact block.

    with open(filename, 'w') as f:
        f.write(content)

process_file('BatchPrintQrModal.tsx', False)
process_file('ContainerImportPrintModal.tsx', True)

