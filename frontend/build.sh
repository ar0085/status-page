#!/bin/bash

# Frontend Build Script for Render Deployment

echo "🚀 Starting frontend build process..."

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm ci --production=false

# Build the React application
echo "🏗️ Building React application..."
npm run build

echo "✅ Frontend build completed successfully!" 