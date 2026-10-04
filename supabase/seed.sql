-- ==============================================================================
-- SUNNYBITE RESTAURANT — COMPLETE SEED DATA SCRIPT
-- ==============================================================================
-- Paste and run this script in the Supabase SQL Editor right after running schema.sql.
-- It fully populates all categories, 18 dishes with aliases, site settings,
-- page content for all 7 sections, and the chatbot FAQ knowledge base.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. SEED CATEGORIES
-- ------------------------------------------------------------------------------
insert into public.categories (id, name, slug, sort_order, visible) values
  ('all', 'All', 'all', 0, true),
  ('starters', 'Starters', 'starters', 1, true),
  ('main-course', 'Main Course', 'main-course', 2, true),
  ('burgers', 'Burgers', 'burgers', 3, true),
  ('pasta', 'Pasta', 'pasta', 4, true),
  ('pizza', 'Pizza', 'pizza', 5, true),
  ('salads', 'Salads', 'salads', 6, true),
  ('desserts', 'Desserts', 'desserts', 7, true),
  ('drinks', 'Drinks', 'drinks', 8, true)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  sort_order = excluded.sort_order,
  visible = excluded.visible;

-- ------------------------------------------------------------------------------
-- 2. SEED MENU ITEMS (All 18 Dishes with Aliases for Chatbot)
-- ------------------------------------------------------------------------------
insert into public.menu_items (
  id, name, slug, category_id, price, description, short_description,
  image_url, tags, dietary, badge, popular, available, aliases, sort_order, visible
) values
(
  'garden-vegetable-soup',
  'Garden Vegetable Soup',
  'garden-vegetable-soup',
  'starters',
  350,
  'Slow-simmered seasonal vegetables in a light herb broth.',
  'Slow-simmered seasonal vegetables in a light herb broth.',
  '/images/dish-garden-vegetable-soup.jpg',
  array['Organic', 'Warm Broth'],
  array['Vegetarian'],
  null,
  false,
  true,
  array['soup', 'soups', 'vegetable soup', 'veg soup', 'garden soup', 'sabzi soup', 'vegetables soup', 'hot soup'],
  1,
  true
),
(
  'grilled-chicken-skewers',
  'Grilled Chicken Skewers',
  'grilled-chicken-skewers',
  'starters',
  450,
  'Char-grilled chicken bites glazed with honey and spice.',
  'Char-grilled chicken bites glazed with honey and spice.',
  '/images/dish-grilled-chicken-skewers.jpg',
  array['Glazed', 'Skewers'],
  array['Chef''s Special'],
  null,
  false,
  true,
  array['skewers', 'skewer', 'chicken skewer', 'chicken skewers', 'grilled chicken skewer', 'chicken sticks', 'chicken bites', 'tikka skewer'],
  2,
  true
),
(
  'crispy-spring-rolls',
  'Crispy Spring Rolls',
  'crispy-spring-rolls',
  'starters',
  400,
  'Golden rolls filled with veggies and glass noodles.',
  'Golden rolls filled with veggies and glass noodles.',
  '/images/dish-crispy-spring-rolls.jpg',
  array['Crispy', 'Handmade'],
  array['Vegetarian'],
  null,
  false,
  true,
  array['spring roll', 'spring rolls', 'rolls', 'roll', 'veg rolls', 'crispy rolls', 'crispy spring roll', 'chinese rolls'],
  3,
  true
),
(
  'herb-roasted-chicken',
  'Herb Roasted Chicken',
  'herb-roasted-chicken',
  'main-course',
  950,
  'Free-range chicken roasted with garden herbs.',
  'Free-range chicken roasted with garden herbs.',
  '/images/dish-herb-roasted-chicken.jpg',
  array['Free-Range', 'Garden Herbs'],
  array['Gluten-Free'],
  null,
  false,
  true,
  array['roasted chicken', 'roast chicken', 'herb chicken', 'chicken roast', 'baked chicken', 'herb roast', 'roasted herb chicken'],
  4,
  true
),
(
  'grilled-salmon-fillet',
  'Grilled Salmon Fillet',
  'grilled-salmon-fillet',
  'main-course',
  1100,
  'Pan-seared salmon with a citrus butter glaze.',
  'Pan-seared salmon with a citrus butter glaze.',
  '/images/dish-grilled-salmon-fillet.jpg',
  array['Atlantic Salmon', 'Citrus Glaze'],
  array['Pescatarian'],
  null,
  false,
  true,
  array['salmon', 'grilled salmon', 'fish', 'salmon fillet', 'fish fillet', 'citrus salmon', 'machli', 'grilled fish'],
  5,
  true
),
(
  'slow-braised-beef',
  'Slow-Braised Beef',
  'slow-braised-beef',
  'main-course',
  1150,
  'Tender beef braised for hours in a rich pan sauce.',
  'Tender beef braised for hours in a rich pan sauce.',
  '/images/dish-slow-braised-beef.jpg',
  array['Slow-Braised', 'Rich Demi'],
  array['Chef''s Signature'],
  null,
  false,
  true,
  array['beef', 'braised beef', 'slow braised beef', 'beef steak', 'beef roast', 'tender beef', 'gosht', 'braised meat'],
  6,
  true
),
(
  'classic-cheeseburger',
  'Classic Cheeseburger',
  'classic-cheeseburger',
  'burgers',
  650,
  'Juicy beef patty, melted cheddar, house pickle relish, and secret brioche sauce.',
  'Juicy beef patty, melted cheddar and house sauce.',
  '/images/dish-classic-cheeseburger.jpg',
  array['Brioche Bun', 'Smashed Beef'],
  array['House Favorite'],
  null,
  true,
  true,
  array['burger', 'burgers', 'cheeseburger', 'cheese burger', 'classic burger', 'beef burger', 'cheeseburgers', 'classic cheeseburger', 'burgar'],
  7,
  true
),
(
  'creamy-alfredo-pasta',
  'Creamy Alfredo Pasta',
  'creamy-alfredo-pasta',
  'pasta',
  750,
  'Silky parmesan cream sauce tossed with hand-rolled fettuccine and herbs.',
  'Silky parmesan sauce tossed with fresh fettuccine.',
  '/images/dish-creamy-alfredo-pasta.jpg',
  array['Hand-Rolled', 'Parmigiano'],
  array['Vegetarian'],
  'Chef''s Pick',
  true,
  true,
  array['pasta', 'pastas', 'alfredo', 'alfredo pasta', 'creamy pasta', 'creamy alfredo', 'fettuccine', 'fettuccine alfredo', 'white sauce pasta', 'white pasta'],
  8,
  true
),
(
  'spaghetti-arrabbiata',
  'Spaghetti Arrabbiata',
  'spaghetti-arrabbiata',
  'pasta',
  700,
  'A spicy tomato sauce with garlic and fresh chili.',
  'A spicy tomato sauce with garlic and fresh chili.',
  '/images/dish-spaghetti-arrabbiata.jpg',
  array['Fiery Sauce', 'San Marzano'],
  array['Vegetarian'],
  null,
  false,
  true,
  array['spaghetti', 'arrabbiata', 'arrabiata', 'spicy pasta', 'red sauce pasta', 'spicy spaghetti', 'tomato pasta', 'spaghetti pasta'],
  9,
  true
),
(
  'margherita-pizza',
  'Margherita Pizza',
  'margherita-pizza',
  'pizza',
  700,
  'Wood-fired blistered crust with San Marzano tomatoes, fresh mozzarella, and sweet basil.',
  'Wood-fired crust with San Marzano tomato and basil.',
  '/images/dish-margherita-pizza.jpg',
  array['Wood-Fired', 'Buffalo Mozzarella'],
  array['Wood-Fired'],
  null,
  true,
  true,
  array['pizza', 'pizzas', 'margherita', 'margarita', 'margarita pizza', 'cheese pizza', 'margherita pizza', 'piza', 'wood fired pizza'],
  10,
  true
),
(
  'pepperoni-pizza',
  'Pepperoni Pizza',
  'pepperoni-pizza',
  'pizza',
  800,
  'Classic pepperoni with mozzarella and oregano.',
  'Classic pepperoni with mozzarella and oregano.',
  '/images/dish-pepperoni-pizza.jpg',
  array['Crispy Pepperoni', 'Sourdough Crust'],
  array['Crispy Crust'],
  null,
  false,
  true,
  array['pepperoni', 'peperoni', 'pepperoni pizza', 'beef pepperoni', 'meat pizza', 'peperoni pizza'],
  11,
  true
),
(
  'garden-fresh-salad',
  'Garden Fresh Salad',
  'garden-fresh-salad',
  'salads',
  500,
  'Crisp organic greens, avocado ribbons, heirloom radish, and citrus-dill dressing.',
  'Crisp greens and seasonal veg with citrus dressing.',
  '/images/dish-garden-fresh-salad.jpg',
  array['Organic', 'Farm Greens'],
  array['Gluten-Free'],
  'Organic',
  true,
  true,
  array['salad', 'salads', 'fresh salad', 'garden salad', 'garden fresh salad', 'green salad', 'organic salad', 'greens'],
  12,
  true
),
(
  'chocolate-lava-cake',
  'Chocolate Lava Cake',
  'chocolate-lava-cake',
  'desserts',
  400,
  'Warm cocoa sponge filled with molten 70% dark Belgian ganache and sea salt flakes.',
  'Warm cake with a molten dark chocolate center.',
  '/images/dish-chocolate-lava-cake.jpg',
  array['Belgian Ganache', 'Molten'],
  array['Dessert'],
  'Sweet Finale',
  true,
  true,
  array['cake', 'lava cake', 'molten cake', 'chocolate cake', 'choc cake', 'chocolate lava', 'lava', 'dessert', 'meetha', 'choc lava cake'],
  13,
  true
),
(
  'vanilla-bean-ice-cream',
  'Vanilla Bean Ice Cream',
  'vanilla-bean-ice-cream',
  'desserts',
  350,
  'Creamy vanilla bean scoops finished with a chocolate curl.',
  'Creamy vanilla bean scoops finished with a chocolate curl.',
  '/images/dish-vanilla-bean-ice-cream.jpg',
  array['Madagascar Vanilla', 'Artisanal'],
  array['Vegetarian'],
  null,
  false,
  true,
  array['ice cream', 'icecream', 'vanilla', 'vanilla ice cream', 'vanilla bean', 'ice cream scoop', 'cold dessert'],
  14,
  true
),
(
  'berry-smoothie-bowl',
  'Berry Smoothie Bowl',
  'berry-smoothie-bowl',
  'desserts',
  450,
  'Blended highland berries topped with toasted oat granola, chia seeds, and raw honey.',
  'Blended berries topped with granola and honey.',
  '/images/dish-berry-smoothie-bowl.jpg',
  array['Acai & Berries', 'Chia Granola'],
  array['Breakfast · Vegan'],
  null,
  true,
  true,
  array['smoothie bowl', 'berry bowl', 'acai bowl', 'smoothy bowl', 'berry smoothie bowl', 'fruit bowl', 'chia bowl', 'breakfast bowl'],
  15,
  true
),
(
  'fresh-mint-lemonade',
  'Fresh Mint Lemonade',
  'fresh-mint-lemonade',
  'drinks',
  300,
  'Chilled sparkling lemonade with crushed wild mint leaves.',
  'Chilled sparkling lemonade with crushed wild mint leaves.',
  '/images/dish-fresh-mint-lemonade.jpg',
  array['Sparkling', 'Wild Mint'],
  array['Vegan'],
  null,
  false,
  true,
  array['mint lemonade', 'lemonade', 'lemonade mint', 'fresh lemonade', 'nimbu pani', 'limca', 'sparkling lemonade', 'mint drink', 'mint margarita'],
  16,
  true
),
(
  'sunset-mango-smoothie',
  'Sunset Mango Smoothie',
  'sunset-mango-smoothie',
  'drinks',
  380,
  'Velvety mango blended with coconut yogurt and chia seeds.',
  'Velvety mango blended with coconut yogurt and chia seeds.',
  '/images/dish-sunset-mango-smoothie.jpg',
  array['Mango Puree', 'Coconut Swirl'],
  array['Vegan'],
  null,
  false,
  true,
  array['mango smoothie', 'smoothie', 'smoothies', 'mango shake', 'sunset smoothie', 'mango drink', 'aam smoothie'],
  17,
  true
),
(
  'rose-petal-iced-tea',
  'Rose Petal Iced Tea',
  'rose-petal-iced-tea',
  'drinks',
  320,
  'Slow-brewed botanical tea infused with fragrant organic rosewater.',
  'Slow-brewed botanical tea infused with fragrant organic rosewater.',
  '/images/dish-rose-petal-iced-tea.jpg',
  array['Rosewater', 'Slow Brewed'],
  array['Vegan'],
  null,
  false,
  true,
  array['iced tea', 'ice tea', 'tea', 'rose tea', 'rose petal tea', 'chai', 'botanical tea', 'cold tea'],
  18,
  true
)
on conflict (id) do update set
  name = excluded.name,
  slug = excluded.slug,
  category_id = excluded.category_id,
  price = excluded.price,
  description = excluded.description,
  short_description = excluded.short_description,
  image_url = excluded.image_url,
  tags = excluded.tags,
  dietary = excluded.dietary,
  badge = excluded.badge,
  popular = excluded.popular,
  available = excluded.available,
  aliases = excluded.aliases,
  sort_order = excluded.sort_order,
  visible = excluded.visible,
  updated_at = now();

-- ------------------------------------------------------------------------------
-- 3. SEED SITE SETTINGS
-- ------------------------------------------------------------------------------
insert into public.site_settings (key, value, is_public) values
(
  'brand',
  '{
    "name": "SunnyBite",
    "tagline": "Good food · Good mood",
    "logoUrl": "/logo-horizontal.svg",
    "iconUrl": "/logo-icon.svg",
    "faviconUrl": "/favicon.svg",
    "creatorName": "Abdul Manan",
    "creatorRole": "UI/UX Designer & Web Developer"
  }'::jsonb,
  true
),
(
  'contact',
  '{
    "phone": "+92 309 7227807",
    "phoneRaw": "+923097227807",
    "whatsappLink": "https://wa.me/923097227807",
    "email": "hello@sunnybite.com",
    "location": "I-8, Islamabad, Pakistan",
    "mapQuery": "I-8 Markaz, Islamabad, Pakistan",
    "address": "I-8 Markaz, Islamabad, ICT 44000, Pakistan"
  }'::jsonb,
  true
),
(
  'hours',
  '{
    "daily": "9am – 10pm",
    "brunch": "9am – 2pm",
    "dinner": "5pm – 10pm"
  }'::jsonb,
  true
),
(
  'stats',
  '{
    "rating": "4.9",
    "reviews": "1,200+",
    "years": "8+",
    "dishes": "120+",
    "customers": "15k+",
    "awards": "6",
    "since": "2018"
  }'::jsonb,
  true
),
(
  'currency',
  '{
    "symbol": "Rs.",
    "code": "PKR",
    "placement": "before"
  }'::jsonb,
  true
),
(
  'ordering',
  '{
    "enabled": true,
    "types": ["Pickup", "Dine-in"],
    "delivery": false,
    "maxQtyPerItem": 20,
    "taxRatePercent": 0,
    "estimatedPickupMinutes": 25
  }'::jsonb,
  true
),
(
  'socials',
  '{
    "instagram": "https://instagram.com",
    "facebook": "https://facebook.com",
    "youtube": "https://youtube.com"
  }'::jsonb,
  true
),
(
  'announcement',
  '{
    "enabled": false,
    "text": "🌿 Fresh Seasonal Harvest Menu Now Live! Complimentary artisanal cooler with any 2 mains.",
    "link": "/menu",
    "badge": "Special"
  }'::jsonb,
  true
),
(
  'theme',
  '{
    "primaryColor": "#98415a",
    "secondaryColor": "#3a6848",
    "creamBg": "#FBF5EB"
  }'::jsonb,
  true
),
(
  'chat_settings',
  '{
    "welcomeMessage": "Salam & Welcome to SunnyBite! 🌿 How can I brighten your day? You can order delicious dishes directly, ask for recommendations, or explore our menu.",
    "chips": [
      "View Full Menu",
      "I want to order",
      "What are your timings?",
      "Where are you located?"
    ]
  }'::jsonb,
  true
),
(
  'seo',
  '{
    "homeTitle": "SunnyBite — Fresh Flavors, Brighter Days | I-8 Islamabad",
    "homeDesc": "Welcome to SunnyBite in I-8, Islamabad. Artisanal botanical bistro serving handcrafted pastas, gourmet burgers, fresh smoothies, and wood-fired pizzas with organic goodness.",
    "ogImage": "https://sunnybite.pk/images/hero-interior.jpg"
  }'::jsonb,
  true
)
on conflict (key) do update set
  value = excluded.value,
  is_public = excluded.is_public,
  updated_at = now();

-- ------------------------------------------------------------------------------
-- 4. SEED PAGE CONTENT (All sections across all pages)
-- ------------------------------------------------------------------------------
insert into public.page_content (page, section_key, content, sort_order, visible) values
-- --- HOME PAGE ---
(
  'home',
  'hero',
  '{
    "taglinePill": "Good food · Good mood",
    "headlineWord1": "Fresh",
    "headlineWord2": "flavors,",
    "headlineWord3": "brighter days.",
    "subtitle": "Delicious food, fresh ingredients and a little happiness served every day in our cozy botanical retreat in I-8, Islamabad.",
    "ctaPrimaryLabel": "Explore Menu",
    "ctaPrimaryLink": "/menu",
    "ctaSecondaryLabel": "Order Online",
    "ctaSecondaryLink": "/menu",
    "heroImage": "/images/hero-interior.jpg",
    "ratingNumber": "4.9",
    "ratingSubtitle": "Over 1,200+ happy neighborhood foodies"
  }'::jsonb,
  1,
  true
),
(
  'home',
  'features',
  '{
    "items": [
      {
        "icon": "eco",
        "colorVariant": "mint",
        "title": "Fresh Ingredients",
        "description": "Sourced daily from local growers we trust for maximum organic crispness."
      },
      {
        "icon": "skillet",
        "colorVariant": "yellow",
        "title": "Expert Chefs",
        "description": "Recipes crafted with thoughtful care and years of artisanal culinary craft."
      },
      {
        "icon": "favorite",
        "colorVariant": "pink",
        "title": "Cozy Ambience",
        "description": "A warm, welcoming botanical space designed for calm lingering and connection."
      },
      {
        "icon": "auto_awesome",
        "colorVariant": "mint",
        "title": "Great Service",
        "description": "Attentive, friendly and always ready to make your dining ritual joyful."
      }
    ]
  }'::jsonb,
  2,
  true
),
(
  'home',
  'specials',
  '{
    "badge": "Our specials",
    "title": "Popular dishes",
    "subtitle": "From classic favorites to unique creations, our menu is full of flavors you''ll love.",
    "ctaLabel": "View Full Menu",
    "ctaLink": "/menu"
  }'::jsonb,
  3,
  true
),
(
  'home',
  'story',
  '{
    "badge": "The SunnyBite Experience",
    "title": "A sanctuary of botanical calm and joyful bites.",
    "paragraph": "Every corner of SunnyBite is thoughtfully curated—from soft velvet chairs and terrazzo tables to lush cascading monstera leaves and neon glow. Whether meeting an old friend or savoring quiet time over sparkling lemonade, you belong here.",
    "stat1Value": "100%",
    "stat1Label": "Natural ingredients & farm milk",
    "stat2Value": "Zero",
    "stat2Label": "Artificial additives or shortcuts",
    "image1": "/images/story-barista.jpg",
    "image1Alt": "Barista frothing oat milk for velvety matcha latte inside bright botanical cafe counter",
    "image2": "/images/story-friends.jpg",
    "image2Alt": "Friends laughing around round pink terrazzo cafe table laden with food and iced teas",
    "card1Title": "Table Reservations",
    "card1Text": "Walk-ins always warmly welcomed; weekend patio reservations recommended.",
    "card2Title": "Gatherings",
    "card2Text": "Host private brunches, birthdays, and joyful pastry tastings with us."
  }'::jsonb,
  4,
  true
),

-- --- MENU PAGE ---
(
  'menu',
  'header',
  '{
    "badge": "Our menu",
    "title": "Something for every craving.",
    "subtitle": "Made fresh daily, from cozy comfort food to lighter bites and sweet finishes."
  }'::jsonb,
  1,
  true
),

-- --- ABOUT PAGE ---
(
  'about',
  'intro',
  '{
    "badge": "Our story",
    "title": "Made with love, served with joy.",
    "subtitle": "SunnyBite started with one simple idea: food should make people happy. Years later, that''s still at the heart of everything we serve in I-8, Islamabad."
  }'::jsonb,
  1,
  true
),
(
  'about',
  'story',
  '{
    "badge": "Artisanal Roots",
    "title": "A small kitchen with a big idea",
    "paragraph1": "It began in a small corner kitchen, where our founder believed a good meal could turn any ordinary day into something special. What started with a handful of family recipes has grown into a place where fresh ingredients, warm hospitality and a little bit of joy come together on every plate.",
    "paragraph2": "Today, SunnyBite is a home for anyone chasing good food and good company — whether it''s a quick lunch, a long dinner, or a celebration worth remembering.",
    "image": "/images/about-interior.jpg",
    "imageAlt": "A sunlit, joyful dining room interior at SunnyBite featuring tall arched windows, dusty-rose chairs, and lush botanical greenery",
    "since": "2018",
    "ctaLabel": "Explore Our Menu",
    "ctaLink": "/menu"
  }'::jsonb,
  2,
  true
),
(
  'about',
  'cta_banner',
  '{
    "title": "Hungry for something fresh?",
    "subtitle": "Come taste the happiness for yourself — we''ll save you a seat.",
    "buttonLabel": "Order Online",
    "buttonLink": "/menu"
  }'::jsonb,
  3,
  true
),

-- --- CONTACT PAGE ---
(
  'contact',
  'header',
  '{
    "badge": "Get in touch",
    "title": "We''d love to hear from you.",
    "subtitle": "Have questions, reserving a table, or planning an event? Reach out and we''ll reply with a smile.",
    "chip1Text": "Average reply time: under 15 mins",
    "chip2Text": "Reservations & Private Dinners Open"
  }'::jsonb,
  1,
  true
),
(
  'contact',
  'venue_card',
  '{
    "title": "Host a Garden Gathering",
    "desc": "Our conservatory hosts intimate celebrations of up to 40 seated guests.",
    "image": "/images/contact-greenhouse.jpg"
  }'::jsonb,
  2,
  true
),
(
  'contact',
  'map_section',
  '{
    "badge": "Neighborhood Walk",
    "title": "Finding Us in I-8 Markaz, Islamabad, Pakistan",
    "desc": "Located conveniently in the heart of I-8 Markaz, Islamabad, with easy access and pleasant outdoor strolls.",
    "mapQuery": "I-8 Markaz, Islamabad, Pakistan"
  }'::jsonb,
  3,
  true
),
(
  'contact',
  'arrival_tips',
  '{
    "tips": [
      {
        "icon": "near_me",
        "title": "Easy to Find",
        "desc": "Conveniently located in I-8 Markaz, Islamabad"
      },
      {
        "icon": "local_parking",
        "title": "Parking Nearby",
        "desc": "Ample parking available steps from our front door"
      },
      {
        "icon": "accessible",
        "title": "Accessibility",
        "desc": "Wheelchair-friendly step-free entrance & wide aisles"
      }
    ]
  }'::jsonb,
  4,
  true
),

-- --- FOOTER ---
(
  'footer',
  'content',
  '{
    "tagline": "Good food · Good mood · Crafted fresh every day in our botanical retreat in I-8 Islamabad.",
    "newsletterTitle": "Join the Foodie Club",
    "newsletterSubtitle": "Be the first to hear about seasonal menus, secret recipes, and exclusive gathering invites.",
    "copyright": "All rights reserved.",
    "builtBy": "Built with love & good taste by Abdul Manan."
  }'::jsonb,
  1,
  true
),

-- --- PRIVACY POLICY ---
(
  'privacy',
  'body',
  '{
    "badge": "Trust & Transparency",
    "title": "Privacy Policy",
    "lastUpdated": "January 2026",
    "intro": "At SunnyBite (I-8, Islamabad, Pakistan), your privacy is paramount to us. We operate as an artisanal restaurant and bistro, and we treat your personal information with the same care and respect that we treat our ingredients.",
    "section1Title": "1. Information We Collect",
    "section1Text": "When you contact us, book a table, or place an order via WhatsApp or our Contact form, we collect the details you voluntarily provide: your name, phone number, email address, table preferences, and any allergen or dietary accommodations.",
    "section2Title": "2. How We Use Your Information",
    "section2Text": "We use your contact details solely to confirm table reservations, coordinate pickup and dining orders, and respond to your catering inquiries. We do not sell, rent, or trade your data to third parties or marketing spammers.",
    "section3Title": "3. Local Browser Storage",
    "section3Text": "This website uses your browser''s local storage and session storage to preserve your dining basket and recent assistant conversation during your visit. No tracking cookies are deployed.",
    "section4Title": "4. Contact Us",
    "section4Text": "If you have questions regarding our privacy practices, please contact us at hello@sunnybite.com or call our host desk at +92 309 7227807."
  }'::jsonb,
  1,
  true
),

-- --- TERMS OF SERVICE ---
(
  'terms',
  'body',
  '{
    "badge": "House Etiquette",
    "title": "Terms of Service",
    "lastUpdated": "January 2026",
    "intro": "Welcome to SunnyBite. By enjoying meals at our bistro, ordering through our digital assistant, or visiting our website, you agree to these house terms.",
    "section1Title": "1. Dining & Orders",
    "section1Text": "All orders placed via our site or digital assistant are confirmed directly with our host team via WhatsApp or phone call. Payment is processed upon pickup or table service.",
    "section2Title": "2. Reservations & Cancellations",
    "section2Text": "Table reservations are held for 15 minutes past the scheduled time before being released to walk-in guests. We appreciate timely notice if your plans change.",
    "section3Title": "3. Menu Availability & Pricing",
    "section3Text": "Our ingredients are sourced fresh daily, and seasonal dishes may occasionally be sold out. All prices are stated in Pakistani Rupees (PKR) and are subject to local tax regulations.",
    "section4Title": "4. Contact & Host Desk",
    "section4Text": "For any inquiries or private event bookings, please call +92 309 7227807 or email hello@sunnybite.com."
  }'::jsonb,
  1,
  true
)
on conflict (page, section_key) do update set
  content = excluded.content,
  sort_order = excluded.sort_order,
  visible = excluded.visible,
  updated_at = now();

-- ------------------------------------------------------------------------------
-- 5. SEED CHATBOT FAQ
-- ------------------------------------------------------------------------------
insert into public.chatbot_faq (keywords, question, answer, sort_order, visible) values
(
  array['delivery', 'deliver', 'home delivery', 'rider', 'ghar', 'bhejo'],
  'Do you offer home delivery?',
  'We do not offer direct home delivery at this time; our current order options are Pickup and Dine-in. However, our team on WhatsApp can confirm special courier or dispatch requests!',
  1,
  true
),
(
  array['halal', 'zabiha', 'meat', 'chicken halal', 'beef halal'],
  'Is all the food certified Halal?',
  'Yes, 100%! All our chicken, beef, and ingredients are strictly certified Halal and sourced fresh daily from trusted local farms.',
  2,
  true
),
(
  array['payment', 'pay', 'cash', 'card', 'visa', 'mastercard', 'raast', 'nayapay', 'easypaisa'],
  'What payment methods do you accept?',
  'We accept Cash, all major Credit/Debit cards (Visa & Mastercard), as well as instant digital transfers (Raast, Nayapay, and Easypaisa).',
  3,
  true
),
(
  array['parking', 'car', 'park', 'gari', 'space'],
  'Is parking available nearby?',
  'Ample, step-free parking is conveniently located right outside our botanical entrance in I-8 Markaz, Islamabad.',
  4,
  true
),
(
  array['discount', 'discounts', 'deal', 'deals', 'promo', 'coupon', 'concession', 'sasta'],
  'Do you offer discounts or student deals?',
  'All our menu prices are fixed and artisanal. We do not offer ad-hoc discounts, but our Foodie Club members receive seasonal chef perks and surprise tasting invitations!',
  5,
  true
),
(
  array['allergy', 'allergies', 'gluten', 'dairy', 'nuts', 'peanut', 'celiac'],
  'How do you accommodate food allergies?',
  'We prepare food in a kitchen handling gluten, dairy, and nuts. Please notify our staff of severe allergies during checkout notes or on WhatsApp so the chef can take special precautions.',
  6,
  true
),
(
  array['catering', 'party', 'event', 'large order', 'bulk', 'gathering', 'private'],
  'Do you cater private events or large gatherings?',
  'Planning a large gathering or catering? For orders above 20 items or private conservatory dinners (up to 40 guests), our team will curate a custom menu directly via WhatsApp or phone!',
  7,
  true
),
(
  array['jobs', 'hiring', 'career', 'job', 'vacancies', 'work', 'barista job'],
  'Are you currently hiring?',
  'We are always looking for smiling hosts, talented baristas, and passionate line cooks. Please send your CV to hello@sunnybite.com or message us on WhatsApp.',
  8,
  true
);

-- ------------------------------------------------------------------------------
-- 6. SEED INITIAL MEDIA ASSETS IN MEDIA LIBRARY
-- ------------------------------------------------------------------------------
insert into public.media (url, path, alt_text, width, height, size) values
('/images/hero-interior.jpg', 'hero-interior.jpg', 'SunnyBite botanical bistro interior dining room', 1600, 1067, 342000),
('/images/story-barista.jpg', 'story-barista.jpg', 'Barista frothing oat milk for latte', 800, 600, 145000),
('/images/story-friends.jpg', 'story-friends.jpg', 'Friends sharing food and iced tea at round table', 800, 600, 158000),
('/images/about-interior.jpg', 'about-interior.jpg', 'Sunlit botanical dining room with dusty rose chairs', 1200, 800, 260000),
('/images/contact-greenhouse.jpg', 'contact-greenhouse.jpg', 'Sunny conservatory greenhouse corner with monstera', 600, 600, 95000),
('/logo-horizontal.svg', 'logo-horizontal.svg', 'SunnyBite horizontal brand logo', 400, 120, 18813),
('/logo-icon.svg', 'logo-icon.svg', 'SunnyBite icon logo', 128, 128, 5926);
