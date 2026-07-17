from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import Wishlist, Product

wishlist_bp = Blueprint('wishlist', __name__)

@wishlist_bp.route('', methods=['GET'])
@jwt_required()
def get_wishlist():
    user_id = get_jwt_identity()
    wishlist_items = Wishlist.query.filter_by(user_id=int(user_id)).all()
    return jsonify([w.to_dict() for w in wishlist_items]), 200

@wishlist_bp.route('', methods=['POST'])
@jwt_required()
def add_to_wishlist():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    product_id = data.get('product_id')
    
    if not product_id:
        return jsonify({'message': 'Product ID is required'}), 400
        
    product = Product.query.get(product_id)
    if not product:
        return jsonify({'message': 'Product not found'}), 404
        
    # Check if already exists in wishlist
    existing = Wishlist.query.filter_by(user_id=int(user_id), product_id=product_id).first()
    if existing:
        return jsonify({'message': 'Product already in wishlist', 'wishlist': existing.to_dict()}), 200
        
    try:
        item = Wishlist(user_id=int(user_id), product_id=product_id)
        db.session.add(item)
        db.session.commit()
        return jsonify(item.to_dict()), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error adding to wishlist: {str(e)}'}), 500

@wishlist_bp.route('/<int:product_id>', methods=['DELETE'])
@jwt_required()
def remove_from_wishlist(product_id):
    user_id = get_jwt_identity()
    item = Wishlist.query.filter_by(user_id=int(user_id), product_id=product_id).first()
    
    if not item:
        return jsonify({'message': 'Item not found in wishlist'}), 404
        
    try:
        db.session.delete(item)
        db.session.commit()
        return jsonify({'message': 'Item removed from wishlist'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error removing from wishlist: {str(e)}'}), 500
