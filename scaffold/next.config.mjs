/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Allow serving large static corpus JSON
  experimental: { largePageDataBytes: 5 * 1024 * 1024 },
};
export default nextConfig;
