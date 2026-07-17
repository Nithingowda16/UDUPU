import json

class RecommenderEngine:
    @staticmethod
    def get_recommendations(user_profile, products, limit=12):
        """
        Calculates recommendation score for each product against the user profile.
        user_profile keys:
            - gender (Men, Women, Kids, Accessories)
            - age (int)
            - body_type (Hourglass, Rectangle, Triangle, Oval, Inverted Triangle)
            - preferred_colors (list of strings)
            - preferred_style (Casual, Formal, Sporty, Chic, Vintage, Streetwear)
            - occasion (Office, Wedding, College, Festival, Casual)
            - season (Summer, Winter, Spring, Autumn)
        """
        scored_products = []
        
        # Extracted variables with defaults
        prof_gender = user_profile.get('gender', '').lower()
        prof_age = int(user_profile.get('age', 25)) if user_profile.get('age') else 25
        prof_body = user_profile.get('body_type', '').lower()
        prof_colors = [c.lower().strip() for c in user_profile.get('preferred_colors', [])]
        prof_style = user_profile.get('preferred_style', '').lower()
        prof_occasion = user_profile.get('occasion', '').lower()
        prof_season = user_profile.get('season', '').lower()
        
        for product in products:
            score = 0
            prod_gender = product.gender.lower()
            prod_style = product.style.lower()
            prod_season = product.season.lower()
            prod_occasion = product.occasion.lower()
            
            # 1. Gender Filter
            # Standard matching or Unisex/Accessories which can match anybody
            if prof_gender:
                if prod_gender == 'accessories' or prod_gender == 'unisex':
                    score += 30
                elif prod_gender == prof_gender:
                    score += 50
                else:
                    # Mismatching genders get filtered out
                    continue
            else:
                score += 20
                
            # 2. Occasion Scoring & Specific Strict Constraints
            if prof_occasion:
                if prod_occasion == prof_occasion:
                    score += 40
                
                # Rule logic for specific occasions
                if prof_occasion == 'office':
                    # Office Rules: Prefer Formal, Chic. Ban Sporty/Streetwear.
                    if prod_style in ['formal', 'chic']:
                        score += 30
                    elif prod_style in ['sporty', 'streetwear']:
                        score -= 50
                elif prof_occasion == 'wedding':
                    # Wedding Rules: Prefer Luxury/Formal/Chic. Ban Casual/Sporty.
                    if prod_style in ['formal', 'chic', 'vintage']:
                        score += 40
                    elif prod_style in ['casual', 'sporty']:
                        score -= 60
                elif prof_occasion == 'college':
                    # College Rules: Prefer Casual, Sporty, Streetwear.
                    if prod_style in ['casual', 'sporty', 'streetwear']:
                        score += 30
                    elif prod_style in ['formal']:
                        score -= 20
                elif prof_occasion == 'festival':
                    # Festival Rules: Prefer Chic, Vintage. Vibrant colors.
                    if prod_style in ['chic', 'vintage']:
                        score += 30
                    # Check vibrant color keywords
                    vibrant_colors = ['red', 'gold', 'yellow', 'pink', 'orange', 'maroon', 'blue']
                    p_colors = [c.lower().strip() for c in (product.colors.split(',') if product.colors else [])]
                    if any(c in vibrant_colors for c in p_colors):
                        score += 20
                elif prof_occasion == 'casual':
                    # Casual Rules: Prefer Casual/Streetwear
                    if prod_style in ['casual', 'streetwear']:
                        score += 30
                        
            # 3. Season & Weather Scoring
            if prof_season:
                if prod_season == 'all' or prod_season == prof_season:
                    score += 30
                
                # Weather Rules:
                if prof_season == 'winter':
                    # Warm clothes: search name/description for winter keywords
                    desc = (product.name + " " + (product.description or "")).lower()
                    if any(w in desc for w in ['jacket', 'sweater', 'coat', 'hoodie', 'wool', 'knit', 'long sleeve']):
                        score += 30
                elif prof_season == 'summer':
                    # Cool clothes: search for light materials
                    desc = (product.name + " " + (product.description or "")).lower()
                    if any(w in desc for w in ['t-shirt', 'shorts', 'crop', 'skirt', 'cotton', 'sleeveless', 'linen']):
                        score += 30
            else:
                score += 10
                
            # 4. Preferred Style Scoring
            if prof_style and prod_style == prof_style:
                score += 25
                
            # 5. Color Preferences Matching
            if prof_colors and product.colors:
                prod_colors_list = [c.lower().strip() for c in product.colors.split(',')]
                match_count = sum(1 for c in prod_colors_list if c in prof_colors)
                score += match_count * 10
                
            # 6. Body Type Compatibility
            if prof_body and product.body_type:
                comp_bodies = [b.lower().strip() for b in product.body_type.split(',')]
                if prof_body in comp_bodies:
                    score += 20
                
            # Add to list if score is positive or no filter was violated
            scored_products.append({
                'product': product,
                'score': score
            })
            
        # Sort products by score descending
        scored_products.sort(key=lambda x: x['score'], reverse=True)
        
        return [sp['product'] for sp in scored_products[:limit]]
