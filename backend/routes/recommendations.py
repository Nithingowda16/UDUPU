from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, jwt_required
from database import db
from models import Product, User
from services.recommender import RecommenderEngine

recommendations_bp = Blueprint('recommendations', __name__)

@recommendations_bp.route('', methods=['GET'])
@jwt_required()
def get_user_recommendations():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    # Query parameters can override default profile preferences
    user_profile = {
        'gender': request.args.get('gender') or user.gender or 'Unisex',
        'age': request.args.get('age', type=int) or user.age or 25,
        'body_type': request.args.get('body_type') or user.body_type or 'Rectangle',
        'preferred_style': request.args.get('preferred_style') or user.preferred_style or 'Casual',
        'occasion': request.args.get('occasion') or 'Casual',
        'season': request.args.get('season') or 'All',
        'preferred_colors': (request.args.get('preferred_colors').split(',') if request.args.get('preferred_colors') 
                             else (user.preferred_colors.split(',') if user.preferred_colors else []))
    }
    
    products = Product.query.all()
    recommended_products = RecommenderEngine.get_recommendations(user_profile, products)
    
    return jsonify({
        'profile_used': {
            'gender': user_profile['gender'],
            'age': user_profile['age'],
            'body_type': user_profile['body_type'],
            'preferred_style': user_profile['preferred_style'],
            'occasion': user_profile['occasion'],
            'season': user_profile['season'],
            'preferred_colors': user_profile['preferred_colors']
        },
        'recommendations': [p.to_dict() for p in recommended_products]
    }), 200


@recommendations_bp.route('/custom', methods=['POST'])
def get_custom_recommendations():
    data = request.get_json() or {}
    
    user_profile = {
        'gender': data.get('gender', 'Unisex'),
        'age': int(data.get('age', 25)) if data.get('age') else 25,
        'body_type': data.get('body_type', 'Rectangle'),
        'preferred_colors': data.get('preferred_colors', []),
        'preferred_style': data.get('preferred_style', 'Casual'),
        'occasion': data.get('occasion', 'Casual'),
        'season': data.get('season', 'All')
    }
    
    products = Product.query.all()
    recommended_products = RecommenderEngine.get_recommendations(user_profile, products)
    
    return jsonify({
        'profile_used': user_profile,
        'recommendations': [p.to_dict() for p in recommended_products]
    }), 200
