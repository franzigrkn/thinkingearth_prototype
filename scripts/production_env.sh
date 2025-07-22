# Model Prediction Visualizer - Cloud Deployment

# Environment variables for production
export FLASK_ENV=production
export FLASK_DEBUG=False

# Optional: Set custom port (default is 5000)
export PORT=8080

# Optional: Add basic authentication
# export BASIC_AUTH_USERNAME=admin
# export BASIC_AUTH_PASSWORD=your_secure_password

# Optional: Analytics and monitoring
# export GOOGLE_ANALYTICS_ID=your_ga_id
# export SENTRY_DSN=your_sentry_dsn

# Database URL (if you add database functionality later)
# export DATABASE_URL=postgresql://user:pass@host:port/dbname

echo "Environment configured for production deployment"
echo "App will run on port: ${PORT:-5000}"
