# Schrift-Hilfen für die Logo- und Vorschau-Skripte: lädt die Variable-Fonts aus public/assets/fonts
# und wandelt Text in SVG-Pfade um (text_path). Braucht: pip install fonttools brotli
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
W='public/assets'
def inst(path, **axes):
    f=TTFont(path); return instantiateVariableFont(f, axes)
brico=inst(W+'/fonts/bricolage-grotesque.woff2', wght=700, opsz=96)
geist=inst(W+'/fonts/geist.woff2', wght=600)

def text_path(font, s, size, x0=0, y0=0, tracking=0):
    gs=font.getGlyphSet(); cmap=font.getBestCmap(); upm=font['head'].unitsPerEm
    sc=size/upm; x=x0; d=[]
    hmtx=font['hmtx']
    for ch in s:
        g=cmap[ord(ch)]
        pen=SVGPathPen(gs)
        tp=TransformPen(pen,(sc,0,0,-sc,x,y0))
        gs[g].draw(tp)
        d.append(pen.getCommands())
        x+=hmtx[g][0]*sc+tracking
    return ' '.join(d), x-tracking
