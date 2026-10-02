# Erzeugt src/og.svg (Social-Vorschau 1200 x 630) mit Logo und Text; das Foto setzt tools/bilder.mjs ein.
# Aufruf aus dem Projektordner: python3 tools/og_vorlage.py
import re
exec(open('tools/schrift.py').read())
logo = open('public/assets/img/logo-dark.svg').read()
inner = re.search(r'role="img" aria-label="[^"]*">(.*)</svg>', logo, re.S).group(1)
vx, vy, vw, vh = [float(v) for v in re.search(r'viewBox="([^"]+)"', logo).group(1).split()]
lsc = 560 / vw  # Logo 560 px breit
l1, _ = text_path(brico, 'Pizza aus dem Holzofen', 60, 80, 440, -1)
l2, _ = text_path(brico, 'im Stuttgarter Süden', 60, 80, 508, -1)
ad, _ = text_path(geist, 'Filderstraße 25  |  Tisch online reservieren', 25, 82, 570, 0.3)
svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 630" width="1200" height="630">
<defs><linearGradient id="s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0f1311" stop-opacity=".94"/><stop offset=".55" stop-color="#0f1311" stop-opacity=".8"/><stop offset="1" stop-color="#0f1311" stop-opacity=".2"/></linearGradient></defs>
<image href="FOTO" x="0" y="0" width="1470" height="630" preserveAspectRatio="xMidYMid slice"/>
<rect width="1200" height="630" fill="url(#s)"/>
<g transform="translate({80 - vx * lsc:.1f} {90 - vy * lsc:.1f}) scale({lsc:.4f})">{inner}</g>
<path fill="#eceee8" d="{l1}"/><path fill="#a9b1ab" d="{l2}"/><path fill="#ec7f88" d="{ad}"/>
</svg>'''
open('src/og.svg', 'w').write(svg)
print('ok')
