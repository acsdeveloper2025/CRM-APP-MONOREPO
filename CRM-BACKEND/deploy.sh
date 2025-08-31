#!/bin/bash

# CRM Backend Deployment Script for Render
echo "🚀 Deploying CRM Backend to Render..."

# Build the application
echo "📦 Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi

# Run any database migrations if needed
echo "🗄️ Running database setup..."
# Add your database migration commands here if you have any
# npm run db:migrate:deploy

echo "🎉 Deployment preparation complete!"
echo ""
echo "📋 Next steps:"
echo "1. Push your code to GitHub"
echo "2. Connect your GitHub repo to Render"
echo "3. Deploy using the render.yaml configuration"
echo ""
echo "🔗 Your API will be available at: https://your-app-name.onrender.com"
