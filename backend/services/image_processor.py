import os
import cv2
import numpy as np
from PIL import Image
from flask import current_app

try:
    import mediapipe as mp
    MEDIAPIPE_AVAILABLE = True
except ImportError:
    MEDIAPIPE_AVAILABLE = False

class ImageProcessor:
    @staticmethod
    def detect_body_region(image_path):
        """
        Detects upper body pose landmarks.
        Uses MediaPipe Pose tracking if available, falling back to Haar Cascades.
        Returns estimated chest center, scale width, and rotation tilt angle.
        """
        img = cv2.imread(image_path)
        if img is None:
            return None
            
        img_h, img_w = img.shape[:2]
        
        # Try MediaPipe first
        if MEDIAPIPE_AVAILABLE:
            try:
                mp_pose = mp.solutions.pose
                with mp_pose.Pose(static_image_mode=True, min_detection_confidence=0.5) as pose:
                    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    results = pose.process(img_rgb)
                    
                    if results.pose_landmarks:
                        landmarks = results.pose_landmarks.landmark
                        
                        # Left shoulder (11), Right shoulder (12)
                        ls = landmarks[mp_pose.PoseLandmark.LEFT_SHOULDER]
                        rs = landmarks[mp_pose.PoseLandmark.RIGHT_SHOULDER]
                        
                        ls_x, ls_y = int(ls.x * img_w), int(ls.y * img_h)
                        rs_x, rs_y = int(rs.x * img_w), int(rs.y * img_h)
                        
                        shoulder_cx = (ls_x + rs_x) / 2
                        shoulder_cy = (ls_y + rs_y) / 2
                        shoulder_w = np.sqrt((ls_x - rs_x) ** 2 + (ls_y - rs_y) ** 2)
                        
                        # Calculate shoulder tilt angle in degrees
                        angle_rad = np.arctan2(rs_y - ls_y, rs_x - ls_x)
                        angle_deg = np.degrees(angle_rad)
                        if angle_deg > 90:
                            angle_deg -= 180
                        elif angle_deg < -90:
                            angle_deg += 180
                            
                        chest_cx = int(shoulder_cx)
                        chest_cy = int(shoulder_cy + shoulder_w * 0.35)
                        
                        return {
                            'detected': 'mediapipe_3d_pose',
                            'center_x': chest_cx,
                            'center_y': chest_cy,
                            'width': int(shoulder_w * 1.25),
                            'height': int(shoulder_w * 1.5),
                            'rotation': float(-angle_deg),
                            'box': (int(min(ls_x, rs_x)), int(min(ls_y, rs_y)), int(shoulder_w), int(shoulder_w * 1.2))
                        }
            except Exception as e:
                print(f"MediaPipe processing error: {e}. Falling back to Haar cascades...")
                
        # Existing Haar cascade fallback
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Try upper body first
        upperbody_cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_upperbody.xml')
        face_cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
        
        upperbody_cascade = cv2.CascadeClassifier(upperbody_cascade_path)
        face_cascade = cv2.CascadeClassifier(face_cascade_path)
        
        # Upperbody detection
        bodies = upperbody_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=3, minSize=(100, 100))
        if len(bodies) > 0:
            bodies = sorted(bodies, key=lambda x: x[2] * x[3], reverse=True)
            bx, by, bw, bh = bodies[0]
            return {
                'detected': 'upper_body',
                'center_x': int(bx + bw / 2),
                'center_y': int(by + bh / 2),
                'width': int(bw),
                'height': int(bh),
                'rotation': 0.0,
                'box': (int(bx), int(by), int(bw), int(bh))
            }
            
        # Fallback to Face detection
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(50, 50))
        if len(faces) > 0:
            faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
            fx, fy, fw, fh = faces[0]
            estimated_width = int(fw * 3.5)
            estimated_height = int(fh * 5.0)
            center_x = int(fx + fw / 2)
            center_y = int(fy + fh * 2.8)
            
            center_x = max(0, min(center_x, img_w))
            center_y = max(0, min(center_y, img_h))
            
            return {
                'detected': 'face_based_estimate',
                'center_x': center_x,
                'center_y': center_y,
                'width': estimated_width,
                'height': estimated_height,
                'rotation': 0.0,
                'box': (int(fx), int(fy), int(fw), int(fh))
            }
            
        # Default fallback
        return {
            'detected': 'default_fallback',
            'center_x': int(img_w / 2),
            'center_y': int(img_h * 0.6),
            'width': int(img_w * 0.55),
            'height': int(img_h * 0.6),
            'rotation': 0.0,
            'box': (0, 0, img_w, img_h)
        }

    @staticmethod
    def overlay_garment(user_image_path, garment_image_path, output_image_path, 
                        scale=1.0, rotation=0.0, offset_x=0, offset_y=0, 
                        auto_align=True):
        """
        Overlays a transparent PNG garment image onto a user photo.
        Applies auto-alignment relative to detected body regions, 
        combined with manual scaling, rotation, and translation offsets.
        """
        # Open using PIL for reliable transparency handling
        try:
            background = Image.open(user_image_path).convert("RGBA")
            garment = Image.open(garment_image_path).convert("RGBA")
        except Exception as e:
            print(f"Error loading images: {e}")
            return False
            
        bg_w, bg_h = background.size
        
        # Determine base alignment center and dimensions
        if auto_align:
            body = ImageProcessor.detect_body_region(user_image_path)
            if body:
                base_cx = body['center_x']
                base_cy = body['center_y']
                base_w = body['width']
            else:
                base_cx = int(bg_w / 2)
                base_cy = int(bg_h * 0.6)
                base_w = int(bg_w * 0.5)
        else:
            base_cx = int(bg_w / 2)
            base_cy = int(bg_h / 2)
            base_w = int(bg_w * 0.5)
            
        # Apply manual offsets to alignment center
        target_cx = base_cx + offset_x
        target_cy = base_cy + offset_y
        
        # Calculate target size for the garment
        g_orig_w, g_orig_h = garment.size
        aspect_ratio = g_orig_h / g_orig_w
        
        target_w = int(base_w * scale)
        # Ensure we have a valid width
        target_w = max(20, min(target_w, bg_w * 3))
        target_h = int(target_w * aspect_ratio)
        
        # Resize garment
        garment_resized = garment.resize((target_w, target_h), Image.Resampling.LANCZOS)
        
        # Apply rotation if any
        if rotation != 0:
            # Expand to prevent cutting corners during rotation
            garment_resized = garment_resized.rotate(-rotation, expand=True, resample=Image.Resampling.BICUBIC)
            new_w, new_h = garment_resized.size
        else:
            new_w, new_h = target_w, target_h
            
        # Calculate upper-left paste coordinate
        paste_x = int(target_cx - new_w / 2)
        paste_y = int(target_cy - new_h / 2)
        
        # Composite transparent garment onto background
        temp_bg = Image.new("RGBA", background.size)
        temp_bg.paste(garment_resized, (paste_x, paste_y), garment_resized)
        
        final_image = Image.alpha_composite(background, temp_bg)
        
        # Save as RGB (JPEG) or preserve transparency if PNG requested
        _, ext = os.path.splitext(output_image_path)
        if ext.lower() in ['.jpg', '.jpeg']:
            final_image.convert("RGB").save(output_image_path, "JPEG", quality=95)
        else:
            final_image.save(output_image_path, "PNG")
            
        return True

    @staticmethod
    def overlay_garments(user_image_path, garment_layers, output_image_path, 
                         auto_align=True, background_preset='original'):
        """
        Composites multiple transparent PNG garments (garment_layers list) 
        sequentially onto a user's portrait image in their specified Z-index order,
        optionally swapping out the background.
        """
        try:
            if background_preset and background_preset != 'original':
                composite_bg = ImageProcessor.remove_background(user_image_path, background_preset)
                if composite_bg is not None:
                    composite_bg_rgb = cv2.cvtColor(composite_bg, cv2.COLOR_BGR2RGB)
                    background = Image.fromarray(composite_bg_rgb).convert("RGBA")
                else:
                    background = Image.open(user_image_path).convert("RGBA")
            else:
                background = Image.open(user_image_path).convert("RGBA")
        except Exception as e:
            print(f"Error loading background user image: {e}")
            return False
            
        bg_w, bg_h = background.size
        
        # Detect model body landmarks once to speed up execution
        body = None
        if auto_align:
            body = ImageProcessor.detect_body_region(user_image_path)
            
        final_image = background.copy()
        
        # Draw each garment layer
        for layer in garment_layers:
            try:
                garment = Image.open(layer['path']).convert("RGBA")
            except Exception as e:
                print(f"Error loading garment layer {layer['path']}: {e}")
                continue
                
            scale = layer['scale']
            rotation = layer['rotation']
            offset_x = layer['offset_x']
            offset_y = layer['offset_y']
            cat = layer['category']
            
            # Base positioning logic
            rot_base = 0.0
            if auto_align and body:
                base_cx = body['center_x']
                base_cy = body['center_y']
                base_w = body['width']
                rot_base = body.get('rotation', 0.0)
                
                # Custom adjustments for accessories/sunglasses (place on face center)
                if cat == 'accessories':
                    if body['detected'] == 'face_based_estimate':
                        fx, fy, fw, fh = body['box']
                        base_cx = int(fx + fw / 2)
                        base_cy = int(fy + fh * 0.5)
                        base_w = int(fw * 0.95)
                    else:
                        base_cy = int(body['center_y'] - body['height'] * 0.45)
                        base_w = int(body['width'] * 0.35)
            else:
                base_cx = int(bg_w / 2)
                base_cy = int(bg_h / 2)
                base_w = int(bg_w * 0.5)
                
            # Apply offsets
            target_cx = base_cx + offset_x
            target_cy = base_cy + offset_y
            
            # Width and height calculations
            g_orig_w, g_orig_h = garment.size
            aspect = g_orig_h / g_orig_w
            target_w = int(base_w * scale)
            target_w = max(20, min(target_w, bg_w * 3))
            target_h = int(target_w * aspect)
            
            # Resize
            g_resized = garment.resize((target_w, target_h), Image.Resampling.LANCZOS)
            
            # Rotate
            final_rot = rotation + rot_base
            if final_rot != 0:
                g_resized = g_resized.rotate(-final_rot, expand=True, resample=Image.Resampling.BICUBIC)
                new_w, new_h = g_resized.size
            else:
                new_w, new_h = target_w, target_h
                
            # Paste coordinates
            paste_x = int(target_cx - new_w / 2)
            paste_y = int(target_cy - new_h / 2)
            
            # Composite
            temp_bg = Image.new("RGBA", background.size)
            temp_bg.paste(g_resized, (paste_x, paste_y), g_resized)
            final_image = Image.alpha_composite(final_image, temp_bg)
            
        # Save output image
        try:
            _, ext = os.path.splitext(output_image_path)
            if ext.lower() in ['.jpg', '.jpeg']:
                final_image.convert("RGB").save(output_image_path, "JPEG", quality=95)
            else:
                final_image.save(output_image_path, "PNG")
            return True
        except Exception as e:
            print(f"Error saving composite result: {e}")
            return False

    @staticmethod
    def analyze_skin_tone(image_path):
        """
        Detects the user's face, crops a skin region, analyzes the dominant 
        HSV colors, and returns their personal styling season & color recommendations.
        """
        img = cv2.imread(image_path)
        if img is None:
            return None
            
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        face_cascade_path = os.path.join(cv2.data.haarcascades, 'haarcascade_frontalface_default.xml')
        face_cascade = cv2.CascadeClassifier(face_cascade_path)
        
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(50, 50))
        
        # Face bounding box or top fallback box
        if len(faces) > 0:
            faces = sorted(faces, key=lambda x: x[2] * x[3], reverse=True)
            fx, fy, fw, fh = faces[0]
            # Crop a small box in the lower middle of the face (cheek region)
            cx = int(fx + fw * 0.3)
            cy = int(fy + fh * 0.5)
            cw = int(fw * 0.4)
            ch = int(fh * 0.3)
            crop = img[cy:cy+ch, cx:cx+cw]
        else:
            # Fallback: center-top area of the image
            h, w = img.shape[:2]
            crop = img[int(h*0.2):int(h*0.35), int(w*0.4):int(w*0.6)]
            
        if crop.size == 0:
            return {
                'undertone': 'Neutral',
                'palette': 'Neutral Season',
                'recommended_colors': ['Grey', 'Black', 'Blue', 'White']
            }
            
        # Convert crop to HSV
        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        avg_h = np.mean(hsv[:, :, 0])
        avg_s = np.mean(hsv[:, :, 1])
        avg_v = np.mean(hsv[:, :, 2])
        
        # Classify warm vs cool undertones
        if avg_s > 60:
            undertone = 'Warm'
            palette = 'Warm Autumn / Spring'
            recommended = ['Gold', 'Mustard', 'Brown', 'Crimson', 'Olive Green']
        else:
            undertone = 'Cool'
            palette = 'Cool Winter / Summer'
            recommended = ['Navy Blue', 'Silver', 'Emerald Green', 'Royal Pink', 'White']
            
        return {
            'undertone': undertone,
            'palette': palette,
            'recommended_colors': recommended,
            'stats': {'h': float(avg_h), 's': float(avg_s), 'v': float(avg_v)}
        }

    @staticmethod
    def remove_background(image_path, background_preset):
        """
        Removes the background of a user photo using MediaPipe SelfieSegmentation (local AI)
        and composites the isolated user body onto a select design preset backdrop.
        """
        img = cv2.imread(image_path)
        if img is None:
            return None
            
        h, w = img.shape[:2]
        
        # Load preset background (if user uploaded lookbook preset, else draw custom numpy gradients)
        preset_filename = f"bg_{background_preset}.png"
        preset_path = os.path.join(current_app.config['UPLOAD_FOLDER'], preset_filename)
        
        if not os.path.exists(preset_path):
            # Generate premium backdrop presets dynamically
            bg_img = np.zeros((h, w, 3), dtype=np.uint8)
            if background_preset == 'studio':
                # Warm luxury studio grey gradient
                for y in range(h):
                    r = int(185 - (y / h) * 30)
                    g = int(180 - (y / h) * 30)
                    b = int(178 - (y / h) * 30)
                    bg_img[y, :] = (b, g, r)
            elif background_preset == 'beach':
                # Golden hour sunset beach gradient
                for y in range(h):
                    ratio = y / h
                    r = int(120 * (1 - ratio) + 245 * ratio)
                    g = int(160 * (1 - ratio) + 160 * ratio)
                    b = int(210 * (1 - ratio) + 90 * ratio)
                    bg_img[y, :] = (b, g, r)
            elif background_preset == 'cafe':
                # Cozy vintage amber/espresso cafe gradient
                for y in range(h):
                    ratio = y / h
                    r = int(80 * (1 - ratio) + 155 * ratio)
                    g = int(60 * (1 - ratio) + 110 * ratio)
                    b = int(45 * (1 - ratio) + 75 * ratio)
                    bg_img[y, :] = (b, g, r)
            else:
                bg_img.fill(255)
        else:
            bg_img = cv2.imread(preset_path)
            bg_img = cv2.resize(bg_img, (w, h))
            
        # Try MediaPipe Selfie Segmentation
        if MEDIAPIPE_AVAILABLE:
            try:
                mp_selfie = mp.solutions.selfie_segmentation
                with mp_selfie.SelfieSegmentation(model_selection=1) as selfie:
                    img_rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
                    results = selfie.process(img_rgb)
                    condition = np.stack((results.segmentation_mask,) * 3, axis=-1) > 0.5
                    output_img = np.where(condition, img, bg_img)
                    return output_img
            except Exception as e:
                print(f"MediaPipe segmentation error: {e}. Falling back to GrabCut...")
                
        # GrabCut contour isolation
        try:
            mask = np.zeros(img.shape[:2], np.uint8)
            bgdModel = np.zeros((1, 65), np.float64)
            fgdModel = np.zeros((1, 65), np.float64)
            rect = (int(w * 0.15), int(h * 0.05), int(w * 0.7), int(h * 0.9))
            cv2.grabCut(img, mask, rect, bgdModel, fgdModel, 3, cv2.GC_INIT_WITH_RECT)
            mask2 = np.where((mask == 2) | (mask == 0), 0, 1).astype('uint8')
            mask2_3d = np.stack((mask2,) * 3, axis=-1)
            output_img = np.where(mask2_3d == 1, img, bg_img)
            return output_img
        except Exception as e:
            print(f"GrabCut contour failed: {e}. Defaulting to original photo background.")
            return img


