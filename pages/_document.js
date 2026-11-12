import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="es">
      <Head />
      <body style={{ margin: 0, padding: 0, background: 'linear-gradient(135deg, #0f0f1e 0%, #1a1a2e 100%)', minHeight: '100vh', color: '#fff', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, sans-serif' }}>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
