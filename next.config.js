/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',  // Важно для Static Site на Render
  images: {
    unoptimized: true,
  },
}

module.exports = nextConfig