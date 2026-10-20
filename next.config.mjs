/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'jbzpjvnbektpsjinptto.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/categories/**',
      },
    ],
  },
};

export default nextConfig;
