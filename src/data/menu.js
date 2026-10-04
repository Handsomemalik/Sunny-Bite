/**
 * SunnyBite Menu Data
 * All 18 items faithfully matched from the design with exact prices, categories, tags, and aliases.
 * Manual aliases allow fast, flexible matching in the assistant engine.
 */

export const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "starters", label: "Starters" },
  { id: "main-course", label: "Main Course" },
  { id: "burgers", label: "Burgers" },
  { id: "pasta", label: "Pasta" },
  { id: "pizza", label: "Pizza" },
  { id: "salads", label: "Salads" },
  { id: "desserts", label: "Desserts" },
  { id: "drinks", label: "Drinks" }
];

export const MENU_ITEMS = [
  {
    id: "garden-vegetable-soup",
    name: "Garden Vegetable Soup",
    category: "starters",
    price: 350,
    description: "Slow-simmered seasonal vegetables in a light herb broth.",
    image: "/images/dish-garden-vegetable-soup.jpg",
    tags: ["Organic", "Warm Broth"],
    dietary: "Vegetarian",
    badge: null,
    popular: false,
    aliases: [
      "soup", "soups", "vegetable soup", "veg soup", "garden soup",
      "sabzi soup", "vegetables soup", "hot soup"
    ]
  },
  {
    id: "grilled-chicken-skewers",
    name: "Grilled Chicken Skewers",
    category: "starters",
    price: 450,
    description: "Char-grilled chicken bites glazed with honey and spice.",
    image: "/images/dish-grilled-chicken-skewers.jpg",
    tags: ["Glazed", "Skewers"],
    dietary: "Chef's Special",
    badge: null,
    popular: false,
    aliases: [
      "skewers", "skewer", "chicken skewer", "chicken skewers", "grilled chicken skewer",
      "chicken sticks", "chicken bites", "tikka skewer"
    ]
  },
  {
    id: "crispy-spring-rolls",
    name: "Crispy Spring Rolls",
    category: "starters",
    price: 400,
    description: "Golden rolls filled with veggies and glass noodles.",
    image: "/images/dish-crispy-spring-rolls.jpg",
    tags: ["Crispy", "Handmade"],
    dietary: "Vegetarian",
    badge: null,
    popular: false,
    aliases: [
      "spring roll", "spring rolls", "rolls", "roll", "veg rolls", "crispy rolls",
      "crispy spring roll", "chinese rolls"
    ]
  },
  {
    id: "herb-roasted-chicken",
    name: "Herb Roasted Chicken",
    category: "main-course",
    price: 950,
    description: "Free-range chicken roasted with garden herbs.",
    image: "/images/dish-herb-roasted-chicken.jpg",
    tags: ["Free-Range", "Garden Herbs"],
    dietary: "Gluten-Free",
    badge: null,
    popular: false,
    aliases: [
      "roasted chicken", "roast chicken", "herb chicken", "chicken roast",
      "baked chicken", "herb roast", "roasted herb chicken"
    ]
  },
  {
    id: "grilled-salmon-fillet",
    name: "Grilled Salmon Fillet",
    category: "main-course",
    price: 1100,
    description: "Pan-seared salmon with a citrus butter glaze.",
    image: "/images/dish-grilled-salmon-fillet.jpg",
    tags: ["Atlantic Salmon", "Citrus Glaze"],
    dietary: "Pescatarian",
    badge: null,
    popular: false,
    aliases: [
      "salmon", "grilled salmon", "fish", "salmon fillet", "fish fillet",
      "citrus salmon", "machli", "grilled fish"
    ]
  },
  {
    id: "slow-braised-beef",
    name: "Slow-Braised Beef",
    category: "main-course",
    price: 1150,
    description: "Tender beef braised for hours in a rich pan sauce.",
    image: "/images/dish-slow-braised-beef.jpg",
    tags: ["Slow-Braised", "Rich Demi"],
    dietary: "Chef's Signature",
    badge: null,
    popular: false,
    aliases: [
      "beef", "braised beef", "slow braised beef", "beef steak", "beef roast",
      "tender beef", "gosht", "braised meat"
    ]
  },
  {
    id: "classic-cheeseburger",
    name: "Classic Cheeseburger",
    category: "burgers",
    price: 650,
    description: "Juicy beef patty, melted cheddar, house pickle relish, and secret brioche sauce.",
    shortDescription: "Juicy beef patty, melted cheddar and house sauce.",
    image: "/images/dish-classic-cheeseburger.jpg",
    tags: ["Brioche Bun", "Smashed Beef"],
    dietary: "House Favorite",
    badge: null,
    popular: true,
    aliases: [
      "burger", "burgers", "cheeseburger", "cheese burger", "classic burger",
      "beef burger", "cheeseburgers", "classic cheeseburger", "burgar"
    ]
  },
  {
    id: "creamy-alfredo-pasta",
    name: "Creamy Alfredo Pasta",
    category: "pasta",
    price: 750,
    description: "Silky parmesan cream sauce tossed with hand-rolled fettuccine and herbs.",
    shortDescription: "Silky parmesan sauce tossed with fresh fettuccine.",
    image: "/images/dish-creamy-alfredo-pasta.jpg",
    tags: ["Hand-Rolled", "Parmigiano"],
    dietary: "Vegetarian",
    badge: "Chef's Pick",
    popular: true,
    aliases: [
      "pasta", "pastas", "alfredo", "alfredo pasta", "creamy pasta", "creamy alfredo",
      "fettuccine", "fettuccine alfredo", "white sauce pasta", "white pasta"
    ]
  },
  {
    id: "spaghetti-arrabbiata",
    name: "Spaghetti Arrabbiata",
    category: "pasta",
    price: 700,
    description: "A spicy tomato sauce with garlic and fresh chili.",
    image: "/images/dish-spaghetti-arrabbiata.jpg",
    tags: ["Fiery Sauce", "San Marzano"],
    dietary: "Vegetarian",
    badge: null,
    popular: false,
    aliases: [
      "spaghetti", "arrabbiata", "arrabiata", "spicy pasta", "red sauce pasta",
      "spicy spaghetti", "tomato pasta", "spaghetti pasta"
    ]
  },
  {
    id: "margherita-pizza",
    name: "Margherita Pizza",
    category: "pizza",
    price: 700,
    description: "Wood-fired blistered crust with San Marzano tomatoes, fresh mozzarella, and sweet basil.",
    shortDescription: "Wood-fired crust with San Marzano tomato and basil.",
    image: "/images/dish-margherita-pizza.jpg",
    tags: ["Wood-Fired", "Buffalo Mozzarella"],
    dietary: "Wood-Fired",
    badge: null,
    popular: true,
    aliases: [
      "pizza", "pizzas", "margherita", "margarita", "margarita pizza",
      "cheese pizza", "margherita pizza", "piza", "wood fired pizza"
    ]
  },
  {
    id: "pepperoni-pizza",
    name: "Pepperoni Pizza",
    category: "pizza",
    price: 800,
    description: "Classic pepperoni with mozzarella and oregano.",
    image: "/images/dish-pepperoni-pizza.jpg",
    tags: ["Crispy Pepperoni", "Sourdough Crust"],
    dietary: "Crispy Crust",
    badge: null,
    popular: false,
    aliases: [
      "pepperoni", "peperoni", "pepperoni pizza", "beef pepperoni",
      "meat pizza", "peperoni pizza"
    ]
  },
  {
    id: "garden-fresh-salad",
    name: "Garden Fresh Salad",
    category: "salads",
    price: 500,
    description: "Crisp organic greens, avocado ribbons, heirloom radish, and citrus-dill dressing.",
    shortDescription: "Crisp greens and seasonal veg with citrus dressing.",
    image: "/images/dish-garden-fresh-salad.jpg",
    tags: ["Organic", "Farm Greens"],
    dietary: "Gluten-Free",
    badge: "Organic",
    popular: true,
    aliases: [
      "salad", "salads", "fresh salad", "garden salad", "garden fresh salad",
      "green salad", "organic salad", "greens"
    ]
  },
  {
    id: "chocolate-lava-cake",
    name: "Chocolate Lava Cake",
    category: "desserts",
    price: 400,
    description: "Warm cocoa sponge filled with molten 70% dark Belgian ganache and sea salt flakes.",
    shortDescription: "Warm cake with a molten dark chocolate center.",
    image: "/images/dish-chocolate-lava-cake.jpg",
    tags: ["Belgian Ganache", "Molten"],
    dietary: "Dessert",
    badge: "Sweet Finale",
    popular: true,
    aliases: [
      "cake", "lava cake", "molten cake", "chocolate cake", "choc cake",
      "chocolate lava", "lava", "dessert", "meetha", "choc lava cake"
    ]
  },
  {
    id: "vanilla-bean-ice-cream",
    name: "Vanilla Bean Ice Cream",
    category: "desserts",
    price: 350,
    description: "Creamy vanilla bean scoops finished with a chocolate curl.",
    image: "/images/dish-vanilla-bean-ice-cream.jpg",
    tags: ["Madagascar Vanilla", "Artisanal"],
    dietary: "Vegetarian",
    badge: null,
    popular: false,
    aliases: [
      "ice cream", "icecream", "vanilla", "vanilla ice cream", "vanilla bean",
      "ice cream scoop", "cold dessert"
    ]
  },
  {
    id: "berry-smoothie-bowl",
    name: "Berry Smoothie Bowl",
    category: "desserts",
    price: 450,
    description: "Blended highland berries topped with toasted oat granola, chia seeds, and raw honey.",
    shortDescription: "Blended berries topped with granola and honey.",
    image: "/images/dish-berry-smoothie-bowl.jpg",
    tags: ["Acai & Berries", "Chia Granola"],
    dietary: "Breakfast · Vegan",
    badge: null,
    popular: true,
    aliases: [
      "smoothie bowl", "berry bowl", "acai bowl", "smoothy bowl", "berry smoothie bowl",
      "fruit bowl", "chia bowl", "breakfast bowl"
    ]
  },
  {
    id: "fresh-mint-lemonade",
    name: "Fresh Mint Lemonade",
    category: "drinks",
    price: 300,
    description: "Chilled sparkling lemonade with crushed wild mint leaves.",
    image: "/images/dish-fresh-mint-lemonade.jpg",
    tags: ["Sparkling", "Wild Mint"],
    dietary: "Vegan",
    badge: null,
    popular: false,
    aliases: [
      "mint lemonade", "lemonade", "lemonade mint", "fresh lemonade",
      "nimbu pani", "limca", "sparkling lemonade", "mint drink", "mint margarita"
    ]
  },
  {
    id: "sunset-mango-smoothie",
    name: "Sunset Mango Smoothie",
    category: "drinks",
    price: 380,
    description: "Velvety mango blended with coconut yogurt and chia seeds.",
    image: "/images/dish-sunset-mango-smoothie.jpg",
    tags: ["Mango Puree", "Coconut Swirl"],
    dietary: "Vegan",
    badge: null,
    popular: false,
    aliases: [
      "mango smoothie", "smoothie", "smoothies", "mango shake", "sunset smoothie",
      "mango drink", "aam smoothie"
    ]
  },
  {
    id: "rose-petal-iced-tea",
    name: "Rose Petal Iced Tea",
    category: "drinks",
    price: 320,
    description: "Slow-brewed botanical tea infused with fragrant organic rosewater.",
    image: "/images/dish-rose-petal-iced-tea.jpg",
    tags: ["Rosewater", "Slow Brewed"],
    dietary: "Vegan",
    badge: null,
    popular: false,
    aliases: [
      "iced tea", "ice tea", "tea", "rose tea", "rose petal tea", "chai",
      "botanical tea", "cold tea"
    ]
  }
];
