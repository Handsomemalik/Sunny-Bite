import { SITE } from '../config/site.js';
import {
  FAQ,
  getUnknownFaqAnswer,
  SITE_INDEX,
  isOpenNow,
  getAllDishes,
  getDishesByCategory,
  searchDishes,
  getDietaryDishes,
  getBudgetDishes,
  getPopularDishes,
  getMostExpensiveDish,
  getCheapestDish,
  getBestDessert
} from './knowledge.js';
import {
  findDishes,
  handleOrderTurn,
  buildWhatsAppOrderMessage,
  normalizeText,
  similarityRatio
} from './orderEngine.js';
import { detectLanguage, ROMAN_URDU_KEYWORDS } from './lexicon.js';

/**
 * SUNNYBITE ASSISTANT MASTER ENGINE
 * 
 * Capabilities:
 * 1. Takes orders by dish name (English & Roman Urdu)
 * 2. Multi-turn checkout state machine
 * 3. Complete website knowledge & navigation actions
 * 4. FAQ answers strictly from live data
 * 5. Strict price safety & discount refusal
 * 6. LLM-ready tool interfaces
 */

// -------------------------------------------------------------
// LLM-Ready Tool Interface Functions (for external AI integration)
// -------------------------------------------------------------

export const AssistantTools = {
  findDishes: (query) => findDishes(query),
  buildWhatsAppOrder: (cart, customer) => buildWhatsAppOrderMessage(cart, customer),
  isOpen: () => isOpenNow(),
  getMenu: () => getAllDishes(),
  getFaq: (topic) => FAQ[topic] || null,
  getSiteInfo: () => SITE_INDEX
};

// -------------------------------------------------------------
// Helper Keyword Matcher
// -------------------------------------------------------------

function hasMatch(query, keywords) {
  const norm = normalizeText(query);
  const words = norm.split(' ').filter(Boolean);

  for (const kw of keywords) {
    const normKw = normalizeText(kw);
    if (normKw.includes(' ')) {
      if (norm.includes(normKw)) return true;
    } else {
      if (words.includes(normKw)) return true;
      if (normKw.length >= 5) {
        for (const w of words) {
          if (w.length >= 5 && Math.abs(w.length - normKw.length) <= 1 && similarityRatio(w, normKw) >= 0.82) {
            return true;
          }
        }
      }
    }
  }
  return false;
}

// -------------------------------------------------------------
// Main Reply Handler
// -------------------------------------------------------------

export async function getReply(message, context = {}, cartItems = []) {
  // TODO: optional LLM provider hook
  // Connect external provider (e.g. Gemini API, Anthropic) via serverless proxy here if enabled.
  /*
  if (typeof window !== 'undefined' && window.SUNNYBITE_USE_REMOTE_LLM) {
    try {
      return await fetchRemoteLLMReply(message, context, cartItems);
    } catch (e) {
      console.warn("LLM fallback to local SunnyBite rule-based engine:", e);
    }
  }
  */

  const raw = (message || '').trim();
  const text = normalizeText(raw);
  const lang = detectLanguage(raw);
  const currentContext = { ...context };

  // Detect user's name if introduced
  const nameMatch = raw.match(/(?:my name is|i am|i'm|mera naam)\s+([a-zA-Z]+)/i);
  if (nameMatch) {
    currentContext.userName = nameMatch[1];
  }

  // ---------------------------------------------------------
  // 1. SAFETY & DISCOUNT REFUSAL (Strict Honesty Rule)
  // ---------------------------------------------------------
  if (
    hasMatch(text, [
      '50% off', 'discount', 'discounts', 'make it free', 'free food',
      'cheap price', 'give discount', 'kam paise', 'discount do',
      'ignore previous instructions', 'ignore instructions', 'price 0', 'free me dedo'
    ])
  ) {
    return {
      intent: 'discount_refusal',
      text: lang === 'ur'
        ? "SunnyBite par tamam prices fixed aur genuine hain. Hum organic aur fresh ingredients use karte hain, is liye ad-hoc discounts nahi hotay, lekin har dish khuloos aur behtareen zaiqay ke sath banti hai! 🍽️"
        : "All our menu prices are fixed and handcrafted with organic goodness. We don't offer ad-hoc discounts, but every meal is prepared with fresh quality and generous portions! 🌿",
      chips: ["Show menu", "Popular dishes", "Foodie Club perks"],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 2. CHECKOUT OR ORDER-TAKING PIPELINE FIRST
  // ---------------------------------------------------------
  // If the user has a pending checkout state OR typed a food/order command:
  const orderResult = handleOrderTurn(raw, currentContext, cartItems);
  if (orderResult.handled) {
    // Check if store is currently closed
    const status = isOpenNow();
    if (!status.isOpen && (orderResult.cartAction || orderResult.orderSummary)) {
      const closedNotice = lang === 'ur'
        ? "\n(Note: Hum filhal band hain aur subha 9:00 AM open hongay. Aapka order review kar ke subha WhatsApp par dekha jaye ga)."
        : "\n(Note: We're currently closed and open at 9:00 AM. Your order will be received for morning preparation).";
      orderResult.text += closedNotice;
    }
    return orderResult;
  }

  // ---------------------------------------------------------
  // 3. MID-CHECKOUT INTERRUPTION RESUMPTION
  // ---------------------------------------------------------
  const wasInCheckout = currentContext.checkoutState &&
    currentContext.checkoutState.step &&
    currentContext.checkoutState.step !== 'idle';

  // ---------------------------------------------------------
  // 4. CREATOR / ATTRIBUTION (English & Roman Urdu)
  // ---------------------------------------------------------
  if (
    hasMatch(text, [
      'who made you', 'who designed', 'who built', 'who created',
      'developer', 'creator', 'author', 'abdul manan', 'kisne banaya',
      'kis ne banaya', 'kisne banayi', 'developer kon', 'creator kon',
      'who made this website', 'who made this site', 'who made the website'
    ])
  ) {
    const creatorMsg = lang === 'ur'
      ? SITE_INDEX.creator.answerUrdu
      : SITE_INDEX.creator.answerEnglish;

    return {
      intent: 'creator',
      text: creatorMsg,
      chips: ["Show menu", "Our story", "Where are you?"],
      actions: [
        { type: 'route', label: 'About SunnyBite', path: '/about', icon: 'info' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 5. IS RESTAURANT OPEN NOW? (Asia/Karachi Timezone)
  // ---------------------------------------------------------
  if (
    hasMatch(text, [
      'open now', 'are you open', 'open right now', 'is it open',
      'khula hai abhi', 'ab khula hai', 'open today', 'closed now', 'kya khula hai'
    ])
  ) {
    const status = isOpenNow();
    if (status.isOpen) {
      return {
        intent: 'open_now',
        text: lang === 'ur'
          ? `Jee haan, hum is waqt I-8 Islamabad mein open hain! Kitchen raat 10:00 PM tak fresh dishes serve kar raha hai. ✨`
          : `Yes, we are open right now in I-8 Islamabad! Our kitchen serves joyfully until 10:00 PM tonight. ✨`,
        chips: ["Explore menu", "Book a table", "Get directions"],
        actions: [
          { type: 'link', label: 'Call us', href: `tel:${SITE.phoneRaw}`, icon: 'call' },
          { type: 'link', label: 'Get Directions', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapQuery)}`, icon: 'directions' }
        ],
        context: currentContext
      };
    } else {
      return {
        intent: 'open_now',
        text: lang === 'ur'
          ? `Hum filhal band hain! SunnyBite rozana subha 9:00 AM se raat 10:00 PM tak khula hota hai. Weekend brunch subha 9 baje shuru hota hai. ☀️`
          : `We're currently closed. We open at 9am. Daily hours are 9:00 AM – 10:00 PM. Weekend brunch begins at 9:00 AM. ☀️`,
        chips: ["Opening hours", "Explore menu", "Where are you?"],
        actions: [
          { type: 'route', label: 'View Menu', path: '/menu', icon: 'restaurant_menu' }
        ],
        context: currentContext
      };
    }
  }

  // ---------------------------------------------------------
  // 6. HOURS & TIMINGS
  // ---------------------------------------------------------
  if (
    hasMatch(text, [
      'hours', 'timing', 'timings', 'time do you open', 'opening time',
      'closing time', 'when open', 'kab khulta hai', 'kab band hota hai',
      'brunch time', 'dinner time', 'waqt'
    ])
  ) {
    return {
      intent: 'hours',
      text: lang === 'ur'
        ? `SunnyBite rozana ${SITE.hours.daily} khula hota hai. Daily brunch ${SITE.hours.brunch} aur dinner ${SITE.hours.dinner} hota hai.`
        : `We are open daily from ${SITE.hours.daily}. Daily brunch runs from ${SITE.hours.brunch}, and dinner is served from ${SITE.hours.dinner}.`,
      chips: ["Are you open now?", "Book a table", "Explore menu"],
      actions: [
        { type: 'route', label: 'Contact Page', path: '/contact', icon: 'mail' },
        { type: 'link', label: 'Call Host', href: `tel:${SITE.phoneRaw}`, icon: 'call' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 7. LOCATION & DIRECTIONS
  // ---------------------------------------------------------
  if (
    hasMatch(text, [
      'location', 'where are you', 'address', 'where located',
      'kahan hai', 'kahan ho', 'kidhar hai', 'pata kya hai', 'rasta'
    ])
  ) {
    return {
      intent: 'location',
      text: lang === 'ur'
        ? `SunnyBite ${SITE.location} mein waqia hai. Entrance par aasani se car parking aur step-free rasta dastiyab hai. 🌿`
        : `SunnyBite is nestled in ${SITE.location}. We offer convenient nearby parking and a step-free garden entrance. 🌿`,
      chips: ["Get directions", "Opening hours", "Book a table"],
      actions: [
        { type: 'link', label: 'Get Directions', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapQuery)}`, icon: 'directions' },
        { type: 'route', label: 'Open Contact Page', path: '/contact', icon: 'location_on' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 8. CONTACT & PHONE & WHATSAPP
  // ---------------------------------------------------------
  if (
    hasMatch(text, [
      'phone', 'number', 'call', 'telephone', 'mobile', 'whatsapp',
      'wa', 'number do', 'rabta', 'contact'
    ])
  ) {
    return {
      intent: 'contact',
      text: lang === 'ur'
        ? `Aap hamare host desk par phone (${SITE.phone}) kar sakte hain ya seedha WhatsApp par message bhej sakte hain! 📞`
        : `You can reach our host desk directly by phone at ${SITE.phone} or send us a quick hello on WhatsApp! 📞`,
      chips: ["Call now", "Chat on WhatsApp", "Our location"],
      actions: [
        { type: 'link', label: 'Call Now', href: `tel:${SITE.phoneRaw}`, icon: 'call' },
        { type: 'link', label: 'Chat on WhatsApp', href: SITE.whatsappLink, icon: 'chat' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 9. DELIVERY INQUIRY (Reads config flag)
  // ---------------------------------------------------------
  if (
    hasMatch(text, [
      'delivery', 'deliver', 'home delivery', 'do you deliver', 'takeaway', 'pickup',
      'ghar bhejte ho', 'delivery hai', 'parcel'
    ])
  ) {
    return {
      intent: 'delivery',
      text: FAQ.delivery.answer,
      chips: ["Chat on WhatsApp", "Call host desk", "View menu"],
      actions: [
        { type: 'link', label: 'WhatsApp Delivery Desk', href: SITE.whatsappLink, icon: 'chat' },
        { type: 'link', label: 'Call Us', href: `tel:${SITE.phoneRaw}`, icon: 'call' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 10. HALAL VERIFICATION
  // ---------------------------------------------------------
  if (hasMatch(text, ['halal', 'halal meat', 'is food halal', 'zabiha'])) {
    return {
      intent: 'halal',
      text: FAQ.halal.answer,
      chips: ["Show main course", "Popular burgers", "View menu"],
      actions: [
        { type: 'route', label: 'Browse Menu', path: '/menu', icon: 'restaurant_menu' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 11. PAYMENT METHODS
  // ---------------------------------------------------------
  if (hasMatch(text, ['payment', 'how to pay', 'payment method', 'easypaisa', 'nayapay', 'credit card', 'debit card', 'cash'])) {
    return {
      intent: 'payment',
      text: FAQ.payment.answer,
      chips: ["Explore menu", "Opening hours"],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 12. PARKING
  // ---------------------------------------------------------
  if (hasMatch(text, ['parking', 'car park', 'park car', 'valet'])) {
    return {
      intent: 'parking',
      text: FAQ.parking.answer,
      chips: ["Get directions", "Opening hours", "Contact page"],
      actions: [
        { type: 'link', label: 'Get Directions', href: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(SITE.mapQuery)}`, icon: 'directions' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 13. COMPARISON ("compare alfredo and arrabbiata", "difference between margherita and pepperoni")
  // ---------------------------------------------------------
  if (text.includes('compare') || text.includes('difference between') || text.includes('faraq') || text.includes('vs')) {
    const dishes = getAllDishes();
    const mentioned = dishes.filter(d => text.includes(normalizeText(d.name)) || (d.aliases && d.aliases.some(a => text.includes(normalizeText(a)))));
    if (mentioned.length >= 2) {
      const [d1, d2] = mentioned;
      return {
        intent: 'dish_comparison',
        text: `**${d1.name}** (Rs. ${d1.price}) — ${d1.description}\n\n**${d2.name}** (Rs. ${d2.price}) — ${d2.description}`,
        chips: [`Add ${d1.name}`, `Add ${d2.name}`, "View full menu"],
        dishes: [d1, d2],
        context: currentContext
      };
    }
  }

  // ---------------------------------------------------------
  // 14. SPECIFIC SUPERLATIVES (Most expensive, Cheapest, Best Dessert)
  // ---------------------------------------------------------
  if (hasMatch(text, ['most expensive', 'highest price', 'sab se mehnga', 'mehnga'])) {
    const exp = getMostExpensiveDish();
    return {
      intent: 'superlative_expensive',
      text: `Our most premium entrée is the **${exp.name}** (Rs. ${exp.price}), ${exp.description.toLowerCase()}`,
      chips: [`Add ${exp.name}`, "Show full menu"],
      dishes: [exp],
      context: currentContext
    };
  }

  if (hasMatch(text, ['cheapest', 'lowest price', 'sab se sasta', 'sasta', 'affordable'])) {
    const cheap = getCheapestDish();
    return {
      intent: 'superlative_cheapest',
      text: `Our most accessible refreshment is the **${cheap.name}** (Rs. ${cheap.price})! We also have artisanal appetizers from Rs. 350.`,
      chips: [`Add ${cheap.name}`, "Dishes under Rs. 500", "Show menu"],
      dishes: [cheap],
      context: currentContext
    };
  }

  if (hasMatch(text, ['best dessert', 'meetha', 'dessert recommendation'])) {
    const dessert = getBestDessert();
    return {
      intent: 'superlative_dessert',
      text: `Our standout dessert favorite is the **${dessert.name}** (Rs. ${dessert.price}) — ${dessert.description.toLowerCase()}`,
      chips: [`Add ${dessert.name}`, "All desserts", "Drinks"],
      dishes: [dessert],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 15. DIETARY INQUIRIES (Vegetarian, Vegan, Gluten-Free)
  // ---------------------------------------------------------
  if (hasMatch(text, ['vegetarian', 'veg', 'sabzi', 'vegan', 'gluten', 'gluten-free', 'celiac'])) {
    let dietType = 'vegetarian';
    if (text.includes('gluten')) dietType = 'gluten-free';
    else if (text.includes('vegan')) dietType = 'vegan';

    const dishes = getDietaryDishes(dietType);
    return {
      intent: 'dietary',
      text: lang === 'ur'
        ? `Hamare paas fresh ${dietType} dishes hain jo certified organic aur zaiqedaar hain:`
        : `We take great pride in our ${dietType} selections crafted with fresh organic produce:`,
      chips: ["Show full menu", "Gluten-free options?", "Desserts"],
      dishes: dishes.slice(0, 3),
      actions: [
        { type: 'route', label: 'View All on Menu', path: '/menu', icon: 'restaurant_menu' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 16. BUDGET INQUIRIES ("under 500", "under rs 500")
  // ---------------------------------------------------------
  const budgetMatch = text.match(/(?:under|below|less than|budget)\s*(?:rs\.?|rupees)?\s*(\d+)/i) ||
                      text.match(/(\d+)\s*(?:rs|rupees)/i);
  if (budgetMatch || hasMatch(text, ['budget', 'affordable', 'cheap', 'sasta', 'low price'])) {
    const max = budgetMatch ? parseInt(budgetMatch[1], 10) : 500;
    const affordableDishes = getBudgetDishes(max);
    return {
      intent: 'budget_query',
      text: lang === 'ur'
        ? `Rs. ${max} ke andar yeh behtareen dishes dastiyab hain:`
        : `Here are wonderful artisanal dishes you can savor under Rs. ${max}:`,
      chips: ["All under Rs. 700", "Full menu", "Chef's specials"],
      dishes: affordableDishes.slice(0, 3),
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 17. RESERVATIONS & TABLE BOOKINGS
  // ---------------------------------------------------------
  if (
    hasMatch(text, [
      'book a table', 'reserve', 'reservation', 'table for',
      'table booking', 'book table', 'table chahiye', 'seat book'
    ])
  ) {
    return {
      intent: 'reservation',
      text: lang === 'ur'
        ? `SunnyBite mein table book karne ke liye aap hamara Contact form use kar sakte hain ya seedha WhatsApp par message kar sakte hain! 🌸`
        : `We would love to host you! Walk-ins are warmly welcomed, and you can reserve a table via our Contact page or directly over WhatsApp. 🌸`,
      chips: ["Book on WhatsApp", "Go to Contact form", "Our hours"],
      actions: [
        { type: 'route', label: 'Reservation Form', path: '/contact', icon: 'calendar_month' },
        { type: 'link', label: 'Book via WhatsApp', href: `${SITE.whatsappLink}?text=${encodeURIComponent("Hello SunnyBite! I'd like to reserve a table.")}`, icon: 'chat' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 18. ABOUT SUNNYBITE & VALUES
  // ---------------------------------------------------------
  if (hasMatch(text, ['about', 'story', 'since', 'background', 'values', 'philosophy', 'about sunnybite'])) {
    return {
      intent: 'about',
      text: `SunnyBite was founded in ${SITE.stats.since} in I-8 Islamabad with four pillars: Fresh Farm Ingredients, Expert Passionate Chefs, Cozy Botanical Ambience, and Heartfelt Hospitality. 🌿`,
      chips: ["Our menu", "Opening hours", "Table reservations"],
      actions: [
        { type: 'route', label: 'Read Full Story', path: '/about', icon: 'info' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 19. FOODIE CLUB NEWSLETTER
  // ---------------------------------------------------------
  if (hasMatch(text, ['foodie club', 'newsletter', 'club', 'membership', 'subscribe'])) {
    return {
      intent: 'newsletter',
      text: "Our Foodie Club gives you first access to seasonal specials and surprise dining perks! You can subscribe using the newsletter field in our website footer.",
      chips: ["Show menu", "Explore specials"],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 20. POPULAR / RECOMMENDATIONS / CHEF SPECIALS
  // ---------------------------------------------------------
  if (
    hasMatch(text, [
      'recommend', 'recommendation', 'popular', 'best seller',
      'bestseller', 'special', 'kya acha hai', 'best dish', 'favorite'
    ])
  ) {
    const popular = getPopularDishes();
    return {
      intent: 'recommendation',
      text: lang === 'ur'
        ? `SunnyBite ke sab se mashhoor dishes Creamy Alfredo Pasta, Classic Cheeseburger, aur Molten Chocolate Lava Cake hain! 🌟`
        : `Our most celebrated favorites are the Creamy Alfredo Pasta (Chef's Pick), Classic Cheeseburger, and the Molten Chocolate Lava Cake! 🌟`,
      chips: ["Add Alfredo Pasta", "Add Cheeseburger", "Add Lava Cake"],
      dishes: popular.slice(0, 3),
      actions: [
        { type: 'route', label: 'View Full Menu', path: '/menu', icon: 'restaurant_menu' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 21. FULL MENU REQUEST
  // ---------------------------------------------------------
  if (hasMatch(text, ['menu', 'full menu', 'show menu', 'menu dikhao', 'khana', 'food list', 'dishes', 'kya milta hai'])) {
    const all = getAllDishes();
    return {
      intent: 'full_menu',
      text: lang === 'ur'
        ? "Hum 18 artisanal dishes pesh karte hain jin mein Starters, Gourmet Burgers, Handcrafted Pastas, Wood-Fired Pizzas, aur Desserts shamil hain! 🍽️"
        : "We serve 18 artisanal dishes spanning Starters, Gourmet Burgers, Handcrafted Pastas, Wood-Fired Pizzas, Salads, and Desserts! 🍽️",
      chips: ["Pastas & Pizzas", "Vegetarian dishes", "Desserts"],
      dishes: all.slice(0, 3),
      actions: [
        { type: 'route', label: 'Explore Full Menu', path: '/menu', icon: 'restaurant_menu' }
      ],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 22. GREETINGS & PLEASANTRIES
  // ---------------------------------------------------------
  if (hasMatch(text, ['hi', 'hello', 'hey', 'salam', 'assalam', 'aoa', 'good morning', 'good afternoon', 'good evening', 'adaab'])) {
    const greetingName = currentContext.userName ? `, ${currentContext.userName}` : '';
    return {
      intent: 'greeting',
      text: lang === 'ur'
        ? `Assalam-o-Alaikum${greetingName}! SunnyBite mein khush-amdeed. ☀️ Aaj aap kya khana pasand karenge?`
        : `Hello and welcome to SunnyBite${greetingName}! ☀️ What delicious dish can I prepare for you today?`,
      chips: ["Show menu", "Opening hours", "Where are you located?", "Book a table"],
      context: currentContext
    };
  }

  if (hasMatch(text, ['thank', 'thanks', 'shukriya', 'jazakallah', 'great', 'awesome', 'nice'])) {
    return {
      intent: 'thanks',
      text: lang === 'ur'
        ? "Aapka bohot shukriya! SunnyBite hamesha aapki khidmat ke liye hazir hai. 🌿"
        : "You are most welcome! We look forward to serving you fresh flavors and bright days. 🌿",
      chips: ["Book a table", "Explore menu", "Call us"],
      context: currentContext
    };
  }

  // If user was interrupted mid-checkout, append a resume checkout reminder
  if (wasInCheckout) {
    const pendingStep = currentContext.checkoutState.step;
    let resumePrompt = "Shall we continue with your order?";
    if (pendingStep === 'collecting_type') resumePrompt = "Will your order be for **Pickup** or **Dine-in**?";
    else if (pendingStep === 'collecting_name') resumePrompt = "May I have your name for the order ticket?";
    else if (pendingStep === 'collecting_phone') resumePrompt = "What is your contact phone number?";
    else if (pendingStep === 'collecting_notes') resumePrompt = "Any special instructions or allergies for the kitchen?";

    return {
      intent: 'interruption_resumed',
      text: `${resumePrompt}`,
      chips: ["Pickup", "Dine-in", "No notes", "Cancel order"],
      context: currentContext
    };
  }

  // ---------------------------------------------------------
  // 23. UNKNOWN FALLBACK (Never Bluff)
  // ---------------------------------------------------------
  const unknown = getUnknownFaqAnswer(lang);
  return {
    intent: 'unknown',
    text: unknown.text,
    chips: unknown.chips,
    actions: [
      { type: 'link', label: 'Call Us', href: `tel:${SITE.phoneRaw}`, icon: 'call' },
      { type: 'link', label: 'Chat on WhatsApp', href: SITE.whatsappLink, icon: 'chat' }
    ],
    context: currentContext
  };
}
