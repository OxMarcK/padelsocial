/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: true,
  },
  images: {
    // Event flyers (events.cover_url) live in Supabase Storage's public
    // "flyers" bucket — any project ref, so this doesn't need updating if
    // the Supabase project is ever recreated.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co", pathname: "/storage/v1/object/public/**" }],
  },
};

module.exports = nextConfig;
