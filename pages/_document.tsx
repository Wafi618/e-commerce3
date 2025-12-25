import Document, { Html, Head, Main, NextScript, DocumentContext } from 'next/document';
import { prisma } from '@/lib/prisma';

class MyDocument extends Document<{ favicon?: string }> {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    let favicon = '';

    try {
      // Direct prisma call is safe here because _document runs on server
      // Note: This adds a DB call to every pageload (cached by Next.js in prod mostly)
      // For higher traffic, this should be cached or passed via context
      const setting = await prisma.systemSetting.findUnique({
        where: { key: 'favicon_url' }
      });
      if (setting) favicon = setting.value;
    } catch (e) {
      console.warn('Failed to fetch favicon setting', e);
    }

    return { ...initialProps, favicon };
  }

  render() {
    const { favicon } = this.props;
    const faviconUrl = favicon || '/logo.png'; // Fallback

    return (
      <Html lang="en">
        <Head>
          {/* Google Translate Script */}
          <script
            type="text/javascript"
            dangerouslySetInnerHTML={{
              __html: `
                function googleTranslateElementInit() {
                  new google.translate.TranslateElement(
                    {
                      pageLanguage: 'en',
                      includedLanguages: 'bn,en',
                      layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
                      autoDisplay: false
                    },
                    'google_translate_element'
                  );
                }
              `,
            }}
          />
          <script
            type="text/javascript"
            src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          />

          <link rel="icon" href={faviconUrl} />
          <link rel="shortcut icon" href={faviconUrl} />
          <link rel="apple-touch-icon" href={faviconUrl} />

          <link rel="manifest" href="/manifest.json" />
          <meta name="theme-color" content="#000000" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
