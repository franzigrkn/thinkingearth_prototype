#!/bin/bash

# Automated deployment script for Model Prediction Visualizer
# Choose your deployment platform: render, heroku, railway, gcp

PLATFORM=${1:-"render"}
APP_NAME=${2:-"model-prediction-visualizer"}

echo "🚀 Deploying Model Prediction Visualizer to $PLATFORM..."

# Prepare for deployment
echo "📦 Preparing application for deployment..."

# Create production requirements if not exists
if [ ! -f "requirements_production.txt" ]; then
    echo "Flask==3.0.0" > requirements_production.txt
    echo "gunicorn==21.2.0" >> requirements_production.txt
    echo "✅ Created production requirements"
fi

# Create Procfile if not exists
if [ ! -f "Procfile" ]; then
    echo "web: gunicorn app_production:app" > Procfile
    echo "✅ Created Procfile"
fi

case $PLATFORM in
    "render")
        echo "🎯 Deploying to Render..."
        echo "1. Push your code to GitHub"
        echo "2. Go to https://render.com"
        echo "3. Create new Web Service"
        echo "4. Connect your GitHub repo"
        echo "5. Use these settings:"
        echo "   - Build Command: pip install -r requirements_production.txt"
        echo "   - Start Command: gunicorn app_production:app"
        echo "   - Environment: Python 3"
        echo "6. Deploy!"
        ;;
    
    "heroku")
        echo "🔷 Deploying to Heroku..."
        # Check if Heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            echo "❌ Heroku CLI not found. Install from: https://devcenter.heroku.com/articles/heroku-cli"
            exit 1
        fi
        
        # Create Heroku app
        heroku create $APP_NAME
        
        # Set environment variables
        heroku config:set FLASK_ENV=production
        heroku config:set FLASK_DEBUG=False
        
        # Deploy
        git add .
        git commit -m "Deploy to Heroku"
        git push heroku main
        
        echo "✅ Deployed to Heroku: https://$APP_NAME.herokuapp.com"
        ;;
    
    "railway")
        echo "🚂 Deploying to Railway..."
        echo "1. Go to https://railway.app"
        echo "2. Connect your GitHub account"
        echo "3. Select your repository"
        echo "4. Railway will auto-detect and deploy your Flask app"
        echo "5. Your app will be available at: https://$APP_NAME.up.railway.app"
        ;;
    
    "gcp")
        echo "☁️ Deploying to Google Cloud Run..."
        # Check if gcloud CLI is installed
        if ! command -v gcloud &> /dev/null; then
            echo "❌ Google Cloud CLI not found. Install from: https://cloud.google.com/sdk/docs/install"
            exit 1
        fi
        
        # Build and deploy
        gcloud run deploy $APP_NAME \
            --source . \
            --platform managed \
            --region us-central1 \
            --allow-unauthenticated
        
        echo "✅ Deployed to Google Cloud Run"
        ;;
    
    "docker")
        echo "🐳 Building Docker image..."
        chmod +x docker/build_production.sh
        ./docker/build_production.sh
        ;;
    
    *)
        echo "❌ Unknown platform: $PLATFORM"
        echo "Available platforms: render, heroku, railway, gcp, docker"
        exit 1
        ;;
esac

echo ""
echo "🎉 Deployment process initiated!"
echo "📚 Check DEPLOYMENT.md for detailed instructions"
echo "🔧 Remember to:"
echo "   - Add your prediction images to static/images/predictions/"
echo "   - Configure your custom domain (optional)"
echo "   - Set up monitoring and analytics"
