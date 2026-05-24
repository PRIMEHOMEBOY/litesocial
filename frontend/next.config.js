/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'gateway.pinata.cloud',
      'ipfs.io',
      'cloudflare-ipfs.com',
    ],
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs'],
  },
}

module.exports = nextConfig
