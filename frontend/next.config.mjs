/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
    dest: "public",
    // 開発環境でもPWAをテストする場合はコメントアウトまたは削除
    // disable: process.env.NODE_ENV === "development",
    register: true,
    skipWaiting: true,
    sw: "/sw.js",
    runtimeCaching: [
        {
            urlPattern: /^https:\/\/api\.openai\.com\/v1\/realtime/,
            handler: "NetworkOnly",
        },
        {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
                cacheName: "google-fonts",
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 365 * 24 * 60 * 60 // 1 year
                }
            }
        },
        {
            urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "static-font-assets",
                expiration: {
                    maxEntries: 4,
                    maxAgeSeconds: 7 * 24 * 60 * 60 // 1 week
                }
            }
        },
        {
            urlPattern: /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "static-image-assets",
                expiration: {
                    maxEntries: 64,
                    maxAgeSeconds: 24 * 60 * 60 // 24 hours
                }
            }
        },
        {
            urlPattern: /\.(?:js)$/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "static-js-assets",
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60 // 24 hours
                }
            }
        },
        {
            urlPattern: /\.(?:css|less)$/i,
            handler: "StaleWhileRevalidate",
            options: {
                cacheName: "static-style-assets",
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60 // 24 hours
                }
            }
        },
        {
            urlPattern: /\.(?:json|xml|csv)$/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "static-data-assets",
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60 // 24 hours
                }
            }
        },
        {
            urlPattern: /.*/i,
            handler: "NetworkFirst",
            options: {
                cacheName: "others",
                expiration: {
                    maxEntries: 32,
                    maxAgeSeconds: 24 * 60 * 60 // 24 hours
                }
            }
        }
    ]
});

const nextConfig = {
    // Your Next.js config
};

export default withPWA(nextConfig); 