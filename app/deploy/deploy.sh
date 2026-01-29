#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "==================================="
echo "Doomsday Deployment"
echo "==================================="

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo "Error: .env.production not found!"
    echo "Copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.production | xargs)

# Validate required variables
if [ "$DB_PASSWORD" = "CHANGE_THIS_TO_A_SECURE_PASSWORD" ]; then
    echo "Error: Please change DB_PASSWORD in .env.production"
    exit 1
fi

if [ "$JWT_SECRET" = "CHANGE_THIS_TO_A_SECURE_SECRET" ]; then
    echo "Error: Please change JWT_SECRET in .env.production"
    exit 1
fi

if [[ "$VITE_API_URL" == *"YOUR_SERVER_IP"* ]]; then
    echo "Error: Please replace YOUR_SERVER_IP with your actual server IP in .env.production"
    exit 1
fi

echo "Building and starting containers..."

# Build and start
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

echo ""
echo "Waiting for services to start..."
sleep 10

# Check health
echo "Checking service health..."
if docker compose -f docker-compose.prod.yml ps | grep -q "unhealthy\|Exit"; then
    echo "Warning: Some services may not be healthy. Check logs with:"
    echo "  docker compose -f docker-compose.prod.yml logs"
else
    echo "All services are running!"
fi

# Run database migrations
echo ""
echo "Running database migrations..."
docker compose -f docker-compose.prod.yml --env-file .env.production --profile migrate run --rm migrate || echo "Note: Migrations may need to be run manually"

echo ""
echo "==================================="
echo "Deployment complete!"
echo "==================================="
echo ""
echo "Your app is now running at: http://${VITE_API_URL%/api}"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  Stop:          docker compose -f docker-compose.prod.yml down"
echo "  Restart:       docker compose -f docker-compose.prod.yml restart"
echo "  Update:        git pull && ./deploy.sh"
echo ""
