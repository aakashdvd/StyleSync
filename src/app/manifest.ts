import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "StyleSync",
    short_name: "StyleSync",
    description: "Turn any website into an interactive design system.",
    start_url: "/",
    display: "standalone",
    background_color: "#f8f8fb",
    theme_color: "#4f46e5",
  };
}
