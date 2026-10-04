import { SITE } from '../config/site.js';

/**
 * SunnyBite Chat FAQ Knowledge Base
 * Editable answers for operations, policies, and special dining arrangements.
 * Unknown questions fallback to team confirmation via call or WhatsApp.
 */

export const FAQ = {
  delivery: {
    get answer() {
      if (SITE.ordering && SITE.ordering.delivery) {
        return "We offer convenient local delivery across I-8 and nearby Islamabad sectors! Place your order right here or on WhatsApp.";
      }
      return "We do not offer direct home delivery at this time; our current order options are Pickup and Dine-in. However, our team on WhatsApp can confirm special courier or dispatch requests!";
    },
    action: "whatsapp"
  },
  halal: {
    answer: "Yes, 100%! All our chicken, beef, and ingredients are strictly certified Halal and sourced fresh daily from trusted local farms.",
    action: "menu"
  },
  payment: {
    answer: "We accept Cash, all major Credit/Debit cards (Visa & Mastercard), as well as instant digital transfers (Raast, Nayapay, and Easypaisa).",
    action: "none"
  },
  parking: {
    answer: "Ample, step-free parking is conveniently located right outside our botanical entrance in I-8 Markaz, Islamabad.",
    action: "directions"
  },
  discounts: {
    answer: "All our menu prices are fixed and artisanal. We do not offer ad-hoc discounts, but our Foodie Club members receive seasonal chef perks and surprise tasting invitations!",
    action: "whatsapp"
  },
  allergies: {
    answer: "We prepare food in a kitchen handling gluten, dairy, and nuts. Please notify our staff of severe allergies during checkout notes or on WhatsApp so the chef can take special precautions.",
    action: "contact"
  },
  catering: {
    answer: "Planning a large gathering or catering? For orders above 20 items or private conservatory dinners (up to 40 guests), our team will curate a custom menu directly via WhatsApp or phone!",
    action: "whatsapp"
  },
  jobs: {
    answer: "We are always looking for smiling hosts, talented baristas, and passionate line cooks. Please send your CV to hello@sunnybite.com or message us on WhatsApp.",
    action: "contact"
  }
};

/**
 * Returns the fallback message for unverified or unknown operational questions.
 */
export function getUnknownFaqAnswer(lang = 'en') {
  if (lang === 'ur') {
    return {
      text: "Is barey mein hamari team se confirm kar lein — aap call kar sakte hain ya WhatsApp par pooch sakte hain.",
      chips: ["Menu dikhao", "Timing kya hai", "Kahan hain aap?"]
    };
  }
  return {
    text: "I'm not sure about that one, but our team will gladly confirm — you can call +92 309 7227807 or message us on WhatsApp.",
    chips: ["Show menu", "Opening hours", "Where are you located?"]
  };
}
