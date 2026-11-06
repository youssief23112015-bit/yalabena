p = r'database\seed-test-data-v3-additional-branchless.sql'
s = open(p, encoding='utf-8').read()
lines = s.split('\n')
fixed = []
for line in lines:
    if '36c38ed7' in line:
        # Replace the whole line with correct SQL
        fixed.append("('11111111-2222-3333-4444-555566667777', '4528edc2-673c-51c2-8b4a-ec9405a70eea', 'A1', '[\"36c38ed7-ce4d-55ac-81f6-0631004fae64\"]'::jsonb, NOW() - INTERVAL '1 day')")
    else:
        fixed.append(line)
s = '\n'.join(fixed)
open(p, 'w', encoding='utf-8').write(s)
print('Done')