/**
 * Reusable marketing copy — Lucy Merchant B2B marketplace
 */
export const brandCopy = {
  name: "Lucy Merchant",
  tagline: "Where verified supply meets confident demand.",
  hero: {
    eyebrow: "Enterprise-grade B2B commerce",
    headline:
      "Source smarter. Scale faster. Trade on a platform built for trust.",
    lead:
      "Discover vetted suppliers, negotiate in real time, and close bulk orders with cart checkout, dynamic commissions, and admin guardrails—built for clarity and scale.",
    ctaPrimary: "Start sourcing",
    ctaSecondary: "Join the network",
  },
  sections: {
    trending: {
      title: "Momentum picks",
      subtitle: "What procurement teams are buying right now",
    },
    topRated: {
      title: "Crowd-tested excellence",
      subtitle: "Highest-rated SKUs from trusted partners",
    },
    newest: {
      title: "Fresh on the floor",
      subtitle: "New listings you have not seen yet",
    },
    recommended: {
      title: "Recommended for you",
      subtitle:
        "A balanced mix of momentum, ratings, and newness — ready for smarter personalization later",
    },
    companies: {
      title: "Standout suppliers",
      subtitle: "Verified profiles buyers return to again and again",
    },
  },
  trust: {
    line1: "JWT-secured roles",
    line2: "Verified companies only",
    line3: "Order-linked chat",
  },
  search: {
    placeholder:
      "Search products, companies, categories — instant, scoped results",
    hint: "Tip: switch the filter chips to narrow to SKUs, suppliers, or taxonomy. Fuzzy matching forgives minor typos.",
    popularKeywords: [
      "cement",
      "bulk",
      "steel",
      "construction",
      "rebar",
      "delivery",
    ],
  },
  features: [
    {
      title: "Global discovery",
      body: "One search bar across products, companies, and categories — with suggestions and category filters.",
      icon: "search",
    },
    {
      title: "Advanced catalog filters",
      body: "Sort by recency, orders, or ratings; filter by category, ETB price band, minimum stars, and in-stock availability.",
      icon: "filter",
    },
    {
      title: "Bulk cart & checkout",
      body: "Multi-line carts, validation against min/max quantities, COD or bank transfer.",
      icon: "cart",
    },
    {
      title: "Order-linked chat",
      body: "Negotiate inside the order thread until the deal is delivered or completed.",
      icon: "chat",
    },
    {
      title: "Verified suppliers",
      body: "Companies pass admin review before they ship trust at scale.",
      icon: "shield",
    },
    {
      title: "Reviews & comments",
      body: "Post-completion company reviews and threaded product discussions.",
      icon: "star",
    },
    {
      title: "Dynamic commissions",
      body: "Admin-tuned percentages and posting points that flex with your GTM.",
      icon: "percent",
    },
    {
      title: "Role-perfect access",
      body: "Merchants, suppliers, and admins each land in a workspace tuned to their job.",
      icon: "roles",
    },
  ],
} as const;
