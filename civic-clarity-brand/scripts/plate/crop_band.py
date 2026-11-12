"""Crop the hero band (1536x450 at 0,0) from the owner-selected reference."""
import sys
from PIL import Image
Image.open(sys.argv[1]).convert('RGB').crop((0, 0, 1536, 450)).save('v2/band.png')
