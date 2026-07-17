# API Documentation

Every endpoint prefix is assumed to be `/api` during standard local operation. All protected routes require a JWT bearer token passed in the `Authorization` header: `Authorization: Bearer <JWT_TOKEN>`.

---

## Authentication Blueprints (`/api/auth`)

### 1. User Registration
- **URL**: `/register`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (Success - 201)**:
  ```json
  {
    "message": "User registered successfully"
  }
  ```

### 2. User Login
- **URL**: `/login`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "email": "jane@example.com",
    "password": "securepassword123"
  }
  ```
- **Response (Success - 200)**:
  ```json
  {
    "token": "eyJhbGciOi...",
    "user": {
      "id": 2,
      "email": "jane@example.com",
      "name": "Jane Doe",
      "role": "user",
      "gender": null,
      "age": null,
      "body_type": null,
      "preferred_colors": [],
      "preferred_style": null
    }
  }
  ```

### 3. Password Reset Simulation
- **URL**: `/forgot-password` | `/reset-password`
- **Method**: `POST`
- **Forgot Payload**: `{"email": "jane@example.com"}`
- **Reset Payload**: `{"email": "jane@example.com", "password": "newpassword123"}`

---

## Products Blueprints (`/api/products`)

### 1. Query Catalog Products
- **URL**: `/`
- **Method**: `GET`
- **Query Params**:
  - `page` (int, default 1)
  - `limit` (int, default 12)
  - `category_id` (int)
  - `gender` (Men, Women, Kids, Accessories)
  - `style` (Casual, Formal, Sporty, Chic, Vintage, Streetwear)
  - `season` (Summer, Winter, Spring, Autumn)
  - `occasion` (Casual, Office, Wedding, College, Festival)
  - `search` (string)
  - `sort_by` (price_asc, price_desc, created_at)
- **Response (Success - 200)**:
  ```json
  {
    "products": [
      {
        "id": 1,
        "name": "Crimson Summer Tee",
        "price": 49.00,
        "image_url": "/uploads/cat_crimson_tee.png",
        "garment_url": "/uploads/crimson_tee.png",
        "gender": "Men",
        "style": "Casual",
        "season": "Summer",
        "occasion": "Casual"
      }
    ],
    "total": 1,
    "pages": 1,
    "current_page": 1
  }
  ```

### 2. Create Product (Admin Only)
- **URL**: `/`
- **Method**: `POST`
- **Payload**: Multipart Form Data
  - Text fields: `name`, `price`, `category_id`, `description`, `gender`, `style`, `season`, `occasion`, `body_type`, `colors`, `stock`
  - File fields: `image` (preview), `garment` (transparent overlay)
- **Response (Success - 211)**

---

## Virtual Try-On Blueprints (`/api/tryon`)

### 1. Upload User Portrait Photo (JWT Protected)
- **URL**: `/upload`
- **Method**: `POST`
- **Payload**: Multipart Form
  - File field: `image` (user's picture)
- **Response (Success - 200)**:
  ```json
  {
    "user_image_path": "user_29384729384.png",
    "user_image_url": "/uploads/user_29384729384.png",
    "detection": {
      "detected": "face_based_estimate",
      "center_x": 250,
      "center_y": 380,
      "width": 140,
      "height": 220
    }
  }
  ```

### 2. Generate Overlay Composite (JWT Protected)
- **URL**: `/generate`
- **Method**: `POST`
- **Payload**:
  ```json
  {
    "product_id": 1,
    "user_image_path": "user_29384729384.png",
    "scale": 1.1,
    "rotation": 15,
    "offset_x": -10,
    "offset_y": 50,
    "auto_align": true
  }
  ```
- **Response (Success - 201)**:
  ```json
  {
    "id": 15,
    "result_image_url": "/generated/result_129831982.png",
    "scale": 1.1,
    "rotation": 15.0,
    "offset_x": -10,
    "offset_y": 50
  }
  ```

---

## Recommendation Blueprints (`/api/recommendations`)

### 1. Fetch Profile-based styling recommendations
- **URL**: `/`
- **Method**: `GET`
- **Response**: List of filtered products ranked by style and weather compatibility matching scoring matrices.
