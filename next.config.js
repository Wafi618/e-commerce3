/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'via.placeholder.com' },
            { protocol: 'https', hostname: 'images.unsplash.com' },
            { protocol: 'https', hostname: 'plus.unsplash.com' },
            { protocol: 'https', hostname: 'res.cloudinary.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
            { protocol: 'https', hostname: 'iili.io' },
            { protocol: 'https', hostname: 'xcdn.next.co.uk' },
            { protocol: 'https', hostname: 'www.shutterstock.com' },
            { protocol: 'https', hostname: 'static.vecteezy.com' },
        ],
    },
    webpack: (config, { isServer }) => {
        if (!isServer) {
            const ignoredPaths = [
                /[\\/]node_modules[\\/]/,
                /[\\/]\.next[\\/]/,
                /[\\/]System Volume Information[\\/]/,
                /[\\/]\$RECYCLE\.BIN[\\/]/,
            ];

            let existingIgnored = config.watchOptions.ignored;
            if (!Array.isArray(existingIgnored)) {
                existingIgnored = existingIgnored ? [existingIgnored] : [];
            }

            config.watchOptions.ignored = [...existingIgnored, ...ignoredPaths];
        }
        return config;
    },
};

module.exports = nextConfig;
