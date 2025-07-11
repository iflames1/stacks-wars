import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }],
	},
	serverExternalPackages: ["grammy"],
	/* config options here */
};

export default nextConfig;
