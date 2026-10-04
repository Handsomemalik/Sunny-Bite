/**
 * Global Site Configuration for SunnyBite
 * All brand info, contacts, stats, and locations are centralized here.
 * Never hardcode these values in components.
 */

export const SITE = {
  name: "SunnyBite",
  tagline: "Good food · Good mood",
  phone: "+92 309 7227807",
  phoneRaw: "+923097227807",
  whatsappLink: "https://wa.me/923097227807",
  location: "I-8, Islamabad, Pakistan",
  mapQuery: "I-8 Markaz, Islamabad, Pakistan",
  hours: { 
    daily: "9am – 10pm", 
    brunch: "9am – 2pm", 
    dinner: "5pm – 10pm" 
  },
  email: "hello@sunnybite.com", // placeholder – easy to change
  currency: "Rs.",
  ordering: {
    enabled: true,
    types: ["Pickup", "Dine-in"],
    delivery: false,
    maxQtyPerItem: 20
  },
  creator: { 
    name: "Abdul Manan", 
    role: "UI/UX Designer & Web Developer" 
  },
  // Replace with real numbers.
  stats: { 
    rating: "4.9", 
    reviews: "1,200+", 
    years: "8+", 
    dishes: "120+", 
    customers: "15k+", 
    awards: "6", 
    since: "2018" 
  },
  arrivalTips: [
    {
      icon: "near_me",
      title: "Easy to Find",
      desc: "Conveniently located in I-8 Markaz, Islamabad"
    },
    {
      icon: "local_parking",
      title: "Parking Nearby",
      desc: "Ample parking available steps from our front door"
    },
    {
      icon: "accessible",
      title: "Accessibility",
      desc: "Wheelchair-friendly step-free entrance & wide aisles"
    }
  ],
  socials: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
    youtube: "https://youtube.com"
  }
};
