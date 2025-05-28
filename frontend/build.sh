#!/bin/bash

# Frontend Build Script for Render Deployment

echo "🚀 Starting frontend build process..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Build the React application (try regular build first, then safe build)
echo "🏗️ Building React application..."

# Try the regular build first, if it fails, use the safe build
npm run build || {
    echo "⚠️  Regular build failed, trying safe build..."
    npm run build:safe
}

echo "✅ Frontend build completed successfully!" 