import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LetsHelp - Tech Support & Scam Protection for Seniors",
    short_name: "LetsHelp",
    description:
      "Patient AI tech help for seniors, plus Pause & Check to spot scam texts, calls, and pop-ups before you click, call, or pay.",
    start_url: "/",
    display: "standalone",
    background_color: "#FEF9F3",
    theme_color: "#1E5A8D",
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}
