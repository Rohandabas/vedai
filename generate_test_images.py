from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

root = Path(__file__).resolve().parent / 'test-files'
root.mkdir(exist_ok=True)

font = ImageFont.truetype('arial.ttf', 36)
font_small = ImageFont.truetype('arial.ttf', 28)

# Question paper image
img = Image.new('RGB', (1200, 1600), 'white')
d = ImageDraw.Draw(img)
d.text((60, 50), 'Science Test', fill='black', font=font)
questions = [
    '1. What is photosynthesis, and why is it important for plants?',
    '2. What is the difference between a physical change and a chemical change? Give one example of each.',
    '3. Why does an object fall toward the Earth when it is dropped?',
    '4. What are the three states of matter? Describe one characteristic of each.',
    '5. What is the role of the heart in the human circulatory system?',
]
y = 120
for q in questions:
    d.text((60, y), q, fill='black', font=font_small)
    y += 180
img.save(root / 'question-paper.png')

# Answer sheet image
img2 = Image.new('RGB', (1200, 1600), 'white')
d2 = ImageDraw.Draw(img2)
answers = [
    'Photosynthesis is the process by which green plants use sunlight, carbon dioxide, and water to make glucose (food) and release oxygen. It is important because it provides plants with energy-rich food for growth and releases oxygen into the atmosphere.',
    'A physical change changes the form or state of a substance without creating a new substance. Example: melting ice. A chemical change produces one or more new substances with different properties. Example: rusting iron.',
    'An object falls toward Earth because of gravity. The gravitational force attracts objects toward the center of the Earth, causing unsupported objects to accelerate downward.',
    'The three common states of matter are solid, liquid, and gas. Solids have a fixed shape and volume. Liquids have a fixed volume but take the shape of their container. Gases have neither a fixed shape nor a fixed volume and spread to fill their container.',
    'The heart is a muscular organ that pumps blood throughout the body. It sends oxygen-rich blood to body tissues and helps circulate blood back to the lungs to receive oxygen.',
]
y = 120
for i, a in enumerate(answers, 1):
    d2.text((60, y), f'Q{i}: {a}', fill='black', font=font_small)
    y += 220
img2.save(root / 'answer-sheet.png')

print('Created files:')
for p in sorted(root.iterdir()):
    print(p.name)
