with open('SettingsView.tsx', 'r') as f:
    lines = f.readlines()

with open('SettingsView.tsx', 'w') as f:
    for i, line in enumerate(lines):
        if line.strip() == ')}' and i == 677:
            continue
        f.write(line)
