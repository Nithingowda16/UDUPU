from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from database import db
from models import User, Session
from datetime import datetime, timedelta
import re
import random
import uuid

auth_bp = Blueprint('auth', __name__)

def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    name = data.get('name')
    email = data.get('email')
    password = data.get('password')
    
    if not name or not email or not password:
        return jsonify({'message': 'Missing required fields'}), 400
        
    if not is_valid_email(email):
        return jsonify({'message': 'Invalid email format'}), 400
        
    if len(password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters'}), 400
        
    if User.query.filter_by(email=email).first():
        return jsonify({'message': 'Email already registered'}), 409
        
    try:
        user = User(name=name, email=email)
        user.set_password(password)
        
        # Check if first user, make admin for testing convenience
        if User.query.count() == 0:
            user.role = 'admin'
            
        db.session.add(user)
        db.session.commit()
        return jsonify({'message': 'User registered successfully'}), 211
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error creating user: {str(e)}'}), 500


@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid email or password'}), 401
        
    # Generate token
    token = create_access_token(identity=str(user.id))
    
    # Store session info
    expires_at = datetime.utcnow() + timedelta(hours=24)
    session = Session(
        user_id=user.id,
        token=token,
        ip_address=request.remote_addr,
        user_agent=request.headers.get('User-Agent'),
        expires_at=expires_at
    )
    db.session.add(session)
    db.session.commit()
    
    return jsonify({
        'token': token,
        'user': user.to_dict()
    }), 200


@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json() or {}
    email = data.get('email')
    if not email:
        return jsonify({'message': 'Email is required'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        # Avoid user enumeration by returning 200 even if email doesn't exist
        return jsonify({'message': 'If the email exists, a reset link will be simulated.'}), 200
        
    # Generate simulated code / temporary token
    # In production, send email. Here, we'll return a simulated success state.
    return jsonify({
        'message': 'Password reset simulated successfully. Use the reset-password endpoint with your email.',
        'simulation': True,
        'email': email
    }), 200


@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email')
    new_password = data.get('password')
    
    if not email or not new_password:
        return jsonify({'message': 'Email and new password are required'}), 400
        
    if len(new_password) < 6:
        return jsonify({'message': 'Password must be at least 6 characters'}), 400
        
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    try:
        user.set_password(new_password)
        db.session.commit()
        return jsonify({'message': 'Password reset successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error resetting password: {str(e)}'}), 500


@auth_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'message': 'User not found'}), 404
    return jsonify(user.to_dict()), 200


@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    user_id = get_jwt_identity()
    user = User.query.get(int(user_id))
    if not user:
        return jsonify({'message': 'User not found'}), 404
        
    data = request.get_json() or {}
    
    # Core details
    if 'name' in data:
        user.name = data['name']
        
    # Styling details
    if 'gender' in data:
        user.gender = data['gender']
    if 'age' in data:
        user.age = int(data['age']) if data['age'] else None
    if 'body_type' in data:
        user.body_type = data['body_type']
    if 'preferred_colors' in data:
        # Convert list to comma-separated string
        colors = data['preferred_colors']
        if isinstance(colors, list):
            user.preferred_colors = ",".join(colors)
        else:
            user.preferred_colors = colors
    if 'preferred_style' in data:
        user.preferred_style = data['preferred_style']
        
    try:
        db.session.commit()
        return jsonify({
            'message': 'Profile updated successfully',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error updating profile: {str(e)}'}), 500


@auth_bp.route('/otp/send', methods=['POST'])
def send_otp():
    data = request.get_json() or {}
    phone_number = data.get('phone_number')
    
    if not phone_number:
        return jsonify({'message': 'Phone number is required'}), 400
        
    phone_number = re.sub(r'[^\d+]', '', phone_number)
    if len(phone_number) < 8:
        return jsonify({'message': 'Invalid phone number format'}), 400
        
    try:
        user = User.query.filter_by(phone_number=phone_number).first()
        if not user:
            # Auto-register phone user
            email = f"phone_{phone_number}@udupu.com"
            while User.query.filter_by(email=email).first():
                email = f"phone_{phone_number}_{random.randint(1000, 9999)}@udupu.com"
                
            user = User(
                name=f"Guest {phone_number[-4:]}",
                email=email,
                phone_number=phone_number
            )
            user.set_password(uuid.uuid4().hex)
            db.session.add(user)
            db.session.flush()
            
        otp = f"{random.randint(100000, 999999)}"
        user.otp_code = otp
        user.otp_expiry = datetime.utcnow() + timedelta(minutes=5)
        
        db.session.commit()
        
        print(f"\n[OTP Simulation] Phone: {phone_number} | OTP: {otp}\n")
        
        return jsonify({
            'message': 'OTP sent successfully (simulated)',
            'simulation_otp': otp,
            'phone_number': phone_number
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error generating OTP: {str(e)}'}), 500


@auth_bp.route('/otp/verify', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    phone_number = data.get('phone_number')
    otp_code = data.get('otp_code')
    
    if not phone_number or not otp_code:
        return jsonify({'message': 'Phone number and OTP code are required'}), 400
        
    phone_number = re.sub(r'[^\d+]', '', phone_number)
    
    user = User.query.filter_by(phone_number=phone_number).first()
    if not user:
        return jsonify({'message': 'Verification failed. Phone number not found.'}), 404
        
    if not user.otp_code or user.otp_code != otp_code:
        return jsonify({'message': 'Invalid OTP code. Please try again.'}), 401
        
    if datetime.utcnow() > user.otp_expiry:
        return jsonify({'message': 'OTP has expired. Please request a new one.'}), 401
        
    try:
        user.otp_code = None
        user.otp_expiry = None
        
        token = create_access_token(identity=str(user.id))
        
        expires_at = datetime.utcnow() + timedelta(hours=24)
        session = Session(
            user_id=user.id,
            token=token,
            ip_address=request.remote_addr,
            user_agent=request.headers.get('User-Agent'),
            expires_at=expires_at
        )
        db.session.add(session)
        db.session.commit()
        
        return jsonify({
            'token': token,
            'user': user.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': f'Error verifying OTP: {str(e)}'}), 500
