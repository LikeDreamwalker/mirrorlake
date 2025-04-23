import Script from "next/script";

export default function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Mirrorlake",
    description:
      "An aggregated color agent with LLM, Engineering and AI capabilities for selecting colors and building themes.",
    applicationCategory: "DesignApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    author: {
      "@type": "Person",
      name: "LikeDreamwalker",
      url: "https://likedreamwalker.space",
    },
    screenshot: "https://mirrorlake.ldwid.com/screenshot.png",
  };

  return (
    <Script
      id="structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}
