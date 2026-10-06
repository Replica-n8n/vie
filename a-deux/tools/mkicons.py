import zlib, struct, os

# Encodeur PNG en Python pur : aucune dependance a installer pour regenerer
# les icones. Meme approche que love-money, workout et games.

def write_png(path, w, h, rows):
    raw = b''.join(b'\x00' + bytes(v for px in row for v in px) for row in rows)
    def chunk(tag, data):
        body = tag + data
        return struct.pack('>I', len(data)) + body + struct.pack('>I', zlib.crc32(body) & 0xffffffff)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 6, 0, 0, 0)   # RGBA, 8 bits
    with open(path, 'wb') as f:
        f.write(b'\x89PNG\r\n\x1a\n')
        f.write(chunk(b'IHDR', ihdr))
        f.write(chunk(b'IDAT', zlib.compress(raw, 9)))
        f.write(chunk(b'IEND', b''))

# Les memes couleurs que la feuille de style : les deux personnes gardent
# leur couleur de l'icone jusqu'aux cartes d'accueil.
BG      = (0x15, 0x11, 0x1A)
ROSE    = (0xF0, 0x70, 0x9A)
MENTHE  = (0x5F, 0xC9, 0xC0)
# La zone commune n'est ni l'un ni l'autre : c'est la seule partie claire de
# l'icone, et c'est elle qu'on reconnait de loin dans une grille d'apps.
COMMUN  = (0xF5, 0xF0, 0xF7)

# Le coeur : (x^2 + y^2 - 1)^3 - x^2 * y^3 <= 0.
# Une equation plutot qu'un trace a la main, parce qu'elle reste lisse a
# n'importe quelle taille et ne demande aucune bibliotheque.
def dans_coeur(x, y):
    a = x * x + y * y - 1.0
    return a * a * a - x * x * y * y * y <= 0.0

# Deux coeurs decales, qui se chevauchent au centre. Le decalage vertical
# oppose evite l'effet miroir parfait, qui donnait un logo raide.
ECHELLE_COEUR = 0.62
COEURS = [
    (-0.40,  0.06, ROSE),
    ( 0.40, -0.06, MENTHE),
]

SOUS = 3          # 3x3 sous-echantillons : sans cela les courbes crenellent

def icon(size, pad_ratio):
    pad = size * pad_ratio
    utile = size - 2 * pad
    # Le dessin occupe x dans [-1.25, 1.25] ; il est plus large que haut.
    echelle = utile / 2.5
    cx = size / 2.0
    cy = size / 2.0 + utile * 0.05     # recentrage optique : les pointes tirent l'oeil vers le bas

    total = float(SOUS * SOUS)
    rows = []
    pas = 1.0 / SOUS
    for py in range(size):
        row = []
        for px in range(size):
            n_rose = n_menthe = n_commun = 0
            for sy in range(SOUS):
                yy = -((py + (sy + 0.5) * pas) - cy) / echelle
                for sx in range(SOUS):
                    xx = ((px + (sx + 0.5) * pas) - cx) / echelle
                    dedans = [dans_coeur((xx - ox) / ECHELLE_COEUR, (yy - oy) / ECHELLE_COEUR)
                              for (ox, oy, _) in COEURS]
                    if dedans[0] and dedans[1]: n_commun += 1
                    elif dedans[0]: n_rose += 1
                    elif dedans[1]: n_menthe += 1
            n_fond = total - n_rose - n_menthe - n_commun
            couleur = tuple(
                int(round((BG[i] * n_fond + ROSE[i] * n_rose +
                           MENTHE[i] * n_menthe + COMMUN[i] * n_commun) / total))
                for i in range(3)
            )
            row.append(couleur + (255,))
        rows.append(row)
    return rows

# Lancer depuis a-deux/ :  python tools/mkicons.py
for name, size, pad in [
    ('icons/icon-192.png',          192, 0.12),
    ('icons/icon-512.png',          512, 0.12),
    ('icons/icon-maskable-512.png', 512, 0.24),
    ('icons/apple-touch-icon.png',  180, 0.12),
]:
    write_png(name, size, size, icon(size, pad))
    print(name, os.path.getsize(name), 'octets')
