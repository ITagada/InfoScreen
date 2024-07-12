from screeninfo import get_monitors

MONITORS = {}
counter = 0
for m in get_monitors():
    if m.name in MONITORS.keys():
        counter += 1
        MONITORS[f'{m.name}{counter}'] = [m.width, m.height]
    MONITORS[f'{m.name}'] = [m.width, m.height]
print(MONITORS)
