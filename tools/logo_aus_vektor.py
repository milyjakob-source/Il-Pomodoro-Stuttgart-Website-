# Baut logo.svg, logo-dark.svg und favicon.svg aus dem vektorisierten Original-Logo (tools/logo-vektor.json,
# mit potrace aus dem Logo-Bild erzeugt: eine rote Ebene für Schrift und Tomate, eine grüne für den Stiel).
# Aufruf aus dem Projektordner: python3 tools/logo_aus_vektor.py, danach npm run bilder
import json, re
L = json.load(open('tools/logo-vektor.json'))
W, H, dr, dg = L['W'], L['H'], L['dr'], L['dg']

def bbox(d):
    n = [float(x) for x in re.findall(r'-?\d+\.?\d*', d)]
    xs, ys = n[0::2], n[1::2]
    return min(xs), min(ys), max(xs), max(ys)

x0, y0, x1, y1 = bbox(dr)
gx0, gy0, gx1, gy1 = bbox(dg)
X0, Y0 = min(x0, gx0) - 4, min(y0, gy0) - 4
X1, Y1 = max(x1, gx1) + 4, max(y1, gy1) + 4
vw, vh = X1 - X0, Y1 - Y0
h = 46
for name, red, green in [('logo.svg', L['red'], L['green']), ('logo-dark.svg', '#ec7f88', '#7fbf83')]:
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{X0:.0f} {Y0:.0f} {vw:.0f} {vh:.0f}" width="{h*vw/vh:.0f}" height="{h}" role="img" aria-label="Il Pomodoro">'
           f'<path fill="{red}" fill-rule="evenodd" d="{dr}"/><path fill="{green}" fill-rule="evenodd" d="{dg}"/></svg>')
    open(f'public/assets/img/{name}', 'w').write(svg)

# Favicon: Tomate als Kreis in Logo-Rot, darauf der Original-Stiel aus dem Logo.
sc = 30 / max(gx1 - gx0, gy1 - gy0)
tx, ty = 32 - (gx0 + gx1) / 2 * sc, 9 - gy0 * sc
fav = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#fafbf8"/>'
       f'<circle cx="32" cy="37" r="22" fill="{L["red"]}"/>'
       f'<path fill="{L["green"]}" fill-rule="evenodd" transform="translate({tx:.2f} {ty:.2f}) scale({sc:.4f})" d="{dg}"/></svg>')
open('public/assets/img/favicon.svg', 'w').write(fav)
print('ok', round(h * vw / vh), 'x', h)
