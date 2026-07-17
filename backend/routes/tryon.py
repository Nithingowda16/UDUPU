import os
import uuid
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from database import db
from models import TryOnHistory, Product, User
from services.image_processor import ImageProcessor

tryon_bp = Blueprint('tryon', __name__)

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in {'png', 'jpg', 'jpeg', 'webp'}

@tryon_bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_user_image():
    if 'image' not in request.files:
        return jsonify({'message': 'No image file uploaded'}), 400
        
    file = request.files['image']
    if file.filename == '':
        return jsonify({'message': 'Empty filename'}), 400
        
    if not allowed_file(file.filename):
        return jsonify({'message': 'Invalid file extension. Only PNG, JPG, JPEG, and WEBP allowed.'}), 400
        
    try:
        filename = secure_filename(file.filename)
        unique_name = f"user_{uuid.uuid4().hex}_{filename}"
        save_path = os.path.join(current_app.config['UPLOAD_FOLDER'], unique_name)
        file.save(save_path)
        
        # Detect body region to assist client UI layout
        detection = ImageProcessor.detect_body_region(save_path)
        skin_analysis = ImageProcessor.analyze_skin_tone(save_path)
        
        return jsonify({
            'message': 'Image uploaded successfully',
            'user_image_path': unique_name,
            'user_image_url': f"/uploads/{unique_name}",
            'detection': detection,
            'skin_analysis': skin_analysis
        }), 200
        
    except Exception as e:
        return jsonify({'message': f'Error uploading image: {str(e)}'}), 500


@tryon_bp.route('/generate', methods=['POST'])
@jwt_required()
def generate_tryon():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    
    product_id = data.get('product_id')
    user_image_path = data.get('user_image_path')
    background_preset = data.get('background_preset', 'original')
    
    # Transformation parameters
    scale = float(data.get('scale', 1.0))
    rotation = float(data.get('rotation', 0.0))
    offset_x = int(data.get('offset_x', 0))
    offset_y = int(data.get('offset_y', 0))
    auto_align = bool(data.get('auto_align', True))
    
    if not user_image_path:
        return jsonify({'message': 'user_image_path is required'}), 400
        
    # Check background file exists
    bg_full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], user_image_path)
    if not os.path.exists(bg_full_path):
        return jsonify({'message': 'User background image not found on server'}), 404
        
    # Check if a list of garments is passed for multi-item tryon
    garments_list = data.get('garments', [])
    
    if not garments_list and product_id:
        # Fallback to single item payload
        garments_list = [{
            'product_id': product_id,
            'scale': scale,
            'rotation': rotation,
            'offset_x': offset_x,
            'offset_y': offset_y
        }]
        
    if not garments_list:
        return jsonify({'message': 'No garments specified for tryon'}), 400
        
    # Verify and load all garment details
    layers = []
    for g in garments_list:
        pid = g.get('product_id')
        prod = Product.query.get(pid)
        if not prod:
            return jsonify({'message': f'Product {pid} not found'}), 404
            
        g_filename = prod.garment_url.replace('/uploads/', '')
        g_full_path = os.path.join(current_app.config['UPLOAD_FOLDER'], g_filename)
        if not os.path.exists(g_full_path):
            return jsonify({'message': f'Garment file for product {pid} not found'}), 404
            
        layers.append({
            'path': g_full_path,
            'scale': float(g.get('scale', 1.0)),
            'rotation': float(g.get('rotation', 0.0)),
            'offset_x': int(g.get('offset_x', 0)),
            'offset_y': int(g.get('offset_y', 0)),
            'category': prod.category.slug if prod.category else 'women',
            'product_id': pid
        })
        
    try:
        # Define output destination
        output_filename = f"result_{uuid.uuid4().hex}.png"
        output_full_path = os.path.join(current_app.config['GENERATED_FOLDER'], output_filename)
        
        # Call service to composite images (supporting multi-layer overlay)
        success = ImageProcessor.overlay_garments(
            user_image_path=bg_full_path,
            garment_layers=layers,
            output_image_path=output_full_path,
            auto_align=auto_align,
            background_preset=background_preset
        )
        
        if not success:
            return jsonify({'message': 'Image composition failed'}), 500
            
        # Save to TryOnHistory
        history = TryOnHistory(
            user_id=int(user_id),
            user_image_path=user_image_path,
            product_id=layers[0]['product_id'],
            result_image_path=output_filename,
            scale=layers[0]['scale'],
            rotation=layers[0]['rotation'],
            offset_x=layers[0]['offset_x'],
            offset_y=layers[0]['offset_y']
        )
        db.session.add(history)
        db.session.commit()
        
        return jsonify(history.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Failed to process try-on image: {str(e)}'}), 500


@tryon_bp.route('/history', methods=['GET'])
@jwt_required()
def get_tryon_history():
    user_id = get_jwt_identity()
    histories = TryOnHistory.query.filter_by(user_id=int(user_id)).order_by(TryOnHistory.created_at.desc()).all()
    return jsonify([h.to_dict() for h in histories]), 200


@tryon_bp.route('/history/<int:id>', methods=['DELETE'])
@jwt_required()
def delete_tryon_history(id):
    user_id = get_jwt_identity()
    history = TryOnHistory.query.filter_by(id=id, user_id=int(user_id)).first()
    if not history:
        return jsonify({'message': 'Try-on record not found'}), 404
        
    try:
        # Delete output file from disk if it exists
        output_path = os.path.join(current_app.config['GENERATED_FOLDER'], history.result_image_path)
        if os.path.exists(output_path):
            os.remove(output_path)
            
        db.session.delete(history)
        db.session.commit()
        return jsonify({'message': 'Try-on record deleted successfully'}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error deleting record: {str(e)}'}), 500
