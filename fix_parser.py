import os

filepath = 'containerParser.ts'
if os.path.exists(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    old_code = """    if (isNewPart) {
      newPartsCount++;
    } else {
      matchedPartsCount++;
    }"""
    new_code = """    if (isNewPart) {
      continue; // Bỏ qua các linh kiện không có trong danh sách
    } else {
      matchedPartsCount++;
    }"""

    content = content.replace(old_code, new_code)
    with open(filepath, 'w') as f:
        f.write(content)
