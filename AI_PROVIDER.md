# SunnyBite Assistant — AI Provider Integration Guide

This guide explains how to connect a remote Large Language Model (e.g. Google Gemini API, OpenAI GPT, or Anthropic Claude) to the SunnyBite order-taking assistant without rewriting existing components.

---

## 1. Security Architecture (Critical)

> [!CAUTION]
> **NEVER embed your API keys in frontend React code, environment variables prefixed with `VITE_`, or browser bundles.**
> Front-end code is publicly viewable by anyone inspecting network traffic or JavaScript sources.

Always use a lightweight backend serverless proxy (e.g., Cloudflare Workers, Vercel Serverless Functions, Netlify Functions, or Node.js/Express) to hold your secret API key.

```
┌─────────────────────┐               ┌────────────────────────┐               ┌────────────────────┐
│ SunnyBite Frontend  │  POST query   │  Serverless Proxy      │  Authorized   │  Google Gemini /   │
│ (React ChatWidget)  │ ────────────> │  (Cloudflare / Vercel) │ ────────────> │  LLM Provider API  │
│                     │ <──────────── │  Holds Secret API Key  │ <──────────── │                    │
└─────────────────────┘   Structured  └────────────────────────┘   Response    └────────────────────┘
                           JSON Reply
```

---

## 2. Serverless Proxy Example (Cloudflare Worker or Vercel Function)

Here is a minimal Cloudflare Worker (`worker.js`):

```javascript
export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    const { message, context, cartItems } = await request.json();

    const systemPrompt = `
You are the SunnyBite Café order-taking assistant in I-8 Islamabad.
Menu items and prices: ${JSON.stringify(env.MENU_CACHE)}
Restaurant hours: 9am - 10pm daily.
Creator: Abdul Manan (UI/UX Designer & Web Developer).
Respond warmly in the user's language (English or Roman Urdu).
Output valid JSON matching:
{
  "text": "friendly response",
  "chips": ["Show menu", "Checkout now"],
  "cartAction": { "type": "add", "dishId": "margherita-pizza", "qty": 1 }
}
`;

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\nUser: ${message}` }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    const data = await geminiResponse.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  }
};
```

---

## 3. Connecting to `src/chat/engine.js`

In `src/chat/engine.js`, the `// TODO: optional LLM provider` hook is already prepared:

```javascript
export async function getReply(message, context = {}, cartItems = []) {
  if (typeof window !== 'undefined' && window.SUNNYBITE_USE_REMOTE_LLM) {
    try {
      const res = await fetch("https://your-api-proxy.workers.dev/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, context, cartItems })
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn("LLM proxy unavailable; smoothly falling back to SunnyBite local engine:", err);
    }
  }

  // Local rule-based engine continues seamlessly below...
}
```

---

## 4. Exposed Local Tool Functions

The engine exports `AssistantTools` so an agent or model can call them deterministically:

| Tool Function | Description |
| :--- | :--- |
| `AssistantTools.findDishes(query)` | Matches dishes by name, alias, category, and typo tolerance |
| `AssistantTools.buildWhatsAppOrder(cart, customer)` | Formats the final WhatsApp order string |
| `AssistantTools.isOpen()` | Checks if SunnyBite is currently open (Asia/Karachi time) |
| `AssistantTools.getMenu()` | Returns the complete 18-dish menu catalog |
| `AssistantTools.getFaq(topic)` | Queries operational answers (delivery, halal, payment, etc.) |
| `AssistantTools.getSiteInfo()` | Accesses structured site section summaries |
