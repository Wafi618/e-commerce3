import { GetServerSideProps } from 'next';
import { prisma } from '@/lib/prisma';

const EXTERNAL_DATA_URL = 'https://starxessories.cc';

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}

function generateSiteMap(products: any[]) {
  // Static pages that should be indexed
  const staticPages = [
    '', // Home
    '/store',
    // Add other public static pages here if they exist
  ];

  const staticUrls = staticPages
    .map((page) => {
      return `<url><loc>${escapeXml(`${EXTERNAL_DATA_URL}${page}`)}</loc><changefreq>daily</changefreq><priority>${page === '' ? '1.0' : '0.8'}</priority></url>`;
    })
    .join('');

  const productUrls = products
    .filter(({ id, updatedAt }) => id && updatedAt) // Ensure valid data
    .map(({ id, updatedAt }) => {
      let dateString;
      try {
        dateString = new Date(updatedAt).toISOString();
      } catch (e) {
        dateString = new Date().toISOString(); // Fallback to current date
      }
      return `<url><loc>${escapeXml(`${EXTERNAL_DATA_URL}/product/${id}`)}</loc><lastmod>${dateString}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`;
    })
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${staticUrls}${productUrls}</urlset>`;
}

function SiteMap() {
  // getServerSideProps will do the heavy lifting
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  try {
    // We make an API call to gather the URLs for our site
    const products = await prisma.product.findMany({
      where: {
        isArchived: false,
      },
      select: {
        id: true,
        updatedAt: true,
      },
    });

    // We generate the XML sitemap with the posts data
    const sitemap = generateSiteMap(products);

    // Cache the sitemap for 1 hour
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=59');
    res.setHeader('Content-Type', 'text/xml');

    // we send the XML to the browser
    res.write(sitemap);
    res.end();

    return {
      props: {},
    };
  } catch (error) {
    console.error('Sitemap Generation Error:', error);
    // Return a 500 error if sitemap generation fails
    res.statusCode = 500;
    res.end();
    return {
      props: {},
    };
  }
};

export default SiteMap;
