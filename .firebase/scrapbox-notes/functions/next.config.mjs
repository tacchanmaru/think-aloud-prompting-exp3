// next.config.mjs
import withPWAInit from "@ducanh2912/next-pwa";
var withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development"
  // add more options here
});
var nextConfig = {
  // Your Next.js config
};
var next_config_default = withPWA(nextConfig);
export {
  next_config_default as default
};
