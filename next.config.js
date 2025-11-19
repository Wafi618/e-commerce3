/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'via.placeholder.com',
      'images.unsplash.com',
      'plus.unsplash.com',
      'res.cloudinary.com',
      'lh3.googleusercontent.com',
      'iili.io',
      'xcdn.next.co.uk',
      'www.shutterstock.com',
      'static.vecteezy.com',
    ],
  },
};

module.exports = nextConfig;
