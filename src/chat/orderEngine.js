import { SITE } from '../config/site.js';
import { MENU_ITEMS, CATEGORIES } from '../data/menu.js';
import { ROMAN_URDU_NUMBERS, ROMAN_URDU_KEYWORDS, detectLanguage } from './lexicon.js';

/**
 * SunnyBite Order-Taking Engine
 * Handles natural language dish matching, quantity parsing, Roman Urdu / English comprehension,
 * multi-turn checkout state machine, and cart synchronization.
 */

// -------------------------------------------------------------
// 1. Text Normalization & String Utilities
// -------------------------------------------------------------

export function normalizeText(text = '') {
  return text
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function levenshteinDistance(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function similarityRatio(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  if (longer.length === 0) return 1.0;
  const dist = levenshteinDistance(longer, shorter);
  return (longer.length - dist) / longer.length;
}

// -------------------------------------------------------------
// 2. Dish Matching Engine (Aliases, Substrings, & Fuzzy)
// -------------------------------------------------------------

export function findDishes(query, options = {}) {
  const normQuery = normalizeText(query);
  if (!normQuery) return { status: 'none', dishes: [] };

  // Remove common order filler words and articles/numbers
  const cleanQuery = normQuery
    .replace(/\b(i want|i d like|i would like|give me|get me|order|add|can i have|please|plz)\b/g, '')
    .replace(/\b(mujhe|chahiye|chaheay|dena|dedo|de do|bhej do|bhejdo|bhejo|daal do|daalo|laga do|mangwana hai)\b/g, '')
    .replace(/\b(a|an|one|two|three|four|five|six|seven|eight|nine|ten)\b/g, '')
    .replace(/\b(ek|aik|do|teen|chaar|char|paanch|panch|chay|che|saat|sat|aath|ath|nau|no|das|dass)\b/g, '')
    .replace(/\b(\d+)\b/g, '')
    .trim();

  const target = cleanQuery || normQuery;

  // 1. Direct Alias & Full Name Matching
  for (const dish of MENU_ITEMS) {
    const dishNameNorm = normalizeText(dish.name);
    if (dishNameNorm === target) {
      return { status: 'exact', dish, dishes: [dish], confidence: 1.0 };
    }

    if (dish.aliases && dish.aliases.some(alias => normalizeText(alias) === target)) {
      return { status: 'exact', dish, dishes: [dish], confidence: 0.98 };
    }
  }

  // 2. Substring & Token Overlap Scoring
  const scoredDishes = MENU_ITEMS.map(dish => {
    let score = 0;
    const dishNameNorm = normalizeText(dish.name);
    const dishTokens = dishNameNorm.split(' ');
    const queryTokens = target.split(' ');

    // Check alias exact substring
    if (dish.aliases) {
      for (const alias of dish.aliases) {
        const normAlias = normalizeText(alias);
        if (target === normAlias) {
          score = Math.max(score, 0.98);
        } else if (target.includes(normAlias) || normAlias.includes(target)) {
          score = Math.max(score, 0.90);
        }

        // Word level fuzzy match for typos like 'piza', 'burgar'
        for (const qt of queryTokens) {
          if (qt.length >= 3) {
            for (const at of normAlias.split(' ')) {
              const sim = similarityRatio(qt, at);
              if (sim >= 0.75) {
                score = Math.max(score, sim * 0.88);
              }
            }
          }
        }
      }
    }

    // Check dish name word matches
    for (const qt of queryTokens) {
      if (dishTokens.includes(qt)) {
        score = Math.max(score, 0.85);
      } else {
        for (const dt of dishTokens) {
          if (dt.length >= 4 && qt.length >= 4) {
            const sim = similarityRatio(qt, dt);
            if (sim >= 0.78) {
              score = Math.max(score, sim * 0.82);
            }
          }
        }
      }
    }

    // Boost popular dishes slightly when tied
    if (dish.popular && score > 0.6) {
      score += 0.05;
    }

    return { dish, score };
  });

  scoredDishes.sort((a, b) => b.score - a.score);
  const best = scoredDishes[0];

  // Strong single match
  if (best && best.score >= 0.75) {
    const second = scoredDishes[1];
    if (second && second.score >= 0.72 && Math.abs(best.score - second.score) < 0.06) {
      return {
        status: 'multiple',
        dishes: scoredDishes.filter(s => s.score >= 0.70).slice(0, 3).map(s => s.dish)
      };
    }
    return { status: 'exact', dish: best.dish, dishes: [best.dish], confidence: best.score };
  }

  // 3. Category Word Match
  const categoryKeywords = {
    desserts: ["sweet", "meetha", "dessert", "desserts", "mithai"],
    drinks: ["drink", "drinks", "beverage", "beverages", "sharbat", "pine ka"],
    pasta: ["pasta", "pastas", "noodles", "fettuccine", "spaghetti"],
    pizza: ["pizza", "pizzas"],
    burgers: ["burger", "burgers"],
    starters: ["starter", "starters", "appetizer", "appetizers"],
    salads: ["salad", "salads", "greens"]
  };

  for (const [catKey, kws] of Object.entries(categoryKeywords)) {
    if (kws.some(kw => target.includes(kw))) {
      const catDishes = MENU_ITEMS.filter(d => d.category === catKey);
      return {
        status: 'category',
        category: catKey,
        dishes: catDishes.slice(0, 3)
      };
    }
  }

  const suggestions = MENU_ITEMS.filter(d => d.popular).slice(0, 3);
  return { status: 'none', dishes: [], suggestions };
}

// -------------------------------------------------------------
// 3. Quantity & Multi-Item Parser
// -------------------------------------------------------------

export function extractQuantity(phrase) {
  const norm = normalizeText(phrase);

  const digitMatch = norm.match(/\b(\d+)\s*x\b/) || norm.match(/\bx\s*(\d+)\b/) || norm.match(/\b(\d+)\b/);
  if (digitMatch) {
    const n = parseInt(digitMatch[1], 10);
    if (!isNaN(n) && n > 0) return n;
  }

  const words = norm.split(' ');
  for (const w of words) {
    if (ROMAN_URDU_NUMBERS[w]) {
      return ROMAN_URDU_NUMBERS[w];
    }
  }

  return 1;
}

export function parseOrderItems(rawMessage) {
  // Normalize conjunctions & punctuation to commas before splitting
  const prepared = rawMessage
    .toLowerCase()
    .replace(/[,;&+]/g, ' , ')
    .replace(/\b(and|aur|plus|saath|with)\b/g, ' , ');

  const segments = prepared
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const matched = [];
  const notFound = [];
  let categoryMatch = null;

  for (const segment of segments) {
    const qty = extractQuantity(segment);
    const result = findDishes(segment);

    if (result.status === 'exact') {
      matched.push({ dish: result.dish, qty });
    } else if (result.status === 'multiple') {
      matched.push({ dish: result.dishes[0], qty, choices: result.dishes });
    } else if (result.status === 'category') {
      categoryMatch = { category: result.category, dishes: result.dishes };
    } else {
      const cleanedSegment = normalizeText(segment)
        .replace(/\b(i want|order|add|give me|mujhe|chahiye|ek|aik|do|teen|chaar|paanch|a|an|one|\d+)\b/g, '')
        .trim();
      if (cleanedSegment.length >= 2) {
        notFound.push(cleanedSegment);
      }
    }
  }

  return { matched, notFound, categoryMatch };
}

// -------------------------------------------------------------
// 4. Pakistani Mobile Phone Number Validation
// -------------------------------------------------------------

export function validatePakistaniPhone(input = '') {
  const clean = input.replace(/[\s\-\(\)]/g, '').trim();
  const pkRegex = /^((\+92|92)?3[0-9]{9})$|^03[0-9]{9}$/;
  const isValid = pkRegex.test(clean);

  let formatted = input.trim();
  if (isValid) {
    let digits = clean;
    if (digits.startsWith('+92')) digits = digits.substring(3);
    else if (digits.startsWith('92')) digits = digits.substring(2);
    else if (digits.startsWith('0')) digits = digits.substring(1);
    formatted = `+92 ${digits.substring(0, 3)} ${digits.substring(3)}`;
  }

  return { isValid, formatted, raw: clean };
}

// -------------------------------------------------------------
// 5. WhatsApp Order Formatter
// -------------------------------------------------------------

export function buildWhatsAppOrderMessage(cartItems, customer = {}) {
  const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.qty, 0);

  let itemsText = cartItems
    .map(i => `• ${i.qty} × ${i.name} (Rs. ${(i.price * i.qty).toLocaleString()})`)
    .join('\n');

  let msg = `*New SunnyBite Order* 🍽️\n-------------------------\n`;
  if (customer.name) msg += `*Customer:* ${customer.name}\n`;
  if (customer.phone) msg += `*Phone:* ${customer.phone}\n`;
  if (customer.orderType) msg += `*Order Type:* ${customer.orderType}\n`;
  msg += `\n*Items Ordered:*\n${itemsText}\n\n`;
  if (customer.notes && customer.notes !== 'No notes') {
    msg += `*Special Instructions:* ${customer.notes}\n`;
  }
  msg += `-------------------------\n*Total Amount:* Rs. ${subtotal.toLocaleString()}\n\n`;
  msg += `Looking forward to your team's confirmation!`;

  return msg;
}

// -------------------------------------------------------------
// 6. Conversational Order State Handler
// -------------------------------------------------------------

const GENERAL_INQUIRY_MARKERS = [
  'where', 'location', 'kahan', 'kidhar', 'address', 'pata', 'rasta', 'directions',
  'deliver', 'delivery', 'home delivery',
  'hours', 'timing', 'timings', 'open', 'closed', 'kab khulta', 'kab band',
  'phone', 'number', 'call', 'telephone', 'mobile', 'whatsapp', 'rabta',
  'who made', 'who designed', 'who built', 'who created', 'developer', 'creator', 'author', 'kisne banaya', 'kis ne banaya',
  'halal', 'zabiha',
  'payment', 'pay', 'easypaisa', 'nayapay', 'card', 'cash',
  'park', 'parking',
  'reservation', 'reserve', 'book a table', 'table for',
  'event', 'gathering', 'party',
  'menu', 'menu dikhao', 'menu card', 'dishes', 'khana',
  'about', 'story', 'foodie club', 'newsletter', 'best', 'compare', 'difference', 'expensive', 'cheapest'
];

function isGeneralInquiry(text) {
  const norm = normalizeText(text);
  if (text.includes('?')) return true;
  return GENERAL_INQUIRY_MARKERS.some(kw => norm.includes(kw));
}

export function handleOrderTurn(message, context = {}, cartItems = []) {
  const raw = message.trim();
  const norm = normalizeText(raw);
  const lang = detectLanguage(raw);
  const currentContext = { ...context };
  const checkoutState = currentContext.checkoutState || {
    step: 'idle',
    data: { orderType: 'Pickup', name: '', phone: '', notes: '' }
  };

  // Guard: If message is clearly a general question/inquiry
  if (isGeneralInquiry(raw)) {
    // If user is mid-checkout, preserve the checkoutState for resumption
    return { handled: false, context: currentContext };
  }

  // ---------------------------------------------------------
  // A. Cancellation / Clear Cart / Modifications
  // ---------------------------------------------------------

  if (
    norm === 'clear my order' ||
    norm === 'clear order' ||
    norm === 'start over' ||
    norm === 'clear cart' ||
    norm === 'sab hata do' ||
    norm === 'order cancel'
  ) {
    currentContext.checkoutState = { step: 'idle', data: {} };
    return {
      handled: true,
      cartAction: { type: 'clear' },
      text: lang === 'ur'
        ? "Aapka order clear kar diya hai. 🍽️ Dobara kuch order karna ho to batayein!"
        : "Your order has been cleared. 🍽️ Whenever you're ready, let me know what you'd like to order!",
      chips: ["Show menu", "Popular dishes", "Opening hours"],
      context: currentContext
    };
  }

  // "Same as last time"
  if (
    norm.includes('same as last') ||
    norm.includes('last order') ||
    norm.includes('repeat order') ||
    norm.includes('jo pehle mangwaya tha') ||
    norm.includes('wahi bhej do')
  ) {
    try {
      const saved = localStorage.getItem('sunnybite_last_order');
      if (saved) {
        const lastOrder = JSON.parse(saved);
        if (Array.isArray(lastOrder.items) && lastOrder.items.length > 0) {
          return {
            handled: true,
            cartAction: { type: 'set_items', items: lastOrder.items },
            text: lang === 'ur'
              ? `Aapka pichla order wapis add kar diya hai (${lastOrder.items.length} dishes). Checkout karein ya kuch aur chahiye?`
              : `Added your previous order back to your cart (${lastOrder.items.length} items)! Shall we proceed to checkout?`,
            chips: ["Checkout now", "Add more", "View cart"],
            actions: [{ type: 'cart_toggle', label: 'View Cart', icon: 'shopping_bag' }],
            context: currentContext
          };
        }
      }
    } catch {
      // fallback
    }
    return {
      handled: true,
      text: lang === 'ur'
        ? "Mujhe aapka pichla order nahi mila. Aap menu dekh kar nayi dish bata sakte hain!"
        : "I couldn't find a saved previous order on this device. Would you like to browse our popular favorites?",
      chips: ["Show menu", "Popular dishes"],
      context: currentContext
    };
  }

  // Quantity modification: "make it 3", "make burger 3", "change pizza to 2"
  const modQtyMatch = norm.match(/(?:make|change|set|kardo|kar do)\s*(?:the\s*)?([a-z\s]+)?\s*(?:to\s*)?(\d+)/i);
  if (modQtyMatch && cartItems.length > 0) {
    const itemTarget = modQtyMatch[1] ? modQtyMatch[1].trim() : '';
    const newQty = parseInt(modQtyMatch[2], 10);
    let targetDish = cartItems[cartItems.length - 1];

    if (itemTarget) {
      const found = findDishes(itemTarget);
      if (found.dish) {
        const cartMatch = cartItems.find(i => i.id === found.dish.id);
        if (cartMatch) targetDish = cartMatch;
      }
    }

    if (targetDish && newQty > 0) {
      if (newQty > (SITE.ordering.maxQtyPerItem || 20)) {
        return {
          handled: true,
          text: lang === 'ur'
            ? `20 se zyada items ke liye hamari catering team WhatsApp par confirm karegi. Call ya WhatsApp karein?`
            : `For orders over 20 items, our kitchen team coordinates directly to ensure freshness. Would you like to confirm via WhatsApp or call?`,
          chips: ["Chat on WhatsApp", "Call host"],
          actions: [{ type: 'link', label: 'WhatsApp Host', href: SITE.whatsappLink, icon: 'chat' }],
          context: currentContext
        };
      }

      return {
        handled: true,
        cartAction: { type: 'update_qty', dishId: targetDish.id, qty: newQty },
        text: lang === 'ur'
          ? `${targetDish.name} ki quantity ${newQty} kar di hai. 🍽️`
          : `Updated ${targetDish.name} to ${newQty} × (Rs. ${(targetDish.price * newQty).toLocaleString()}).`,
        chips: ["Checkout now", "Add more", "View cart"],
        context: currentContext
      };
    }
  }

  // Remove dish: "remove pizza", "pizza nahi chahiye", "cancel cake", "hata do"
  const removeMatch = norm.match(/(?:remove|cancel|hata do|hatado|nahi chahiye|ni chahiye)\s*([a-z\s]+)?/i) ||
                     norm.match(/([a-z\s]+)\s*(?:nahi chahiye|hata do|cancel)/i);
  if (removeMatch && cartItems.length > 0) {
    const targetName = removeMatch[1] ? removeMatch[1].trim() : '';
    if (targetName) {
      const found = findDishes(targetName);
      if (found.dish) {
        const inCart = cartItems.find(i => i.id === found.dish.id);
        if (inCart) {
          return {
            handled: true,
            cartAction: { type: 'remove', dishId: inCart.id },
            text: lang === 'ur'
              ? `${inCart.name} ko order se hata diya hai.`
              : `Removed ${inCart.name} from your order.`,
            chips: ["View cart", "Show menu", "Checkout now"],
            context: currentContext
          };
        }
      }
    }
  }

  // ---------------------------------------------------------
  // B. Checkout State Machine Progression
  // ---------------------------------------------------------

  const isCheckoutIntent = norm === 'checkout' || norm === 'checkout now' || norm === 'place order' || norm === 'order complete' || norm === 'bill' || norm === 'order place karo';

  if (isCheckoutIntent && checkoutState.step === 'idle') {
    if (cartItems.length === 0) {
      return {
        handled: true,
        text: lang === 'ur'
          ? "Aapka basket abhi khali hai! Pehle koi lazeez dish select karein jaise Margherita Pizza ya Classic Cheeseburger. 🍕"
          : "Your basket is currently empty! Add something delicious first—like our wood-fired Margherita Pizza or Classic Cheeseburger. 🍕",
        chips: ["Show menu", "Popular dishes", "Vegetarian specials"],
        actions: [{ type: 'route', label: 'Explore Menu', path: '/menu', icon: 'restaurant_menu' }],
        context: currentContext
      };
    }

    checkoutState.step = 'collecting_type';
    currentContext.checkoutState = checkoutState;

    return {
      handled: true,
      text: lang === 'ur'
        ? "Behtareen! Aapka order **Pickup** hoga ya **Dine-in**?"
        : "Wonderful! Would you like this order for **Pickup** or **Dine-in** at SunnyBite?",
      chips: ["Pickup", "Dine-in"],
      context: currentContext
    };
  }

  // Step 1: Collecting Type
  if (checkoutState.step === 'collecting_type') {
    if (norm.includes('pickup') || norm.includes('pick up') || norm.includes('takeaway')) {
      checkoutState.data.orderType = 'Pickup';
    } else if (norm.includes('dine') || norm.includes('table') || norm.includes('dining')) {
      checkoutState.data.orderType = 'Dine-in';
    } else {
      return {
        handled: true,
        text: "Please let us know: will this be for **Pickup** or **Dine-in**?",
        chips: ["Pickup", "Dine-in"],
        context: currentContext
      };
    }

    checkoutState.step = 'collecting_name';
    currentContext.checkoutState = checkoutState;

    let savedCustomer = null;
    try {
      const saved = localStorage.getItem('sunnybite_customer');
      if (saved) savedCustomer = JSON.parse(saved);
    } catch {
      // ignore
    }

    if (savedCustomer && savedCustomer.name) {
      checkoutState.data.name = savedCustomer.name;
      if (savedCustomer.phone) {
        checkoutState.data.phone = savedCustomer.phone;
        checkoutState.step = 'collecting_notes';
        return {
          handled: true,
          text: lang === 'ur'
            ? `Order ${checkoutState.data.orderType} ke liye set ho gaya hai (${savedCustomer.name} ke naam se). Koi special instructions (maslan no onions, less spicy)?`
            : `Set for ${checkoutState.data.orderType} under ${savedCustomer.name}! Any special kitchen notes (e.g. less spicy, no onions)?`,
          chips: ["No notes", "Less spicy", "Extra sauce"],
          context: currentContext
        };
      }
    }

    return {
      handled: true,
      text: lang === 'ur'
        ? `Order ${checkoutState.data.orderType} ke liye set ho gaya! May I know your name for the order?`
        : `Got it, ${checkoutState.data.orderType}! May I have your name for the order ticket?`,
      chips: savedCustomer?.name ? [savedCustomer.name] : [],
      context: currentContext
    };
  }

  // Step 2: Collecting Name
  if (checkoutState.step === 'collecting_name') {
    const cleanName = raw.replace(/\b(my name is|i am|mera naam|name is)\b/gi, '').trim();
    if (cleanName.length < 2) {
      return {
        handled: true,
        text: "Please provide your name so we can label your order ticket accurately:",
        context: currentContext
      };
    }

    checkoutState.data.name = cleanName;
    checkoutState.step = 'collecting_phone';
    currentContext.checkoutState = checkoutState;

    return {
      handled: true,
      text: lang === 'ur'
        ? `Shukriya, ${cleanName}! Aapka contact phone number kya hai? (Maslan 0300 1234567)`
        : `Thank you, ${cleanName}! What is your contact phone number? (e.g., 0300 1234567)`,
      context: currentContext
    };
  }

  // Step 3: Collecting Phone
  if (checkoutState.step === 'collecting_phone') {
    const phoneValidation = validatePakistaniPhone(raw);
    if (!phoneValidation.isValid) {
      return {
        handled: true,
        text: lang === 'ur'
          ? "Baraye meherbani durust Pakistani mobile number likhein (maslan 0300 1234567 ya +92 300 1234567):"
          : "Please enter a valid Pakistani mobile number so our kitchen can verify your order (e.g., 0300 1234567 or +92 300 1234567):",
        context: currentContext
      };
    }

    checkoutState.data.phone = phoneValidation.formatted;
    checkoutState.step = 'collecting_notes';
    currentContext.checkoutState = checkoutState;

    return {
      handled: true,
      text: lang === 'ur'
        ? "Phone number note ho gaya! Kitchen ke liye koi special instructions ya notes hain? (Maslan: less spicy, no onions, etc.)"
        : "Got your number! Any special kitchen instructions or notes for the chef? (e.g. less spicy, allergies, no onions)",
      chips: ["No notes", "Less spicy", "Extra sauce", "Allergy alert"],
      context: currentContext
    };
  }

  // Step 4: Collecting Notes -> Generate Review Summary
  if (checkoutState.step === 'collecting_notes') {
    checkoutState.data.notes = norm.includes('no note') || norm.includes('nahi') || norm.includes('none')
      ? 'No notes'
      : raw.trim();

    checkoutState.step = 'review';
    currentContext.checkoutState = checkoutState;

    try {
      localStorage.setItem('sunnybite_customer', JSON.stringify({
        name: checkoutState.data.name,
        phone: checkoutState.data.phone
      }));
    } catch {
      // ignore
    }

    const subtotal = cartItems.reduce((acc, i) => acc + i.price * i.qty, 0);
    const waText = buildWhatsAppOrderMessage(cartItems, checkoutState.data);
    const waUrl = `${SITE.whatsappLink}?text=${encodeURIComponent(waText)}`;

    return {
      handled: true,
      intent: 'order_review',
      text: lang === 'ur'
        ? `Aapke order ki summary tayyar hai! Niche diye gaye card par details check karein aur WhatsApp par send karein:`
        : `Here is your order summary! Please review the details below and tap to send directly to our team on WhatsApp:`,
      orderSummary: {
        customer: checkoutState.data,
        items: cartItems,
        total: subtotal,
        waUrl
      },
      chips: ["Confirm & send on WhatsApp", "Edit items", "Cancel order"],
      actions: [
        { type: 'link', label: 'Confirm & Send on WhatsApp', href: waUrl, icon: 'chat' },
        { type: 'cart_toggle', label: 'Edit Items in Cart', icon: 'edit' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // C. Parse Direct Order Intent from Raw Message
  // ---------------------------------------------------------

  const { matched, notFound, categoryMatch } = parseOrderItems(raw);

  // Category query (e.g. "something sweet", "drinks", "kuch meetha")
  if (categoryMatch && matched.length === 0) {
    return {
      handled: true,
      intent: 'category_query',
      text: lang === 'ur'
        ? `Hamare paas ${categoryMatch.category} mein yeh lazeez choices hain:`
        : `Here are our popular dishes in our ${categoryMatch.category} collection:`,
      dishes: categoryMatch.dishes,
      chips: categoryMatch.dishes.map(d => `Add ${d.name}`),
      context: currentContext
    };
  }

  if (matched.length > 0) {
    const totalNewQty = matched.reduce((acc, m) => acc + m.qty, 0);
    if (totalNewQty > (SITE.ordering.maxQtyPerItem || 20)) {
      return {
        handled: true,
        text: lang === 'ur'
          ? `20 se zyada items ke order ke liye hamari catering team WhatsApp par direct deal karegi taake taza khana pohnchay.`
          : `For large orders above 20 items, our kitchen team coordinates directly on WhatsApp to ensure fresh culinary perfection!`,
        chips: ["Chat on WhatsApp", "Call host"],
        actions: [{ type: 'link', label: 'WhatsApp Catering Host', href: SITE.whatsappLink, icon: 'chat' }],
        context: currentContext
      };
    }

    const addedDishes = matched.map(m => ({ dish: m.dish, qty: m.qty }));
    const summaryNames = matched.map(m => `${m.qty} × ${m.dish.name} (Rs. ${(m.dish.price * m.qty).toLocaleString()})`).join(', ');

    let replyText = '';
    if (lang === 'ur') {
      replyText = `Added ${summaryNames} aapke order mein! 🍽️`;
    } else {
      replyText = `Added ${summaryNames}! 🍕`;
    }

    if (notFound.length > 0) {
      replyText += lang === 'ur'
        ? ` (Note: "${notFound.join(', ')}" hamare menu par nahi hai, lekin baki items add ho gaye hain).`
        : ` (Note: we don't have "${notFound.join(', ')}" on our menu, but your other items were added).`;
    }

    replyText += lang === 'ur'
      ? " Aur kuch chahiye ya checkout karein?"
      : " Anything else, or shall I start checkout?";

    currentContext.checkoutState = { step: 'items_added', data: {} };

    return {
      handled: true,
      cartAction: { type: 'add_multiple', items: addedDishes },
      text: replyText,
      dishes: matched.map(m => m.dish),
      chips: ["Checkout now", "Add more", "View cart", "Show menu"],
      actions: [
        { type: 'cart_toggle', label: 'View Cart', icon: 'shopping_bag' }
      ],
      context: currentContext
    };
  }

  // If the query was purely an unknown food item (e.g., "sushi", "biryani")
  const hasOrderWord = norm.includes('order') || norm.includes('chahiye') || norm.includes('want') || norm.includes('give me') || norm.includes('get me');
  const isShortFoodCandidate = norm.split(' ').length <= 3 && !isGeneralInquiry(norm);

  if (notFound.length > 0 && (hasOrderWord || isShortFoodCandidate)) {
    const itemAttempt = notFound[0];
    const suggestions = MENU_ITEMS.filter(d => d.popular).slice(0, 3);
    return {
      handled: true,
      text: lang === 'ur'
        ? `Maaf kijiye, hamare paas "${itemAttempt}" nahi hai. Hum artisanal pastas, smash burgers, aur wood-fired pizzas banate hain! Niche diye gaye favorites try karein:`
        : `We don't serve "${itemAttempt}". We specialize in handcrafted pastas, gourmet burgers, and wood-fired pizzas! Here are our most beloved dishes:`,
      dishes: suggestions,
      chips: ["Show full menu", "Pasta specials", "Popular burgers"],
      context: currentContext
    };
  }

  return { handled: false, context: currentContext };
}
