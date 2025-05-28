#!/bin/bash

# Backend Build Script for Render Deployment

echo "🚀 Starting backend build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Note: Database migrations are now handled at application startup
# This prevents build failures when database is not available during build time
echo "ℹ️  Database migrations will be handled at application startup"

echo "✅ Backend build completed successfully!" 