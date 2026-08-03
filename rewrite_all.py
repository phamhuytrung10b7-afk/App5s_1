import os
import re

def rewrite_batch():
    with open('BatchPrintQrModal.tsx', 'r') as f:
        content = f.read()

    # Add createPortal import if not there
    if 'createPortal' not in content:
        content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo } from 'react';\nimport { createPortal } from 'react-dom';")

    # Revert labelLayout state
    content = content.replace("useState<'a7'>('a7')", "useState<'double' | 'single' | 'a7'>('double')")

    # Add back the layout select UI options
    # We find the select for labelLayout
    select_pattern = re.compile(r'(<select\s+value=\{labelLayout\}\s+onChange=\{\(e\) => setLabelLayout\(e\.target\.value as [^\}]+\}\s+className="[^"]*"\s*>)(.*?)(</select>)', re.DOTALL)
    
    new_select_options = """
                <option value="double">Tem Đôi (73x22mm - 2 Tem/Hàng)</option>
                <option value="single">Tem Đơn (35x22mm - 1 Tem/Hàng)</option>
                <option value="a7">Khổ A7 (74x105mm - 1 Tem)</option>
"""
    
    content = select_pattern.sub(r'\1' + new_select_options + r'\3', content)

    # Revert the preview size rendering
    # Find the preview container: className="bg-white border-2 border-dashed border-slate-400...
    
    # We will just write a function to replace the entire render block of the preview tab and print container
    pass

