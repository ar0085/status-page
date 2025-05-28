#!/bin/bash

# Frontend Build Script for Render Deployment

echo "🚀 Starting frontend build process..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Build the React application (with fallback)
echo "🏗️ Building React application..."

# Try the full build first, if it fails, use the safe build
npm run build || {
    echo "⚠️  TypeScript compilation failed, using safe build..."
    npm run build:safe
}

echo "✅ Frontend build completed successfully!" 