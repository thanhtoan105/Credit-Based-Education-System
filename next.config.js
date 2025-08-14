/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    // Handle jsPDF and related modules
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    // Optimize chunk splitting for PDF libraries
    config.optimization = {
      ...config.optimization,
      splitChunks: {
        ...config.optimization.splitChunks,
        cacheGroups: {
          ...config.optimization.splitChunks?.cacheGroups,
          pdf: {
            test: /[\\/]node_modules[\\/](jspdf|jspdf-autotable)[\\/]/,
            name: 'pdf-libs',
            chunks: 'all',
            priority: 10,
          },
        },
      },
    };

    return config;
  },
};

module.exports = nextConfig;
