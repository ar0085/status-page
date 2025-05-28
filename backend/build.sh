#!/bin/bash

# Backend Build Script for Render Deployment

echo "🚀 Starting backend build process..."

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Run database migrations
echo "🗄️ Running database migrations..."
alembic upgrade head

echo "✅ Backend build completed successfully!" 