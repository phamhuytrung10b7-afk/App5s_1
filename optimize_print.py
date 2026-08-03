import os

def optimize_file(filename):
    with open(filename, 'r') as f:
        content = f.read()

    # Increase QR Code size from 50mm to 56mm
    content = content.replace("width: '50mm', height: '50mm'", "width: '56mm', height: '56mm'")
    
    # Add wordBreak for the A7 item name in the preview and print
    # Wait, the string is:
    old_name_div = "fontSize: '24px', fontWeight: '900', color: '#000', marginBottom: '6mm', lineHeight: '1.3'"
    new_name_div = "fontSize: '24px', fontWeight: '900', color: '#000', marginBottom: '6mm', lineHeight: '1.3', wordBreak: 'break-word', overflow: 'hidden'"
    content = content.replace(old_name_div, new_name_div)

    # For the preview A7, I had `text-xl font-black text-slate-900 leading-tight mb-3 line-clamp-4`
    # That is fine. 
    
    # Increase preview QR size
    content = content.replace('QRCodeSVG value={item.qrPayload} size={160}', 'QRCodeSVG value={item.qrPayload} size={180}')
    content = content.replace('QRCodeSVG value={item.qrCode || item.code} size={160}', 'QRCodeSVG value={item.qrCode || item.code} size={180}')

    with open(filename, 'w') as f:
        f.write(content)

optimize_file('ContainerImportPrintModal.tsx')
optimize_file('BatchPrintQrModal.tsx')
