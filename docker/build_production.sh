#!/bin/bash

# Build script for production Docker image
echo "Building production Docker image for Model Prediction Visualizer..."

# Build the Docker image
docker build -f docker/Dockerfile.production -t thinkingearth-visualizer:latest .

echo "Docker image built successfully!"
echo "To run locally: docker run -p 8080:8080 thinkingearth-visualizer:latest"
echo "To push to registry, tag and push the image to your container registry"
