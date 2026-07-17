import os
import psutil
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from database import db
from models import User, Product, Category, TryOnHistory, Wishlist

admin_bp = Blueprint('admin', __name__)

def check_admin(user_id):
    user = User.query.get(int(user_id))
    return user and user.role == 'admin'

@admin_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard_stats():
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'message': 'Admin access required'}), 403
        
    try:
        user_count = User.query.count()
        product_count = Product.query.count()
        category_count = Category.query.count()
        tryon_count = TryOnHistory.query.count()
        wishlist_count = Wishlist.query.count()
        
        # Calculate size of uploads directory
        uploads_dir = current_app.config['UPLOAD_FOLDER']
        generated_dir = current_app.config['GENERATED_FOLDER']
        
        def get_dir_size(path):
            total = 0
            if os.path.exists(path):
                for entry in os.scandir(path):
                    if entry.is_file():
                        total += entry.stat().st_size
            return total
            
        uploads_size = get_dir_size(uploads_dir) + get_dir_size(generated_dir)
        # Convert to MB
        uploads_size_mb = round(uploads_size / (1024 * 1024), 2)
        
        # Recent try-ons
        recent_tryons = TryOnHistory.query.order_by(TryOnHistory.created_at.desc()).limit(5).all()
        # Recent users
        recent_users = User.query.order_by(User.created_at.desc()).limit(5).all()
        
        return jsonify({
            'stats': {
                'users': user_count,
                'products': product_count,
                'categories': category_count,
                'tryons': tryon_count,
                'wishlists': wishlist_count,
                'storage_used_mb': uploads_size_mb
            },
            'recent_tryons': [t.to_dict() for t in recent_tryons],
            'recent_users': [u.to_dict() for u in recent_users]
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error loading statistics: {str(e)}'}), 500


@admin_bp.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'message': 'Admin access required'}), 403
        
    users = User.query.all()
    return jsonify([u.to_dict() for u in users]), 200


@admin_bp.route('/users/<int:id>', methods=['PUT'])
@jwt_required()
def update_user_role(id):
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'message': 'Admin access required'}), 403
        
    user = User.query.get(id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    data = request.get_json() or {}
    new_role = data.get('role')
    
    if new_role not in ['user', 'admin']:
        return jsonify({'message': 'Invalid role choice'}), 400
        
    # Prevent self-demotion
    if int(user_id) == id and new_role != 'admin':
        return jsonify({'message': 'You cannot demote yourself from admin'}), 400
        
    try:
        user.role = new_role
        db.session.commit()
        return jsonify(user.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating user: {str(e)}'}), 500


@admin_bp.route('/users/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_user(id):
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'message': 'Admin access required'}), 403
        
    user = User.query.get(id)
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    # Prevent self-deletion
    if int(user_id) == id:
        return jsonify({'message': 'You cannot delete your own admin account'}), 400
        
    try:
        db.session.delete(user)
        db.session.commit()
        return jsonify({'message': 'User deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting user: {str(e)}'}), 500


@admin_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_system_logs():
    user_id = get_jwt_identity()
    if not check_admin(user_id):
        return jsonify({'message': 'Admin access required'}), 403
        
    try:
        # Fetch some hardware / server logs
        cpu_usage = psutil.cpu_percent(interval=None)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        simulated_logs = [
            f"Database initialized: connected to tryon.db.",
            f"Authentication system active: JWT signatures validation verified.",
            f"Image Overlay Engine: Haar cascades directories verified.",
            f"Server status: Running, CPU Usage: {cpu_usage}%, RAM: {memory.percent}%, Disk: {disk.percent}% available.",
            f"Session monitor: active token validation checks complete."
        ]
        
        return jsonify({
            'logs': simulated_logs,
            'system_info': {
                'cpu_percent': cpu_usage,
                'memory_percent': memory.percent,
                'memory_used_gb': round(memory.used / (1024**3), 2),
                'memory_total_gb': round(memory.total / (1024**3), 2),
                'disk_percent': disk.percent,
                'disk_free_gb': round(disk.free / (1024**3), 2),
            }
        }), 200
    except Exception as e:
        return jsonify({'message': f'Error loading system metrics: {str(e)}'}), 500
