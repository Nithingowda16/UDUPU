from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Category, User

categories_bp = Blueprint('categories', __name__)

def check_admin(user_id):
    user = User.query.get(int(user_id))
    return user and user.role == 'admin'

@categories_bp.route('', methods=['GET'])
def get_categories():
    categories = Category.query.all()
    return jsonify([c.to_dict() for c in categories]), 200

@categories_bp.route('', methods=['POST'])
@jwt_required()
def create_category():
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'message': 'Admin access required'}), 403
        
    data = request.get_json() or {}
    name = data.get('name')
    slug = data.get('slug')
    
    if not name or not slug:
        return jsonify({'message': 'Name and slug are required'}), 400
        
    if Category.query.filter((Category.name == name) | (Category.slug == slug)).first():
        return jsonify({'message': 'Category name or slug already exists'}), 409
        
    try:
        category = Category(name=name, slug=slug)
        db.session.add(category)
        db.session.commit()
        return jsonify(category.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating category: {str(e)}'}), 500

@categories_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_category():
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'message': 'Admin access required'}), 403
        
    category = Category.query.get(id)
    if not category:
        return jsonify({'message': 'Category not found'}), 404
        
    try:
        db.session.delete(category)
        db.session.commit()
        return jsonify({'message': 'Category deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting category: {str(e)}'}), 500
