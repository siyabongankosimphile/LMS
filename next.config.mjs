/** @type {import('next').NextConfig} */
const nextConfig = {
	webpack: (config, { dev, isServer }) => {
		if (dev && !isServer && config.output) {
			config.output.chunkLoadTimeout = 300000;
		}

		return config;
	},
};

export default nextConfig;
