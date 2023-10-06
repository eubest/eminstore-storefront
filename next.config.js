const checkoutEmbededInStorefrontPath = "/saleor-app-checkout";

module.exports = {
    images: {
        domains: ["acest.link"],
    },
    async headers() {
        return [
            {
                source: "/checkout/(.*)",
                headers: [{ key: "x-frame-options", value: "ALLOWALL" }],
            },
        ];
    },
    trailingSlash: true,
    async rewrites() {
        return [
            {
                source: '/checkout/',
                destination: `${process.env.NEXT_PUBLIC_CHECKOUT_APP_URL}/checkout-spa/`,
            },
            {
                source: `${checkoutEmbededInStorefrontPath}/`,
                destination: `${process.env.NEXT_PUBLIC_CHECKOUT_APP_URL}/`,
            },
            {
                source: `${checkoutEmbededInStorefrontPath}/:path*/`,
                destination: `${process.env.NEXT_PUBLIC_CHECKOUT_APP_URL}/:path*/`,
            },
            {
                source: `${checkoutEmbededInStorefrontPath}/:path*`,
                destination: `${process.env.NEXT_PUBLIC_CHECKOUT_APP_URL}/:path*`,
            }
        ];
    },
};