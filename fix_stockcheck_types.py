with open('types.ts', 'r') as f:
    content = f.read()

content = content.replace("partId: string;", "partId: string;\n  partCode: string;\n  partName: string;")

with open('types.ts', 'w') as f:
    f.write(content)
