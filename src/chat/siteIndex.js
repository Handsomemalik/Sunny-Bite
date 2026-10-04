import { SITE } from '../config/site.js';

/**
 * SunnyBite Structured Site Index
 * Complete overview of every page, section, interactive feature, and navigation route.
 * Enables the assistant to explain any part of the site without hardcoding.
 */

export const SITE_INDEX = {
  pages: {
    home: {
      path: "/",
      title: "Home",
      tagline: SITE.tagline,
      sections: [
        {
          id: "hero",
          title: "Fresh Flavors, Brighter Days",
          summary: "Welcome hero with warm morning light, signature avocado toast imagery, call-to-action buttons for 'Explore Menu' and 'Book a Table', and active dining stats."
        },
        {
          id: "specials",
          title: "Chef's Specials & Seasonal Bites",
          summary: "Highlights our top-rated dishes including Creamy Alfredo Pasta, Classic Cheeseburger, Margherita Pizza, and Chocolate Lava Cake with quick-view modals."
        },
        {
          id: "ambience",
          title: "Botanical Calm & Cozy Retreat",
          summary: "Atmospheric retreat with terrazzo tables, cascading monstera leaves, natural daylight, and a sunlit conservatory patio."
        },
        {
          id: "story",
          title: "Our Story & Organic Commitment",
          summary: `Crafting honest, wholesome recipes with 100% natural ingredients, farm-fresh milk, and zero artificial additives since ${SITE.stats.since}.`
        },
        {
          id: "reservations_callout",
          title: "Table Reservations & Gatherings",
          summary: "Walk-ins are always welcomed; patio reservations recommended for weekends, and private bookings for up to 40 guests in our conservatory."
        }
      ]
    },
    menu: {
      path: "/menu",
      title: "Our Menu",
      summary: "Full catalog of 18 artisanal dishes spanning 8 categories with live dietary filtering (Vegetarian, Vegan, Gluten-Free, Organic, Chef's Pick).",
      features: [
        "Category tabs (All, Starters, Main Course, Burgers, Pasta, Pizza, Salads, Desserts, Drinks)",
        "Quick View dish modal with ingredients, tags, price, and instant 'Add to Order' button",
        "Dietary badges for organic, wood-fired, gluten-free, and chef's selections",
        "Direct fly-to-cart animation on every dish card"
      ]
    },
    about: {
      path: "/about",
      title: "About SunnyBite",
      summary: `Our botanical café journey founded in ${SITE.stats.since} in I-8 Islamabad, committed to good food, good mood, zero artificial shortcuts, and warm community hospitality.`,
      sections: [
        { id: "philosophy", title: "Botanical Living", summary: "Harmonizing nourishing gastronomy with green botanical interior design." },
        { id: "values", title: "Four Core Pillars", summary: "Fresh Farm Ingredients, Expert Passionate Chefs, Cozy Ambience, and Heartfelt Hospitality." },
        { id: "milestones", title: "Key Milestones", summary: `${SITE.stats.years} years of service, ${SITE.stats.dishes} unique recipes perfected, ${SITE.stats.customers} smiling guests, and ${SITE.stats.awards} culinary awards.` }
      ]
    },
    contact: {
      path: "/contact",
      title: "Contact & Table Reservations",
      summary: "Direct reservation request form, interactive Google Maps location in I-8 Markaz Islamabad, and direct host desk phone and WhatsApp links.",
      sections: [
        { id: "form", title: "Reservation & Inquiry Form", summary: "Online booking for table reservations, private conservatory events (up to 40 guests), or general compliments." },
        { id: "arrival", title: "Arrival & Parking", summary: "Step-free wheelchair accessibility, ample adjacent parking, and easy navigation in I-8 Markaz." },
        { id: "direct_desk", title: "Host Desk Details", summary: `Phone: ${SITE.phone}, WhatsApp: ${SITE.phone}, Email: ${SITE.email}. Average response time under 15 minutes.` }
      ]
    },
    privacy: {
      path: "/privacy",
      title: "Privacy Policy",
      summary: "Transparent overview of how SunnyBite protects customer data, order details, and privacy. Zero third-party data selling; orders processed securely via direct WhatsApp communication."
    },
    terms: {
      path: "/terms",
      title: "Terms of Service",
      summary: "Dining, ordering, cancellation, and reservation guidelines. Table holds for 15 minutes; payment accepted via cash, cards, and mobile transfers."
    }
  },
  features: {
    cart_drawer: "Slide-out cart drawer tracking selected dishes, quantities, order type (Pickup or Dine-in), and one-tap checkout to WhatsApp with an auto-formatted message.",
    chat_assistant: "Smart AI order-taking assistant capable of matching dishes by English or Roman Urdu names, adjusting cart items, guiding through checkout, and answering website questions.",
    floating_nav: "Translucent glassmorphic floating navigation with live cart badge counter, page links, and quick order button.",
    foodie_club: "Footer newsletter sign-up granting exclusive access to seasonal dish tastings and secret chef recipes."
  },
  creator: {
    name: SITE.creator.name,
    role: SITE.creator.role,
    answerEnglish: `This website and assistant were designed and developed by ${SITE.creator.name}, a ${SITE.creator.role}.`,
    answerUrdu: `Yeh website aur assistant ${SITE.creator.name} ne design aur develop ki hai, jo ke ek ${SITE.creator.role} hain.`
  }
};
