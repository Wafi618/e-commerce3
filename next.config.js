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
};

module.exports = nextConfig;
