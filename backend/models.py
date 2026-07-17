from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash
from database import db
import json

class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    name = db.Column(db.String(80), nullable=False)
    role = db.Column(db.String(20), default='user')  # 'user' or 'admin'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Body/Style preferences for Recommendation
    gender = db.Column(db.String(20), nullable=True)
    age = db.Column(db.Integer, nullable=True)
    body_type = db.Column(db.String(30), nullable=True)  # Hourglass, Rectangle, Triangle, Oval, Inverted Triangle
    preferred_colors = db.Column(db.String(200), nullable=True)  # Comma-separated or JSON list
    preferred_style = db.Column(db.String(50), nullable=True)  # Casual, Formal, Vintage, Sporty, Streetwear
    
    phone_number = db.Column(db.String(20), unique=True, nullable=True, index=True)
    otp_code = db.Column(db.String(6), nullable=True)
    otp_expiry = db.Column(db.DateTime, nullable=True)

    # Relationships
    wishlist_items = db.relationship('Wishlist', backref='user', lazy=True, cascade="all, delete-orphan")
    tryon_histories = db.relationship('TryOnHistory', backref='user', lazy=True, cascade="all, delete-orphan")
    sessions = db.relationship('Session', backref='user', lazy=True, cascade="all, delete-orphan")

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'phone_number': self.phone_number,
            'name': self.name,
            'role': self.role,
            'created_at': self.created_at.isoformat(),
            'gender': self.gender,
            'age': self.age,
            'body_type': self.body_type,
            'preferred_colors': self.preferred_colors.split(',') if self.preferred_colors else [],
            'preferred_style': self.preferred_style
        }


class Category(db.Model):
    __tablename__ = 'categories'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    slug = db.Column(db.String(50), unique=True, nullable=False)
    
    products = db.relationship('Product', backref='category', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'slug': self.slug
        }


class Product(db.Model):
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    price = db.Column(db.Float, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey('categories.id'), nullable=False)
    image_url = db.Column(db.String(256), nullable=False)  # Catalog preview image (URL path)
    garment_url = db.Column(db.String(256), nullable=False)  # Transparent PNG garment overlay (URL path)
    
    # Recommendation metadata
    gender = db.Column(db.String(20), nullable=False)  # Men, Women, Kids, Unisex, Accessories
    style = db.Column(db.String(50), nullable=False)  # Casual, Formal, Sporty, Chic, Vintage, Streetwear
    season = db.Column(db.String(50), nullable=False)  # Summer, Winter, Spring, Autumn, All
    occasion = db.Column(db.String(50), nullable=False)  # Office, Wedding, College, Festival, Casual, Party
    body_type = db.Column(db.String(100), nullable=True)  # Comma separated list of compatible body shapes
    colors = db.Column(db.String(200), nullable=True)  # Comma-separated colors (e.g. "Black,White,Grey")
    stock = db.Column(db.Integer, default=10)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'price': self.price,
            'category_id': self.category_id,
            'category_name': self.category.name if self.category else '',
            'image_url': self.image_url,
            'garment_url': self.garment_url,
            'gender': self.gender,
            'style': self.style,
            'season': self.season,
            'occasion': self.occasion,
            'body_types': self.body_type.split(',') if self.body_type else [],
            'colors': self.colors.split(',') if self.colors else [],
            'stock': self.stock,
            'created_at': self.created_at.isoformat()
        }


class TryOnHistory(db.Model):
    __tablename__ = 'tryon_histories'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user_image_path = db.Column(db.String(256), nullable=False)  # Path of uploaded background image
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=True)
    result_image_path = db.Column(db.String(256), nullable=False)  # Path of composited result image
    
    # Position offsets / transformation matrices saved for re-render
    scale = db.Column(db.Float, default=1.0)
    rotation = db.Column(db.Float, default=0.0)
    offset_x = db.Column(db.Integer, default=0)
    offset_y = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        product = Product.query.get(self.product_id) if self.product_id else None
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_image_url': f"/uploads/{self.user_image_path}",
            'product': product.to_dict() if product else None,
            'result_image_url': f"/generated/{self.result_image_path}",
            'scale': self.scale,
            'rotation': self.rotation,
            'offset_x': self.offset_x,
            'offset_y': self.offset_y,
            'created_at': self.created_at.isoformat()
        }


class Wishlist(db.Model):
    __tablename__ = 'wishlists'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        product = Product.query.get(self.product_id)
        return {
            'id': self.id,
            'user_id': self.user_id,
            'product_id': self.product_id,
            'product': product.to_dict() if product else None,
            'created_at': self.created_at.isoformat()
        }


class Session(db.Model):
    __tablename__ = 'sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(256), unique=True, nullable=False)
    ip_address = db.Column(db.String(45), nullable=True)
    user_agent = db.Column(db.String(256), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
