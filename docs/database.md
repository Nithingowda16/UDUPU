# Database Schema

We use **SQLAlchemy** to interface with a local **SQLite** database. SQLite is secure, zero-config, and highly robust for small-to-medium systems. All fields are sanitized to prevent SQL injection.

---

```mermaid
erDiagram
    users ||--o{ tryon_histories : "initiates"
    users ||--o{ wishlists : "saves"
    users ||--o{ sessions : "establishes"
    categories ||--|{ products : "contains"
    products ||--o{ tryon_histories : "referenced in"
    products ||--o{ wishlists : "saved in"

    users {
        int id PK
        string email UK
        string password_hash
        string name
        string role "user/admin"
        datetime created_at
        string gender "Men/Women/Kids"
        int age
        string body_type "Hourglass/Rectangle/Triangle/Oval/Inverted"
        string preferred_colors "comma-separated list"
        string preferred_style "Casual/Formal/Sporty..."
    }

    categories {
        int id PK
        string name UK
        string slug UK
    }

    products {
        int id PK
        string name
        text description
        float price
        int category_id FK
        string image_url "Catalog display link"
        string garment_url "Transparent PNG asset link"
        string gender "Men/Women/Kids/Accessories"
        string style "Casual/Formal..."
        string season "Summer/Winter..."
        string occasion "Casual/Office/Wedding..."
        string body_type "comma-separated list of shapes"
        string colors "comma-separated list of colors"
        int stock
        datetime created_at
    }

    tryon_histories {
        int id PK
        int user_id FK
        string user_image_path
        int product_id FK
        string result_image_path
        float scale
        float rotation
        int offset_x
        int offset_y
        datetime created_at
    }

    wishlists {
        int id PK
        int user_id FK
        int product_id FK
        datetime created_at
    }

    sessions {
        int id PK
        int user_id FK
        string token UK
        string ip_address
        string user_agent
        datetime created_at
        datetime expires_at
    }
```

---

## Model Descriptions

1. **User Table (`users`)**: Stores credentials and active styling/body preferences. Demarcates administrators using the `role` field.
2. **Category Table (`categories`)**: Hierarchical catalog categories mapping products to segments (e.g. `men`, `women`, `kids`, `accessories`).
3. **Product Table (`products`)**: Catalog specifications containing matching metadata tags for color, style, body structure, occasion, and climate season, alongside path variables for display images and alpha-blended transparent garment overlays.
4. **Try-On History Table (`tryon_histories`)**: Stores parameters (scales, rotations, translation coordinates) utilized during visual canvas overlays to enable high-quality server-side re-renders, and lists output paths.
5. **Wishlist Table (`wishlists`)**: Simple relational join mapping user accounts to favorite clothing items.
6. **Session Table (`sessions`)**: Tracks token lifecycles and provides rate limits / audit safeguards.
