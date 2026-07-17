import os
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from PIL import Image, ImageDraw, ImageFont

from config import Config
from database import db
from models import User, Category, Product

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)
    
    # Enable CORS for frontend integration
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Initialize DB and JWT
    db.init_app(app)
    jwt = JWTManager(app)
    
    # Register Blueprints
    from routes.auth import auth_bp
    from routes.categories import categories_bp
    from routes.products import products_bp
    from routes.tryon import tryon_bp
    from routes.wishlist import wishlist_bp
    from routes.recommendations import recommendations_bp
    from routes.admin import admin_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(products_bp, url_prefix='/api/products')
    app.register_blueprint(tryon_bp, url_prefix='/api/tryon')
    app.register_blueprint(wishlist_bp, url_prefix='/api/wishlist')
    app.register_blueprint(recommendations_bp, url_prefix='/api/recommendations')
    app.register_blueprint(admin_bp, url_prefix='/api/admin')
    
    # Serving uploaded/generated static files
    @app.route('/uploads/<path:filename>')
    def serve_uploads(filename):
        return send_from_directory(app.config['UPLOAD_FOLDER'], filename)
        
    @app.route('/generated/<path:filename>')
    def serve_generated(filename):
        return send_from_directory(app.config['GENERATED_FOLDER'], filename)
        
    # Health check route
    @app.route('/api/health', methods=['GET'])
    def health():
        return jsonify({'status': 'healthy', 'message': 'AI-Powered Try-On backend running.'}), 200

    # Auto seed database on startup
    with app.app_context():
        db.create_all()
        
        # SQLite self-healing database migrations for phone authentication
        try:
            db.session.execute(db.text("ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);"))
            db.session.commit()
            print("Migration: added phone_number to users")
        except Exception:
            db.session.rollback()

        try:
            db.session.execute(db.text("ALTER TABLE users ADD COLUMN otp_code VARCHAR(6);"))
            db.session.commit()
            print("Migration: added otp_code to users")
        except Exception:
            db.session.rollback()

        try:
            db.session.execute(db.text("ALTER TABLE users ADD COLUMN otp_expiry DATETIME;"))
            db.session.commit()
            print("Migration: added otp_expiry to users")
        except Exception:
            db.session.rollback()
            
        seed_database(app)
        
    return app


def generate_mock_assets(upload_folder):
    """
    Generates realistic transparent PNG garment files and matching catalog images 
    using Pillow to avoid having broken images or manual setup steps.
    """
    os.makedirs(upload_folder, exist_ok=True)
    
    # List of garments to generate
    # (filename, garment_type, rgb_color, alpha)
    garments = [
        ('crimson_tee.png', 'tshirt', (220, 53, 69), 230),
        ('navy_blazer.png', 'blazer', (30, 41, 59), 245),
        ('emerald_dress.png', 'dress', (25, 135, 84), 235),
        ('denim_jacket.png', 'jacket', (100, 149, 237), 240),
        ('kids_hoodie.png', 'hoodie', (255, 193, 7), 230),
        ('amber_shades.png', 'glasses', (217, 119, 6), 180),
        ('sherwani.png', 'sherwani', (184, 134, 11), 250),
        ('grey_trousers.png', 'pants', (108, 117, 125), 255),
        ('kids_dino_tee.png', 'tshirt', (25, 110, 180), 230),
        ('kids_denim_shorts.png', 'pants', (70, 130, 180), 255),
        ('kids_plaid_shirt.png', 'tshirt', (180, 40, 40), 240),
        ('kids_crewneck.png', 'tshirt', (79, 110, 138), 230),
        ('kids_joggers.png', 'pants', (85, 107, 47), 255),
        ('kids_polo.png', 'tshirt', (255, 127, 80), 235),
        ('kids_chinos.png', 'pants', (210, 180, 140), 255),
        ('kids_windbreaker.png', 'jacket', (0, 128, 128), 240),
        ('kids_vest.png', 'jacket', (139, 69, 19), 230),
        ('kids_boardshorts.png', 'pants', (255, 69, 0), 255),
        ('kids_linen_shirt.png', 'tshirt', (245, 245, 220), 225),
        ('kids_puffer.png', 'jacket', (70, 70, 70), 245),
        ('kids_overalls.png', 'dress', (70, 130, 180), 250)
    ]
    
    for filename, g_type, color, alpha in garments:
        garment_path = os.path.join(upload_folder, filename)
        catalog_path = os.path.join(upload_folder, 'cat_' + filename)
        
        # Check if assets already exist to prevent overwriting realistic images
        if os.path.exists(garment_path) and os.path.exists(catalog_path):
            continue
            
        # 1. Create transparent garment overlay PNG
        # Standard size 500x600 for garments, 500x200 for accessories (glasses)
        width, height = (500, 200) if g_type == 'glasses' else (500, 600)
        img = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        
        fill_color = color + (alpha,)
        outline_color = (max(0, color[0]-40), max(0, color[1]-40), max(0, color[2]-40), 255)
        
        if g_type == 'tshirt':
            # Draw T-shirt shape
            # Collar: (200, 100) -> (300, 100)
            # Sleeves: (100, 100) -> (100, 220) -> (170, 220) -> (170, 150)
            # Torso: (170, 150) -> (170, 550) -> (330, 550) -> (330, 150)
            # Other Sleeve: (330, 150) -> (330, 220) -> (400, 220) -> (400, 100)
            points = [
                (170, 100), (200, 120), (300, 120), (330, 100), # Collar
                (400, 140), (430, 220), (370, 250), (340, 180), # Right Sleeve
                (340, 550), (160, 550), (160, 180),             # Body & Hem
                (130, 250), (70, 220), (100, 140)               # Left Sleeve
            ]
            draw.polygon(points, fill=fill_color, outline=outline_color, width=3)
            # Draw neck curve line
            draw.arc([200, 100, 300, 140], start=0, end=180, fill=outline_color, width=2)
            
        elif g_type == 'blazer':
            # Sharp shoulders and collar lapel V
            points = [
                (150, 100), (350, 100), (380, 200), (380, 560), 
                (120, 560), (120, 200)
            ]
            draw.polygon(points, fill=fill_color, outline=outline_color, width=3)
            # Draw Lapels V
            draw.line([(150, 100), (250, 280), (350, 100)], fill=outline_color, width=4)
            draw.line([(250, 280), (250, 560)], fill=outline_color, width=2)
            
        elif g_type == 'dress':
            # Slim waist, flared hem
            points = [
                (200, 80), (300, 80), (280, 220), (420, 580), 
                (80, 580), (220, 220)
            ]
            draw.polygon(points, fill=fill_color, outline=outline_color, width=3)
            # Draw collar straps
            draw.arc([200, 70, 300, 110], start=0, end=180, fill=outline_color, width=2)
            
        elif g_type == 'jacket':
            # Bomber jacket shape, pocket lines
            points = [
                (160, 100), (340, 100), (390, 180), (370, 550), 
                (130, 550), (110, 180)
            ]
            draw.polygon(points, fill=fill_color, outline=outline_color, width=3)
            # Center zipper line
            draw.line([(250, 120), (250, 550)], fill=outline_color, width=3)
            
        elif g_type == 'hoodie':
            # Hoodie with hood shape at top, front pocket
            # Hood: (180, 50) to (320, 140)
            draw.ellipse([185, 30, 315, 140], fill=fill_color, outline=outline_color, width=3)
            points = [
                (150, 130), (350, 130), (400, 200), (360, 550), 
                (140, 550), (100, 200)
            ]
            draw.polygon(points, fill=fill_color, outline=outline_color, width=3)
            # Pocket polygon
            draw.polygon([(200, 420), (300, 420), (320, 500), (180, 500)], fill=outline_color, outline=fill_color, width=2)
            
        elif g_type == 'glasses':
            # Double lenses connected by nose bridge
            draw.ellipse([120, 60, 220, 140], fill=fill_color, outline=(0, 0, 0, 255), width=4)
            draw.ellipse([280, 60, 380, 140], fill=fill_color, outline=(0, 0, 0, 255), width=4)
            draw.line([(220, 95), (280, 95)], fill=(0, 0, 0, 255), width=5) # Nose bridge
            # Temples (arms)
            draw.line([(120, 90), (60, 70)], fill=(0, 0, 0, 255), width=3)
            draw.line([(380, 90), (440, 70)], fill=(0, 0, 0, 255), width=3)
            
        elif g_type == 'sherwani':
            # Traditional royal coat silhouette with intricate center buttons
            points = [
                (160, 90), (340, 90), (370, 190), (360, 580), 
                (140, 580), (130, 190)
            ]
            draw.polygon(points, fill=fill_color, outline=outline_color, width=3)
            # Mandarine collar
            draw.polygon([(210, 90), (290, 90), (280, 60), (220, 60)], fill=outline_color)
            # Center placket & gold button dots
            draw.line([(250, 90), (250, 580)], fill=(212, 175, 55, 255), width=3)
            for y_val in range(120, 480, 40):
                draw.ellipse([246, y_val, 254, y_val+8], fill=(212, 175, 55, 255))
                
        elif g_type == 'pants':
            # Waist and two legs split
            points = [
                (170, 80), (330, 80), (350, 560), (270, 560), 
                (250, 280), (230, 560), (150, 560)
            ]
            draw.polygon(points, fill=fill_color, outline=outline_color, width=3)
            # Belt loops or fly line
            draw.line([(250, 80), (250, 160)], fill=outline_color, width=2)
            
        img.save(garment_path, "PNG")
        
        # 2. Create catalog thumbnail / model simulation card
        # An elegant card mockup with a gradient/solid modern background and garment overlay
        cat_img = Image.new("RGBA", (400, 500), (245, 245, 247, 255)) # Apple background #F5F5F7
        cat_draw = ImageDraw.Draw(cat_img)
        
        # Render a soft colored base background circle (Removed as requested)
        # cat_draw.ellipse([80, 100, 320, 340], fill=(color[0], color[1], color[2], 30))
        
        # Resize garment to fit nicely in catalog view
        g_w, g_h = img.size
        c_aspect = g_h / g_w
        cat_g_w = 220
        cat_g_h = int(cat_g_w * c_aspect)
        
        g_resized = img.resize((cat_g_w, cat_g_h), Image.Resampling.LANCZOS)
        
        # Overlay centered
        paste_x = int((400 - cat_g_w) / 2)
        paste_y = int((380 - cat_g_h) / 2) + 40
        cat_img.paste(g_resized, (paste_x, paste_y), g_resized)
        
        # Render clean text title & price label on card
        # Without TTF font availability, we use default bitmap fonts or clean drawings
        cat_draw.text((30, 420), f"{g_type.upper()} ITEM", fill=(29, 29, 31, 255))
        cat_draw.text((30, 445), "AI Virtual-Ready", fill=(110, 110, 115, 255))
        
        cat_img.convert("RGB").save(catalog_path, "JPEG", quality=95)


def seed_database(app):
    # Ensure categories are present
    categories_data = [
        ('Men', 'men'),
        ('Women', 'women'),
        ('Kids', 'kids'),
        ('Accessories', 'accessories'),
        ('Lingerie', 'lingerie')
    ]
    
    for name, slug in categories_data:
        if not Category.query.filter_by(slug=slug).first():
            db.session.add(Category(name=name, slug=slug))
    db.session.commit()
    
    # Generate the physical transparent mock clothes pngs and model covers
    generate_mock_assets(app.config['UPLOAD_FOLDER'])
    
    # Categories IDs lookup
    cat_lookup = {c.slug: c.id for c in Category.query.all()}
    
    # Pre-populate products
    products_data = [
        {
            'name': 'Crimson Summer Tee',
            'description': 'A premium cotton, lightweight t-shirt perfect for hot days. Designed with a relaxed fit and soft neckline, tailored for everyday comfort.',
            'price': 999.00,
            'category_id': cat_lookup['men'],
            'image_url': '/uploads/cat_crimson_tee.png',
            'garment_url': '/uploads/crimson_tee.png',
            'gender': 'Men',
            'style': 'Casual',
            'season': 'Summer',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Red,Crimson',
            'stock': 25
        },
        {
            'name': 'Classic Navy Blazer',
            'description': 'An ultra-premium wool blend jacket featuring structured shoulders, clean notch lapels, and tailored double-vents. A timeless office or formal event staple.',
            'price': 5999.00,
            'category_id': cat_lookup['men'],
            'image_url': '/uploads/cat_navy_blazer.png',
            'garment_url': '/uploads/navy_blazer.png',
            'gender': 'Men',
            'style': 'Formal',
            'season': 'Autumn',
            'occasion': 'Office',
            'body_type': 'Rectangle,Inverted Triangle,Hourglass',
            'colors': 'Navy,Blue,Black',
            'stock': 12
        },
        {
            'name': 'Emerald Linen Dress',
            'description': 'Flowing and breathable organic linen dress with a flattering cinched waist and A-line drape. Perfect for beach strolls, picnics, or premium weekend brunches.',
            'price': 3499.00,
            'category_id': cat_lookup['women'],
            'image_url': '/uploads/cat_emerald_dress.png',
            'garment_url': '/uploads/emerald_dress.png',
            'gender': 'Women',
            'style': 'Chic',
            'season': 'Summer',
            'occasion': 'Casual',
            'body_type': 'Hourglass,Triangle,Inverted Triangle,Rectangle',
            'colors': 'Green,Emerald',
            'stock': 18
        },
        {
            'name': 'Pastel Denim Jacket',
            'description': 'Classic heavy denim jacket in an modern washed pastel blue. Completed with premium metallic hardware and deep utility side pockets.',
            'price': 2999.00,
            'category_id': cat_lookup['women'],
            'image_url': '/uploads/cat_denim_jacket.png',
            'garment_url': '/uploads/denim_jacket.png',
            'gender': 'Women',
            'style': 'Streetwear',
            'season': 'Spring',
            'occasion': 'College',
            'body_type': 'Rectangle,Hourglass,Triangle,Oval',
            'colors': 'Blue,Pastel',
            'stock': 15
        },
        {
            'name': 'Sunshine Kids Hoodie',
            'description': 'Keep the little ones warm in style. Cozy brushed-cotton inner lining with standard kangaroo front pockets and a soft oversized drawstring hood.',
            'price': 1299.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_hoodie.png',
            'garment_url': '/uploads/kids_hoodie.png',
            'gender': 'Kids',
            'style': 'Sporty',
            'season': 'Winter',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Oval',
            'colors': 'Yellow,Orange',
            'stock': 30
        },
        {
            'name': 'Amber Sunglasses',
            'description': 'Elegant square-frame sunglasses with high-quality tortoiseshell frames and warm amber translucent lenses. Full UV400 eyes protection.',
            'price': 1999.00,
            'category_id': cat_lookup['accessories'],
            'image_url': '/uploads/cat_amber_shades.png',
            'garment_url': '/uploads/amber_shades.png',
            'gender': 'Accessories',
            'style': 'Casual',
            'season': 'Summer',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Hourglass,Triangle,Inverted Triangle,Oval',
            'colors': 'Gold,Amber,Brown',
            'stock': 50
        },
        {
            'name': 'Royal Wedding Sherwani',
            'description': 'Luxurious hand-stitched traditional coat made with gold brocade fabric. Embellished with ornamental designer metallic buttons and an elegant high mandarine collar.',
            'price': 14999.00,
            'category_id': cat_lookup['men'],
            'image_url': '/uploads/cat_sherwani.png',
            'garment_url': '/uploads/sherwani.png',
            'gender': 'Men',
            'style': 'Vintage',
            'season': 'Winter',
            'occasion': 'Wedding',
            'body_type': 'Rectangle,Inverted Triangle,Hourglass',
            'colors': 'Gold,Yellow,Maroon',
            'stock': 8
        },
        {
            'name': 'Midnight Office Trouser',
            'description': 'Sleek, straight-leg tailored office trouser made with comfortable wrinkle-resistant fabric. Standard button zip fly closures and deep hand pocket storage.',
            'price': 1899.00,
            'category_id': cat_lookup['men'],
            'image_url': '/uploads/cat_grey_trousers.png',
            'garment_url': '/uploads/grey_trousers.png',
            'gender': 'Men',
            'style': 'Formal',
            'season': 'All',
            'occasion': 'Office',
            'body_type': 'Rectangle,Triangle,Inverted Triangle,Oval',
            'colors': 'Grey,Charcoal,Black',
            'stock': 40
        },
        {
            'name': 'Seamless T-Shirt Bra',
            'description': 'Everyday seamless padded bra designed for full comfort and invisible lines under standard clothing.',
            'price': 1299.00,
            'category_id': cat_lookup['lingerie'],
            'image_url': '/uploads/cat_tshirt_bra.png',
            'garment_url': '/uploads/tshirt_bra.png',
            'gender': 'Women',
            'style': 'Chic',
            'season': 'All',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Hourglass,Inverted Triangle,Oval',
            'colors': 'Beige,Nude',
            'stock': 40
        },
        {
            'name': 'Delicate Lace Bralette',
            'description': 'Beautiful wire-free lace bralette with adjustable straps and soft scalloped edges.',
            'price': 1499.00,
            'category_id': cat_lookup['lingerie'],
            'image_url': '/uploads/cat_lace_bralette.png',
            'garment_url': '/uploads/lace_bralette.png',
            'gender': 'Women',
            'style': 'Chic',
            'season': 'All',
            'occasion': 'Festival',
            'body_type': 'Rectangle,Triangle,Hourglass,Inverted Triangle,Oval',
            'colors': 'Black',
            'stock': 25
        },
        {
            'name': 'Racerback Sports Bra',
            'description': 'High-impact racerback sports bra designed for high-intensity training with moisture-wicking fabric.',
            'price': 1899.00,
            'category_id': cat_lookup['lingerie'],
            'image_url': '/uploads/cat_sports_bra.png',
            'garment_url': '/uploads/sports_bra.png',
            'gender': 'Women',
            'style': 'Sporty',
            'season': 'All',
            'occasion': 'College',
            'body_type': 'Rectangle,Triangle,Hourglass,Inverted Triangle,Oval',
            'colors': 'Grey,Charcoal',
            'stock': 35
        },
        {
            'name': 'Strapless Support Bra',
            'description': 'Convertible strapless support bra with non-slip lining, offering clean support for off-shoulder tops and gowns.',
            'price': 1699.00,
            'category_id': cat_lookup['lingerie'],
            'image_url': '/uploads/cat_strapless_bra.png',
            'garment_url': '/uploads/strapless_bra.png',
            'gender': 'Women',
            'style': 'Formal',
            'season': 'All',
            'occasion': 'Wedding',
            'body_type': 'Rectangle,Triangle,Hourglass,Inverted Triangle,Oval',
            'colors': 'White',
            'stock': 20
        },
        {
            'name': 'Floral Sweetheart Dress',
            'description': 'Delightful floral-print summer midi dress with balloon sleeves and a soft sweetheart neckline.',
            'price': 3999.00,
            'category_id': cat_lookup['women'],
            'image_url': '/uploads/cat_floral_dress.png',
            'garment_url': '/uploads/floral_dress.png',
            'gender': 'Women',
            'style': 'Chic',
            'season': 'Summer',
            'occasion': 'Casual',
            'body_type': 'Hourglass,Triangle,Inverted Triangle,Rectangle',
            'colors': 'Blue,Pink,White',
            'stock': 15
        },
        {
            'name': 'Boys Graphic Dinosaur Tee',
            'description': 'Fun and durable cotton graphic tee with a playful dinosaur print, perfect for everyday adventures.',
            'price': 799.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_dino_tee.png',
            'garment_url': '/uploads/kids_dino_tee.png',
            'gender': 'Kids',
            'style': 'Casual',
            'season': 'Summer',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Blue,Teal',
            'stock': 30
        },
        {
            'name': 'Kids Active Denim Shorts',
            'description': 'Comfy and adjustable light-wash denim shorts, designed with soft stretch fabric for active kids.',
            'price': 1199.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_denim_shorts.png',
            'garment_url': '/uploads/kids_denim_shorts.png',
            'gender': 'Kids',
            'style': 'Casual',
            'season': 'Summer',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Blue',
            'stock': 25
        },
        {
            'name': 'Kids Plaid Flannel Shirt',
            'description': 'Classic check pattern button-down flannel shirt in crimson and navy, brushed for extra soft comfort.',
            'price': 1499.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_plaid_shirt.png',
            'garment_url': '/uploads/kids_plaid_shirt.png',
            'gender': 'Kids',
            'style': 'Casual',
            'season': 'Autumn',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Red,Navy',
            'stock': 20
        },
        {
            'name': 'Boys Crewneck Sweatshirt',
            'description': 'Super soft cotton crewneck sweatshirt with ribbed cuffs and hem, designed for cold weather play.',
            'price': 1299.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_crewneck.png',
            'garment_url': '/uploads/kids_crewneck.png',
            'gender': 'Kids',
            'style': 'Casual',
            'season': 'Winter',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Blue,Grey',
            'stock': 30
        },
        {
            'name': 'Kids Active Jogger Pants',
            'description': 'Tough cotton twill cargo joggers with elastic drawstring waistband and functional utility side pockets.',
            'price': 1499.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_joggers.png',
            'garment_url': '/uploads/kids_joggers.png',
            'gender': 'Kids',
            'style': 'Sporty',
            'season': 'All',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Green,Olive',
            'stock': 35
        },
        {
            'name': 'Boys Striped Polo Shirt',
            'description': 'Classic fit cotton polo shirt with horizontal stripes and breathable pique weave structure.',
            'price': 999.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_polo.png',
            'garment_url': '/uploads/kids_polo.png',
            'gender': 'Kids',
            'style': 'Chic',
            'season': 'Summer',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Coral,Orange',
            'stock': 40
        },
        {
            'name': 'Kids Tailored Chino Pants',
            'description': 'Smart flat-front chino trousers with inner adjustable button tabs for the perfect tailored fit.',
            'price': 1699.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_chinos.png',
            'garment_url': '/uploads/kids_chinos.png',
            'gender': 'Kids',
            'style': 'Formal',
            'season': 'All',
            'occasion': 'Wedding',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Beige,Tan',
            'stock': 20
        },
        {
            'name': 'Boys Windbreaker Jacket',
            'description': 'Water-resistant lightweight windbreaker jacket with mesh lining and a protective fitted hood.',
            'price': 1899.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_windbreaker.png',
            'garment_url': '/uploads/kids_windbreaker.png',
            'gender': 'Kids',
            'style': 'Sporty',
            'season': 'Winter',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Teal,Blue',
            'stock': 25
        },
        {
            'name': 'Kids Cozy Fleece Vest',
            'description': 'Cozy sleeveless zip-up fleece vest, ideal for layering during active outdoor play.',
            'price': 1099.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_vest.png',
            'garment_url': '/uploads/kids_vest.png',
            'gender': 'Kids',
            'style': 'Casual',
            'season': 'Winter',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Brown,Tan',
            'stock': 30
        },
        {
            'name': 'Boys Printed Boardshorts',
            'description': 'Quick-drying tropical print swim boardshorts with secure velcro flap closure and mesh lining.',
            'price': 899.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_boardshorts.png',
            'garment_url': '/uploads/kids_boardshorts.png',
            'gender': 'Kids',
            'style': 'Casual',
            'season': 'Summer',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Orange,Red',
            'stock': 40
        },
        {
            'name': 'Kids Breathable Linen Shirt',
            'description': 'Lightweight and breathable long-sleeve linen blend shirt, perfect for warm weather events.',
            'price': 1599.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_linen_shirt.png',
            'garment_url': '/uploads/kids_linen_shirt.png',
            'gender': 'Kids',
            'style': 'Chic',
            'season': 'Summer',
            'occasion': 'Wedding',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'White,Beige',
            'stock': 15
        },
        {
            'name': 'Boys Insulated Puffer Jacket',
            'description': 'Ultra-warm insulated winter puffer coat with fleece lining and windproof storm cuffs.',
            'price': 2499.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_puffer.png',
            'garment_url': '/uploads/kids_puffer.png',
            'gender': 'Kids',
            'style': 'Casual',
            'season': 'Winter',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Grey,Black',
            'stock': 12
        },
        {
            'name': 'Kids Denim Work Overalls',
            'description': 'Classic durable blue denim overalls with adjustable slide straps and multiple utility pockets.',
            'price': 1999.00,
            'category_id': cat_lookup['kids'],
            'image_url': '/uploads/cat_kids_overalls.png',
            'garment_url': '/uploads/kids_overalls.png',
            'gender': 'Kids',
            'style': 'Casual',
            'season': 'All',
            'occasion': 'Casual',
            'body_type': 'Rectangle,Triangle,Oval,Inverted Triangle',
            'colors': 'Blue',
            'stock': 18
        }
    ]
    
    for prod in products_data:
        existing = Product.query.filter_by(name=prod['name']).first()
        if not existing:
            new_prod = Product(**prod)
            db.session.add(new_prod)
        else:
            existing.price = prod['price']
            existing.description = prod['description']
            
    db.session.commit()
    
    # Check if admin user is present. If not, create default admin for developer testing
    admin_email = "admin@smartfashion.com"
    if not User.query.filter_by(email=admin_email).first():
        admin = User(
            name="Platform Admin",
            email=admin_email,
            role="admin",
            gender="Men",
            age=30,
            body_type="Rectangle",
            preferred_colors="Black,Grey,Navy",
            preferred_style="Formal"
        )
        admin.set_password("admin123")
        db.session.add(admin)
        db.session.commit()


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True)
