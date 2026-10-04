import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { SITE as DEFAULT_SITE } from '../config/site';
import { CATEGORIES as DEFAULT_CATEGORIES, MENU_ITEMS as DEFAULT_MENU_ITEMS } from '../data/menu';
import { FAQ as DEFAULT_FAQ } from '../chat/faq';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const CACHE_KEY = 'sunnybite_content_cache_v2';

// Built-in fallback page content (mirrors seed.sql)
const DEFAULT_PAGE_CONTENT = {
  home: {
    hero: {
      taglinePill: DEFAULT_SITE.tagline,
      headlineWord1: "Fresh",
      headlineWord2: "flavors,",
      headlineWord3: "brighter days.",
      subtitle: `Delicious food, fresh ingredients and a little happiness served every day in our cozy botanical retreat in ${DEFAULT_SITE.location}.`,
      ctaPrimaryLabel: "Explore Menu",
      ctaPrimaryLink: "/menu",
      ctaSecondaryLabel: "Order Online",
      ctaSecondaryLink: "/menu",
      heroImage: "/images/hero-interior.jpg",
      ratingNumber: DEFAULT_SITE.stats.rating,
      ratingSubtitle: `Over ${DEFAULT_SITE.stats.reviews} happy neighborhood foodies`,
    },
    features: {
      items: [
        {
          icon: "eco",
          colorVariant: "mint",
          title: "Fresh Ingredients",
          description: "Sourced daily from local growers we trust for maximum organic crispness."
        },
        {
          icon: "skillet",
          colorVariant: "yellow",
          title: "Expert Chefs",
          description: "Recipes crafted with thoughtful care and years of artisanal culinary craft."
        },
        {
          icon: "favorite",
          colorVariant: "pink",
          title: "Cozy Ambience",
          description: "A warm, welcoming botanical space designed for calm lingering and connection."
        },
        {
          icon: "auto_awesome",
          colorVariant: "mint",
          title: "Great Service",
          description: "Attentive, friendly and always ready to make your dining ritual joyful."
        }
      ]
    },
    specials: {
      badge: "Our specials",
      title: "Popular dishes",
      subtitle: "From classic favorites to unique creations, our menu is full of flavors you'll love.",
      ctaLabel: "View Full Menu",
      ctaLink: "/menu"
    },
    story: {
      badge: `The ${DEFAULT_SITE.name} Experience`,
      title: "A sanctuary of botanical calm and joyful bites.",
      paragraph: `Every corner of ${DEFAULT_SITE.name} is thoughtfully curated—from soft velvet chairs and terrazzo tables to lush cascading monstera leaves and neon glow. Whether meeting an old friend or savoring quiet time over sparkling lemonade, you belong here.`,
      stat1Value: "100%",
      stat1Label: "Natural ingredients & farm milk",
      stat2Value: "Zero",
      stat2Label: "Artificial additives or shortcuts",
      image1: "/images/story-barista.jpg",
      image1Alt: "Barista frothing oat milk for velvety matcha latte inside bright botanical cafe counter",
      image2: "/images/story-friends.jpg",
      image2Alt: "Friends laughing around round pink terrazzo cafe table laden with food and iced teas",
      card1Title: "Table Reservations",
      card1Text: "Walk-ins always warmly welcomed; weekend patio reservations recommended.",
      card2Title: "Gatherings",
      card2Text: "Host private brunches, birthdays, and joyful pastry tastings with us."
    }
  },
  menu: {
    header: {
      badge: "Our menu",
      title: "Something for every craving.",
      subtitle: "Made fresh daily, from cozy comfort food to lighter bites and sweet finishes."
    }
  },
  about: {
    intro: {
      badge: "Our story",
      title: "Made with love, served with joy.",
      subtitle: `${DEFAULT_SITE.name} started with one simple idea: food should make people happy. Years later, that's still at the heart of everything we serve in ${DEFAULT_SITE.location}.`
    },
    story: {
      badge: "Artisanal Roots",
      title: "A small kitchen with a big idea",
      paragraph1: "It began in a small corner kitchen, where our founder believed a good meal could turn any ordinary day into something special. What started with a handful of family recipes has grown into a place where fresh ingredients, warm hospitality and a little bit of joy come together on every plate.",
      paragraph2: `Today, ${DEFAULT_SITE.name} is a home for anyone chasing good food and good company — whether it's a quick lunch, a long dinner, or a celebration worth remembering.`,
      image: "/images/about-interior.jpg",
      imageAlt: "A sunlit, joyful dining room interior at SunnyBite featuring tall arched windows, dusty-rose chairs, and lush botanical greenery",
      since: DEFAULT_SITE.stats.since,
      ctaLabel: "Explore Our Menu",
      ctaLink: "/menu"
    },
    cta_banner: {
      title: "Hungry for something fresh?",
      subtitle: "Come taste the happiness for yourself — we'll save you a seat.",
      buttonLabel: "Order Online",
      buttonLink: "/menu"
    }
  },
  contact: {
    header: {
      badge: "Get in touch",
      title: "We'd love to hear from you.",
      subtitle: "Have questions, reserving a table, or planning an event? Reach out and we'll reply with a smile.",
      chip1Text: "Average reply time: under 15 mins",
      chip2Text: "Reservations & Private Dinners Open"
    },
    venue_card: {
      title: "Host a Garden Gathering",
      desc: "Our conservatory hosts intimate celebrations of up to 40 seated guests.",
      image: "/images/contact-greenhouse.jpg"
    },
    map_section: {
      badge: "Neighborhood Walk",
      title: `Finding Us in ${DEFAULT_SITE.mapQuery}`,
      desc: `Located conveniently in the heart of ${DEFAULT_SITE.location}, with easy access and pleasant outdoor strolls.`,
      mapQuery: DEFAULT_SITE.mapQuery
    },
    arrival_tips: {
      tips: DEFAULT_SITE.arrivalTips
    }
  },
  footer: {
    content: {
      tagline: `Good food · Good mood · Crafted fresh every day in our botanical retreat in ${DEFAULT_SITE.location}.`,
      newsletterTitle: "Join the Foodie Club",
      newsletterSubtitle: "Be the first to hear about seasonal menus, secret recipes, and exclusive gathering invites.",
      copyright: "All rights reserved.",
      builtBy: `Built with love & good taste by ${DEFAULT_SITE.creator.name}.`
    }
  },
  privacy: {
    body: {
      badge: "Trust & Transparency",
      title: "Privacy Policy",
      lastUpdated: "January 2026",
      intro: `At ${DEFAULT_SITE.name} (${DEFAULT_SITE.location}), your privacy is paramount to us. We operate as an artisanal restaurant and bistro, and we treat your personal information with the same care and respect that we treat our ingredients.`,
      section1Title: "1. Information We Collect",
      section1Text: "When you contact us, book a table, or place an order via WhatsApp or our Contact form, we collect the details you voluntarily provide: your name, phone number, email address, table preferences, and any allergen or dietary accommodations.",
      section2Title: "2. How We Use Your Information",
      section2Text: "We use your contact details solely to confirm table reservations, coordinate pickup and dining orders, and respond to your catering inquiries. We do not sell, rent, or trade your data to third parties or marketing spammers.",
      section3Title: "3. Local Browser Storage",
      section3Text: "This website uses your browser's local storage and session storage to preserve your dining basket and recent assistant conversation during your visit. No tracking cookies are deployed.",
      section4Title: "4. Contact Us",
      section4Text: `If you have questions regarding our privacy practices, please contact us at ${DEFAULT_SITE.email} or call our host desk at ${DEFAULT_SITE.phone}.`
    }
  },
  terms: {
    body: {
      badge: "House Etiquette",
      title: "Terms of Service",
      lastUpdated: "January 2026",
      intro: `Welcome to ${DEFAULT_SITE.name}. By enjoying meals at our bistro, ordering through our digital assistant, or visiting our website, you agree to these house terms.`,
      section1Title: "1. Dining & Orders",
      section1Text: "All orders placed via our site or digital assistant are confirmed directly with our host team via WhatsApp or phone call. Payment is processed upon pickup or table service.",
      section2Title: "2. Reservations & Cancellations",
      section2Text: "Table reservations are held for 15 minutes past the scheduled time before being released to walk-in guests. We appreciate timely notice if your plans change.",
      section3Title: "3. Menu Availability & Pricing",
      section3Text: "Our ingredients are sourced fresh daily, and seasonal dishes may occasionally be sold out. All prices are stated in Pakistani Rupees (PKR) and are subject to local tax regulations.",
      section4Title: "4. Contact & Host Desk",
      section4Text: `For any inquiries or private event bookings, please call ${DEFAULT_SITE.phone} or email ${DEFAULT_SITE.email}.`
    }
  }
};

const DEFAULT_SETTINGS = {
  brand: {
    name: DEFAULT_SITE.name,
    tagline: DEFAULT_SITE.tagline,
    logoUrl: "/logo-horizontal.svg",
    iconUrl: "/logo-icon.svg",
    faviconUrl: "/favicon.svg",
    creatorName: DEFAULT_SITE.creator.name,
    creatorRole: DEFAULT_SITE.creator.role
  },
  contact: {
    phone: DEFAULT_SITE.phone,
    phoneRaw: DEFAULT_SITE.phoneRaw,
    whatsappLink: DEFAULT_SITE.whatsappLink,
    email: DEFAULT_SITE.email,
    location: DEFAULT_SITE.location,
    mapQuery: DEFAULT_SITE.mapQuery,
    address: "I-8 Markaz, Islamabad, ICT 44000, Pakistan"
  },
  hours: DEFAULT_SITE.hours,
  stats: DEFAULT_SITE.stats,
  currency: {
    symbol: DEFAULT_SITE.currency,
    code: "PKR",
    placement: "before"
  },
  ordering: DEFAULT_SITE.ordering,
  socials: DEFAULT_SITE.socials,
  announcement: {
    enabled: false,
    text: "🌿 Fresh Seasonal Harvest Menu Now Live! Complimentary artisanal cooler with any 2 mains.",
    link: "/menu",
    badge: "Special"
  },
  theme: {
    primaryColor: "#98415a",
    secondaryColor: "#3a6848",
    creamBg: "#FBF5EB"
  },
  chat_settings: {
    welcomeMessage: "Salam & Welcome to SunnyBite! 🌿 How can I brighten your day? You can order delicious dishes directly, ask for recommendations, or explore our menu.",
    chips: [
      "View Full Menu",
      "I want to order",
      "What are your timings?",
      "Where are you located?"
    ]
  },
  seo: {
    homeTitle: "SunnyBite — Fresh Flavors, Brighter Days | I-8 Islamabad",
    homeDesc: "Welcome to SunnyBite in I-8, Islamabad. Artisanal botanical bistro serving handcrafted pastas, gourmet burgers, fresh smoothies, and wood-fired pizzas with organic goodness.",
    ogImage: "https://sunnybite.pk/images/hero-interior.jpg"
  }
};

export const ContentContext = createContext(null);

export function ContentProvider({ children }) {
  // Stale-While-Revalidate: initialize from localStorage cache if present, otherwise default
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        return {
          categories: parsed.categories || DEFAULT_CATEGORIES,
          menuItems: parsed.menuItems || DEFAULT_MENU_ITEMS,
          pageContent: parsed.pageContent || DEFAULT_PAGE_CONTENT,
          settings: parsed.settings || DEFAULT_SETTINGS,
          faq: parsed.faq || [],
          loaded: true,
        };
      }
    } catch (e) {
      console.warn('[Cache] Could not parse local content cache:', e);
    }
    return {
      categories: DEFAULT_CATEGORIES,
      menuItems: DEFAULT_MENU_ITEMS,
      pageContent: DEFAULT_PAGE_CONTENT,
      settings: DEFAULT_SETTINGS,
      faq: [],
      loaded: false,
    };
  });

  const [loading, setLoading] = useState(!data.loaded);

  // Fetch live content from Supabase
  const refreshContent = useCallback(async () => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    try {
      const [catRes, menuRes, pageRes, setRes, faqRes] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase.from('menu_items').select('*').order('sort_order', { ascending: true }),
        supabase.from('page_content').select('*'),
        supabase.from('site_settings').select('*'),
        supabase.from('chatbot_faq').select('*').order('sort_order', { ascending: true }),
      ]);

      const newCategories = (catRes.data && catRes.data.length > 0)
        ? catRes.data.map(c => ({ id: c.id, label: c.name, visible: c.visible }))
        : DEFAULT_CATEGORIES;

      const newMenuItems = (menuRes.data && menuRes.data.length > 0)
        ? menuRes.data.map(item => ({
            id: item.id,
            name: item.name,
            category: item.category_id,
            price: Number(item.price),
            description: item.description || '',
            shortDescription: item.short_description || item.description || '',
            image: item.image_url || '/images/dish-classic-cheeseburger.jpg',
            tags: item.tags || [],
            dietary: Array.isArray(item.dietary) ? item.dietary.join(', ') : (item.dietary || ''),
            badge: item.badge || null,
            popular: !!item.popular,
            available: item.available !== false, // Sold Out status
            aliases: item.aliases || [],
            visible: item.visible !== false,
            sort_order: item.sort_order || 0
          }))
        : DEFAULT_MENU_ITEMS;

      // Group page content by page -> section_key
      const newPageContent = { ...DEFAULT_PAGE_CONTENT };
      if (pageRes.data) {
        pageRes.data.forEach(row => {
          if (!newPageContent[row.page]) {
            newPageContent[row.page] = {};
          }
          newPageContent[row.page][row.section_key] = {
            ...newPageContent[row.page]?.[row.section_key],
            ...row.content,
            _visible: row.visible !== false
          };
        });
      }

      // Group site settings by key
      const newSettings = { ...DEFAULT_SETTINGS };
      if (setRes.data) {
        setRes.data.forEach(row => {
          newSettings[row.key] = {
            ...newSettings[row.key],
            ...row.value
          };
        });
      }

      const freshState = {
        categories: newCategories,
        menuItems: newMenuItems,
        pageContent: newPageContent,
        settings: newSettings,
        faq: faqRes.data || [],
        loaded: true,
      };

      setData(freshState);

      // Save to localStorage for instant future loads
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(freshState));
      } catch (e) {
        // quota exceeded or private mode
      }
    } catch (err) {
      console.warn('[ContentProvider] Fetch error, using cached or fallback data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and Realtime subscription
  useEffect(() => {
    refreshContent();

    if (!isSupabaseConfigured() || !supabase) return;

    // Realtime changes listener
    const channel = supabase
      .channel('public:realtime_content')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => refreshContent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'categories' }, () => refreshContent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, () => refreshContent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'page_content' }, () => refreshContent())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chatbot_faq' }, () => refreshContent())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshContent]);

  const value = useMemo(() => ({
    data,
    loading,
    refreshContent,
  }), [data, loading, refreshContent]);

  return (
    <ContentContext.Provider value={value}>
      {children}
    </ContentContext.Provider>
  );
}

/**
 * Hook to retrieve editable content for a specific page and section
 * with automatic fallback to bundled copy.
 */
export function useContent(page, sectionKey) {
  const context = useContext(ContentContext);
  if (!context) {
    const fallback = DEFAULT_PAGE_CONTENT[page]?.[sectionKey] || {};
    return { content: fallback, visible: true, loading: false };
  }

  const { data, loading } = context;
  const section = data.pageContent?.[page]?.[sectionKey];
  const fallback = DEFAULT_PAGE_CONTENT[page]?.[sectionKey] || {};

  const content = section ? { ...fallback, ...section } : fallback;
  const visible = section?._visible !== false;

  return { content, visible, loading };
}

/**
 * Hook to retrieve live menu items and categories
 * Filters out hidden items and categories for public users.
 */
export function useMenu() {
  const context = useContext(ContentContext);
  const categories = context?.data?.categories || DEFAULT_CATEGORIES;
  const allItems = context?.data?.menuItems || DEFAULT_MENU_ITEMS;

  // Visible categories
  const visibleCategories = useMemo(() => {
    return categories.filter(c => c.visible !== false);
  }, [categories]);

  // Visible menu items (includes available: false items with "Sold out" badge)
  const visibleItems = useMemo(() => {
    return allItems.filter(item => item.visible !== false);
  }, [allItems]);

  return {
    categories: visibleCategories,
    rawCategories: categories,
    items: visibleItems,
    allItems,
    loading: context?.loading || false,
    refreshMenu: context?.refreshContent,
  };
}

/**
 * Hook to retrieve site settings (brand, hours, contact, stats, ordering, etc.)
 */
export function useSettings() {
  const context = useContext(ContentContext);
  const settings = context?.data?.settings || DEFAULT_SETTINGS;

  return {
    settings,
    brand: settings.brand || DEFAULT_SETTINGS.brand,
    contact: settings.contact || DEFAULT_SETTINGS.contact,
    hours: settings.hours || DEFAULT_SETTINGS.hours,
    stats: settings.stats || DEFAULT_SETTINGS.stats,
    currency: settings.currency?.symbol || DEFAULT_SITE.currency,
    ordering: settings.ordering || DEFAULT_SETTINGS.ordering,
    socials: settings.socials || DEFAULT_SETTINGS.socials,
    announcement: settings.announcement || DEFAULT_SETTINGS.announcement,
    theme: settings.theme || DEFAULT_SETTINGS.theme,
    chatSettings: settings.chat_settings || DEFAULT_SETTINGS.chat_settings,
    seo: settings.seo || DEFAULT_SETTINGS.seo,
    loading: context?.loading || false,
    refreshSettings: context?.refreshContent,
  };
}

/**
 * Hook to retrieve dynamic FAQ and Chatbot knowledge
 */
export function useChatbotKnowledge() {
  const context = useContext(ContentContext);
  const faqList = context?.data?.faq || [];
  const settings = context?.data?.settings || DEFAULT_SETTINGS;
  const menu = useMenu();

  return {
    faqList: faqList.length > 0 ? faqList : null,
    welcomeMessage: settings.chat_settings?.welcomeMessage || DEFAULT_SETTINGS.chat_settings.welcomeMessage,
    chips: settings.chat_settings?.chips || DEFAULT_SETTINGS.chat_settings.chips,
    menuItems: menu.items,
  };
}
