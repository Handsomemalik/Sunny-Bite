# SunnyBite — Artisanal Botanical Bistro Web Application & AI Assistant

SunnyBite is a pixel-perfect, production-grade restaurant web application designed with the **Pastel Botanical Bistro** design aesthetic (gentle creams `#FBF5EB`, soft sage greens `#EFFEE8`, dusty rose `#E6809A`, and dark pine forest accents `#2F5D3E`).

It features an in-browser local AI chatbot assistant with intent classification and typo tolerance, global shopping cart with WhatsApp order dispatch, 3D tilt cards, quick-view modals, and smooth animations powered by **Framer Motion** and **Lenis**.

---

## 🌟 Key Features

1. **SunnyBite AI Assistant (Local Intent Engine)**:
   - Operates 100% in-browser with zero remote API keys required.
   - Built on `src/chat/knowledge.js` and `src/chat/engine.js`.
   - Supports 25+ intents: greetings, hours, live open/closed status (Asia/Karachi time), menu filtering, budget searches, dish cards, and order dispatch.
   - Bilingual keyword matching (English & Roman Urdu, e.g., *"location kahan hai"*, *"menu dikhao"*, *"kisne banaya"*).
   - Polite boundary guarding: redirects off-topic discussions (politics, coding, medical) back to dining.
   - Clearly marked `// TODO: optional LLM provider hook` in `src/chat/engine.js` for future OpenAI/Gemini/Anthropic API integration.

2. **Global Cart & WhatsApp Ordering**:
   - React Context state persisted in `localStorage`.
   - Sliding glass and cream Cart Drawer with animated item steppers.
   - Pickup and Dine-in order toggle with customer name, phone, and chef notes.
   - Formatted WhatsApp order message generation (`wa.me/923097227807`) with confetti burst celebration.
   - Table reservation form in `Contact.jsx` also creates formatted WhatsApp reservation payloads.

3. **Premium Botanical Animation Layer**:
   - 3D tilt cards with pointer-following specular glare.
   - Morphing quantity steppers and heart burst particles.
   - Animated arc clones flying to navbar cart badge on add.
   - Sliding active indicators (`layoutId`) on navbar tabs and menu category chips.
   - Shared-element Quick View Dish Modal.
   - Count-up statistics on scroll view (`StatCard.jsx`).
   - Self-drawing pink underline and word-by-word reveal on hero headline.
   - Desktop-only smooth magnetic trailing cursor.
   - Full support for `prefers-reduced-motion`.

4. **SEO & Production Readiness**:
   - JSON-LD Restaurant Schema in `index.html`.
   - Meta author tag (`Abdul Manan`) and OpenGraph/Twitter social cards.
   - `robots.txt`, `sitemap.xml`, and `manifest.webmanifest`.
   - Production Apache `.htaccess` with SPA history rewrites, Gzip compression, and browser caching headers.

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js 18+ installed on your system.

### Installation
```bash
# 1. Install dependencies
npm install

# 2. Run local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
```
The compiled, minified static files will be generated in the `dist/` directory.

---

## 🛠️ Configuration & Content Customization

All restaurant details, menus, and chatbot knowledge are centralized in dedicated files:

### 1. General Restaurant Info: `src/config/site.js`
Edit this file to update:
- Restaurant name, address, Google Maps query (`SITE.mapQuery`)
- Phone number & WhatsApp links (`SITE.phone`, `SITE.whatsappLink`)
- Operating hours (`SITE.hours.daily`, `brunch`, `dinner`)
- Key stats (`years`, `dishes`, `customers`, `since`)
- Social media links (`instagram`, `facebook`, `youtube`)
- Creator attribution (`SITE.creator`)

### 2. Menu Items & Pricing: `src/data/menu.js`
Edit this file to adjust the 18 dishes:
- Dish ID, name, category (`starters`, `mains`, `pasta`, `pizza`, `salads`, `desserts`, `beverages`)
- Price (in PKR), description, dietary tags (`Vegetarian`, `Vegan`, `Gluten-Free`, etc.)
- Best-seller / Chef's Pick badges (`popular: true`)
- Image paths (`/images/dish-*.jpg`)

### 3. Chatbot Operational FAQ: `src/chat/knowledge.js`
Contains the editable `FAQ` object for details the site does not publish:
- `delivery`: Policy and radius handoff to phone/WhatsApp.
- `payment`: Cash, cards, EasyPaisa / JazzCash confirmation.
- `parking`: Valet and street parking details.
- `halal`: 100% Halal kitchen sourcing confirmation.
- `discounts`: Promotional bank cards & corporate discounts.
- `jobs`: Career applications and kitchen stage inquiries.

### 4. Optional Real LLM Provider Hook: `src/chat/engine.js`
To replace the local intent engine with a live OpenAI, Anthropic, or Gemini endpoint:
1. Locate the marked comment `// TODO: optional LLM provider hook` in `src/chat/engine.js`.
2. Uncomment or inject your API call inside `getReply(message, context)`.
3. Feed `KNOWLEDGE_PROMPT_CONTEXT` as the system prompt.

---

## 🌐 Deploying to Hostinger

Hostinger supports static and SPA hosting seamlessly:

1. **Build the production bundle**:
   ```bash
   npm run build
   ```
2. **Access your Hostinger File Manager**:
   - Log in to your Hostinger hPanel.
   - Navigate to **Websites** → **Manage** → **File Manager** (or connect via FTP / FileZilla).
   - Open the root folder: `public_html/`.
3. **Upload Files**:
   - Upload the **contents** of the local `dist/` folder into `public_html/` (so that `index.html` is directly inside `public_html/index.html`).
   - Ensure `.htaccess` is present in `public_html/` (it includes the necessary Apache fallback rules so refreshing `/menu` or `/about` will not throw 404 errors, plus Gzip and browser cache headers).
4. **Test**:
   - Visit your domain. Check pages, chat responses, and cart WhatsApp checkout.

---

## 📋 QA & Intent Test Coverage

The chatbot engine covers all target intents and edge cases:
| Query | Handled By | Expected Response |
| :--- | :--- | :--- |
| *"What's your name?"* | Identity | Introduces itself as SunnyBite Assistant with warm café tone. |
| *"Where are you located?"* | Location | I-8 Markaz, Islamabad with "Get directions" & "Contact" buttons. |
| *"Give me your number"* | Phone / WhatsApp | +92 309 7227807 with tel: and wa.me quick action buttons. |
| *"What time do you open?"* | Hours | Daily 9am–10pm; brunch 9am–2pm; dinner 5pm–10pm. |
| *"Are you open now?"* | Open Now | Dynamically computed against current time in Asia/Karachi. |
| *"Show vegetarian dishes"* | Dietary Filter | Filters menu items tagged vegetarian with price and details. |
| *"Gluten-free options?"* | Dietary Filter | Highlights gluten-free dishes & advises team confirmation on allergies. |
| *"Something under Rs. 500"* | Budget Query | Lists dishes under Rs. 500 (e.g., drinks, light bites). |
| *"Recommend a dessert"* | Recommendation | Suggests signature desserts (Berry Pavlova, Pistachio Tart). |
| *"Add 2 margherita pizza"* | Add to Cart | Detects quantity (2) and dish ("Margherita Pizza") and adds to order. |
| *"Show my cart"* | View Cart | Opens the cart drawer with item summary. |
| *"Book a table for 4"* | Reservation | Details reservation options and opens WhatsApp / Contact form. |
| *"Who made this website?"* | Creator Credit | *"This website and assistant were designed and developed by Abdul Manan, a UI/UX designer and web developer."* |
| *"kisne banaya ye website?"* | Creator Credit (Urdu) | Correctly identifies Abdul Manan as creator via Roman Urdu keyword match. |
| *"location kahan hai?"* | Location (Urdu) | Gives I-8 Islamabad location in Roman Urdu / friendly response. |
| *"Do you deliver?"* | Unstated Fact Handoff | Explains delivery coordination via WhatsApp/call without guessing. |
| *"Tell me a joke about politics"* | Boundary Guard | Politely steers away from politics back to food and hospitality. |

---

## 👨‍💻 Credits & License

- **Design & Development**: [Abdul Manan](https://github.com/) — UI/UX Designer & Web Developer
- **Design System**: Pastel Botanical Bistro Design System
- **Project**: SunnyBite Café & Restaurant
