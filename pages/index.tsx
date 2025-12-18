import React from 'react';
import Head from 'next/head';
import { Layout } from '@/components/Layout';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { FloatingChat } from '@/components/ui/FloatingChat';
import { prisma } from '@/lib/prisma';
import { GetServerSideProps } from 'next';
import Link from 'next/link';

export const getServerSideProps: GetServerSideProps = async (context) => {
  try {
    // Fetch Landing Page Config
    const landingConfig = await prisma.landingPage.findFirst({
      include: { media: { orderBy: { order: 'asc' } } }
    });

    return {
      props: {
        landingConfig: landingConfig ? {
          ...landingConfig,
          updatedAt: landingConfig.updatedAt.toISOString(),
          media: landingConfig.media ? landingConfig.media.map((m: any) => ({
            ...m,
            createdAt: m.createdAt.toISOString()
          })) : []
        } : {
          heroTitle: "Discover Amazing Products",
          heroSubtitle: "Premium Fashion & Accessories",
          heroImage: null,
          heroVideo: null,
          showVideo: false,
          buttonText: "Shop Now"
        }
      },
    };
  } catch (error) {
    console.error('SSR Error:', error);
    return {
      props: {
        landingConfig: null,
      },
    };
  }
};

export default function LandingPage({ landingConfig }: any) {
  return (
    <Layout>
      <Head>
        <title>Star Accessories | Premium Fashion & Accessories</title>
        <meta name="description" content="Welcome to Star Accessories. Discover premium fashion, gadgets, and lifestyle products." />
      </Head>

      <div className="relative min-h-screen flex flex-col">
        {/* Reuse Hero Component which handles background media/text */}
        <Hero config={landingConfig} />

        {/* Features Section */}
        <Features />

        {/* Call to Action Section */}
        {/* Call to Action Section */}
        <div className="py-20 px-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 transition-colors duration-300">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-black dark:text-white mb-6">
              Ready to explore our collection?
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
              Browse hundreds of premium products at unbeatable prices.
            </p>
            <Link href="/store">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform hover:scale-105 shadow-lg">
                Go to Store
              </button>
            </Link>
          </div>
        </div>

        {/* Floating Chat Widget */}
        <FloatingChat />
      </div>
    </Layout>
  );
}
