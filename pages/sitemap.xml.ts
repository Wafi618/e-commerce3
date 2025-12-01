import { GetServerSideProps } from 'next';
import { prisma } from '@/lib/prisma';

const EXTERNAL_DATA_URL = 'https://starxessories.cc';

function generateSiteMap(products: any[]) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!--We manually set the two URLs we know already-->
  <url>
    <loc>${EXTERNAL_DATA_URL}</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${EXTERNAL_DATA_URL}/contact</loc>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  ${products
      .map(({ id, updatedAt }) => {
        return `
  <url>
      <loc>${`${EXTERNAL_DATA_URL}/product/${id}`}</loc>
      <lastmod>${new Date(updatedAt).toISOString()}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
  </url>
`;
      })
      .join('')}
</urlset>`;
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
