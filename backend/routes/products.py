import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from database import db
from models import Product, Category, User

products_bp = Blueprint('products', __name__)

def check_admin(user_id):
    user = User.query.get(int(user_id))
    return user and user.role == 'admin'

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'webp'}

def save_upload_file(file, folder):
    if not file or file.filename == '':
        return None
    if not allowed_file(file.filename):
        raise ValueError("Invalid file extension")
        
    filename = secure_filename(file.filename)
    # Append unique ID to prevent collisions
    unique_name = f"{uuid.uuid4().hex}_{filename}"
    file_path = os.path.join(folder, unique_name)
    file.save(file_path)
    return unique_name

@products_bp.route('', methods=['GET'])
def get_products():
    # Filtering parameters
    category_id = request.args.get('category_id', type=int)
    gender = request.args.get('gender')
    style = request.args.get('style')
    season = request.args.get('season')
    occasion = request.args.get('occasion')
    search = request.args.get('search')
    
    # Sorting & Pagination
    sort_by = request.args.get('sort_by', 'created_at')  # price_asc, price_desc, created_at
    page = request.args.get('page', 1, type=int)
    limit = request.args.get('limit', 12, type=int)
    
    query = Product.query
    
    # Apply filters
    if category_id:
        query = query.filter(Product.category_id == category_id)
    if gender:
        query = query.filter(Product.gender.ilike(gender))
    if style:
        query = query.filter(Product.style.ilike(style))
    if season:
        query = query.filter(Product.season.ilike(season))
    if occasion:
        query = query.filter(Product.occasion.ilike(occasion))
    if search:
        query = query.filter(
            Product.name.ilike(f"%{search}%") | 
            Product.description.ilike(f"%{search}%")
        )
        
    # Apply sorting
    if sort_by == 'price_asc':
        query = query.order_by(Product.price.asc())
    elif sort_by == 'price_desc':
        query = query.order_by(Product.price.desc())
    else:
        query = query.order_by(Product.created_at.desc())
        
    # Paginate
    paginated_data = query.paginate(page=page, per_page=limit, error_out=False)
    
    return jsonify({
        'products': [p.to_dict() for p in paginated_data.items],
        'total': paginated_data.total,
        'pages': paginated_data.pages,
        'current_page': page
    }), 200


@products_bp.route('/<int:id>', methods=['GET'])
def get_product(id):
    product = Product.query.get(id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404
    return jsonify(product.to_dict()), 200


@products_bp.route('', methods=['POST'])
@jwt_required()
def create_product():
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'message': 'Admin access required'}), 403
        
    try:
        # Check if form data
        name = request.form.get('name')
        price = request.form.get('price', type=float)
        category_id = request.form.get('category_id', type=int)
        description = request.form.get('description', '')
        gender = request.form.get('gender', 'Unisex')
        style = request.form.get('style', 'Casual')
        season = request.form.get('season', 'All')
        occasion = request.form.get('occasion', 'Casual')
        body_type = request.form.get('body_type', 'Rectangle,Hourglass,Triangle,Inverted Triangle,Oval')
        colors = request.form.get('colors', '')
        stock = request.form.get('stock', 10, type=int)
        
        if not name or price is None or not category_id:
            return jsonify({'message': 'Name, price, and category_id are required'}), 400
            
        # File handling
        image_file = request.files.get('image')
        garment_file = request.files.get('garment')
        
        if not image_file or not garment_file:
            return jsonify({'message': 'Both preview image and transparent garment PNG are required'}), 400
            
        image_name = save_upload_file(image_file, current_app.config['UPLOAD_FOLDER'])
        garment_name = save_upload_file(garment_file, current_app.config['UPLOAD_FOLDER'])
        
        product = Product(
            name=name,
            description=description,
            price=price,
            category_id=category_id,
            image_url=f"/uploads/{image_name}",
            garment_url=f"/uploads/{garment_name}",
            gender=gender,
            style=style,
            season=season,
            occasion=occasion,
            body_type=body_type,
            colors=colors,
            stock=stock
        )
        
        db.session.add(product)
        db.session.commit()
        return jsonify(product.to_dict()), 201
        
    except ValueError as ve:
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating product: {str(e)}'}), 500


@products_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
def update_product(id):
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'message': 'Admin access required'}), 403
        
    product = Product.query.get(id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404
        
    try:
        # Form values if any
        if 'name' in request.form:
            product.name = request.form.get('name')
        if 'price' in request.form:
            product.price = request.form.get('price', type=float)
        if 'category_id' in request.form:
            product.category_id = request.form.get('category_id', type=int)
        if 'description' in request.form:
            product.description = request.form.get('description')
        if 'gender' in request.form:
            product.gender = request.form.get('gender')
        if 'style' in request.form:
            product.style = request.form.get('style')
        if 'season' in request.form:
            product.season = request.form.get('season')
        if 'occasion' in request.form:
            product.occasion = request.form.get('occasion')
        if 'body_type' in request.form:
            product.body_type = request.form.get('body_type')
        if 'colors' in request.form:
            product.colors = request.form.get('colors')
        if 'stock' in request.form:
            product.stock = request.form.get('stock', type=int)
            
        # File uploads if provided
        image_file = request.files.get('image')
        if image_file:
            image_name = save_upload_file(image_file, current_app.config['UPLOAD_FOLDER'])
            product.image_url = f"/uploads/{image_name}"
            
        garment_file = request.files.get('garment')
        if garment_file:
            garment_name = save_upload_file(garment_file, current_app.config['UPLOAD_FOLDER'])
            product.garment_url = f"/uploads/{garment_name}"
            
        db.session.commit()
        return jsonify(product.to_dict()), 200
        
    except ValueError as ve:
        return jsonify({'message': str(ve)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating product: {str(e)}'}), 500


@products_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_product(id):
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'message': 'Admin access required'}), 403
        
    product = Product.query.get(id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404
        
    try:
        db.session.delete(product)
        db.session.commit()
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting product: {str(e)}'}), 500
