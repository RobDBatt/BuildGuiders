import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BuildGuiders",
    short_name: "BuildGuiders",
    description: "Home entertainment troubleshooting guides",
    start_url: "/",
    display: "standalone",
    background_color: "#0C1321",
    theme_color: "#0C1321",
    icons: [
      {
        src: "/favicon-256.png",
        sizes: "256x256",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/favicon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
