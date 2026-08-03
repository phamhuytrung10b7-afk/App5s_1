import re

with open('ContainerImportPrintModal.tsx', 'r') as f:
    content = f.read()

# Replace Tailwind classes in the visual preview with dynamic font sizes.
# For A7:
# <p className="text-xl font-black text-slate-900 leading-tight mb-3 line-clamp-4">
# {item.name}
# </p>
# We will use style={{ fontSize: `${printConfigs[labelLayout].nameFontSize}px` }}

replacements = [
    (r'<p className="text-xl font-black text-slate-900 leading-tight mb-3 line-clamp-4">',
     r'<p className="font-black text-slate-900 leading-tight mb-3 line-clamp-4" style={{ fontSize: `${printConfigs[labelLayout].nameFontSize}px` }}>'),
    
    (r'<p className={`text-base font-mono font-bold py-1.5 px-3 rounded-md inline-block \$\{isScanned \? \'text-emerald-900 bg-emerald-200 font-black\' : \'text-emerald-800 bg-emerald-50\'\}`>',
     r'<p className={`font-mono font-bold py-1.5 px-3 rounded-md inline-block ${isScanned ? \'text-emerald-900 bg-emerald-200 font-black\' : \'text-emerald-800 bg-emerald-50\'}`} style={{ fontSize: `${printConfigs[labelLayout].codeFontSize}px` }}>'),
     
    (r'<QRCodeSVG value=\{item.qrPayload\} size=\{160\} level="Q" marginSize=\{1\} />',
     r'<QRCodeSVG value={item.qrPayload} size={printConfigs[labelLayout].qrSize * 3.78} level="Q" marginSize={1} />'), # 1mm approx 3.78px
]

for old, new in replacements:
    content = content.replace(old, new)

with open('ContainerImportPrintModal.tsx', 'w') as f:
    f.write(content)
