const pluginForm = require("@tailwindcss/forms");

/** @type {import('@types/tailwindcss/tailwind-config').TailwindConfig} */
module.exports = {
  content: ["index.html", "src/**/*.{js,ts,jsx,tsx}"],
  theme: {},
  experimental: {},
  plugins: [pluginForm],
};
