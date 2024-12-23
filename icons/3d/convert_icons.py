from PIL import Image
import os

def convert_icons():
    icons = {
        'moon': (0, 0),      # Position de l'icône lune dans l'image source
        'clock': (1, 0),     # Position de l'horloge
        'alarm': (2, 0),     # Position de l'alarme
        'sleep': (0, 1),     # Position de l'icône sommeil
        'stats': (1, 1),     # Position des statistiques
        'settings': (2, 2)   # Position des paramètres
    }
    
    # Ouvrir l'image source
    source = Image.open('image1.png')
    icon_size = source.width // 3  # Taille d'une icône individuelle
    
    # Créer le dossier de sortie s'il n'existe pas
    if not os.path.exists('output'):
        os.makedirs('output')
    
    # Découper et sauvegarder chaque icône
    for name, pos in icons.items():
        left = pos[0] * icon_size
        top = pos[1] * icon_size
        right = left + icon_size
        bottom = top + icon_size
        
        # Découper l'icône
        icon = source.crop((left, top, right, bottom))
        
        # Sauvegarder l'icône
        icon.save(f'output/{name}.png', 'PNG')

if __name__ == '__main__':
    convert_icons()
