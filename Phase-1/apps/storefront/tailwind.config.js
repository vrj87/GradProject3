/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        myntra: {
          pink: "#ff3f6c",
          dark: "#282c3f",
          muted: "#535766",
          border: "#e9e9ed",
          green: "#03a685",
          gold: "#ff905a",
          bg: "#f5f5f6"
        }
      },
      fontFamily: {
        sans: ["Assistant", "Inter", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 2px 16px rgba(40,44,63,0.08)"
      }
    }
  }
};
