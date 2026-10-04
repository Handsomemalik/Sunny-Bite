import { SITE } from '../config/site.js';
import { MENU_ITEMS, CATEGORIES } from '../data/menu.js';
import { FAQ, getUnknownFaqAnswer } from './faq.js';
import { SITE_INDEX } from './siteIndex.js';

/**
 * SunnyBite Chat Knowledge Base
 * Centralized queries across SITE, MENU_ITEMS, FAQ, and SITE_INDEX.
 */

export { FAQ, getUnknownFaqAnswer, SITE_INDEX, SITE, MENU_ITEMS, CATEGORIES };

/**
 * Checks whether SunnyBite is currently open based on Asia/Karachi timezone.
 * Open daily: 9:00 AM – 10:00 PM (09:00 - 22:00)
 */
export function isOpenNow() {
  try {
    const now = new Date();
    const karachiTimeString = now.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Karachi',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit'
    });
    const [hourStr, minuteStr] = karachiTimeString.split(':');
    const hour = parseInt(hourStr, 10);
    const minute = parseInt(minuteStr, 10);
    const totalMinutes = hour * 60 + minute;

    const openMinutes = 9 * 60;   // 09:00 (9am)
    const closeMinutes = 22 * 60; // 22:00 (10pm)

    const open = totalMinutes >= openMinutes && totalMinutes < closeMinutes;
    return {
      isOpen: open,
      currentTime: karachiTimeString,
      hours: SITE.hours.daily,
      brunch: SITE.hours.brunch,
      dinner: SITE.hours.dinner
    };
  } catch {
    return {
      isOpen: true,
      hours: SITE.hours.daily,
      brunch: SITE.hours.brunch,
      dinner: SITE.hours.dinner
    };
  }
}

/**
 * Menu query helpers
 */
export function getAllDishes() {
  return MENU_ITEMS;
}

export function getDishesByCategory(categoryId) {
  const norm = categoryId.toLowerCase().trim();
  if (norm === 'all') return MENU_ITEMS;
  return MENU_ITEMS.filter(d => d.category.toLowerCase() === norm);
}

export function searchDishes(term) {
  const q = term.toLowerCase().trim();
  return MENU_ITEMS.filter(d => 
    d.name.toLowerCase().includes(q) ||
    d.description.toLowerCase().includes(q) ||
    (d.aliases && d.aliases.some(a => a.toLowerCase().includes(q))) ||
    (d.tags && d.tags.some(t => t.toLowerCase().includes(q))) ||
    (d.dietary && d.dietary.toLowerCase().includes(q))
  );
}

export function getDietaryDishes(type) {
  const t = type.toLowerCase().trim();
  if (t.includes('veg') && !t.includes('non')) {
    return MENU_ITEMS.filter(d => 
      (d.dietary && d.dietary.toLowerCase().includes('vegetarian')) ||
      (d.dietary && d.dietary.toLowerCase().includes('vegan'))
    );
  }
  if (t.includes('vegan')) {
    return MENU_ITEMS.filter(d => 
      d.dietary && d.dietary.toLowerCase().includes('vegan')
    );
  }
  if (t.includes('gluten')) {
    return MENU_ITEMS.filter(d => 
      d.dietary && d.dietary.toLowerCase().includes('gluten-free')
    );
  }
  return [];
}

export function getBudgetDishes(maxPrice) {
  return MENU_ITEMS.filter(d => d.price <= maxPrice);
}

export function getPopularDishes() {
  return MENU_ITEMS.filter(d => d.popular);
}

export function getMostExpensiveDish() {
  return [...MENU_ITEMS].sort((a, b) => b.price - a.price)[0];
}

export function getCheapestDish() {
  return [...MENU_ITEMS].sort((a, b) => a.price - b.price)[0];
}

export function getBestDessert() {
  return MENU_ITEMS.find(d => d.id === 'chocolate-lava-cake') || MENU_ITEMS.find(d => d.category === 'desserts');
}
