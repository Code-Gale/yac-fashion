#!/bin/bash

# YAC Fashion House - Fresh VPS Deployment Script
# This script performs a fresh deployment of the application on a new VPS

set -e  # Exit on any error

echo "🚀 YAC Fashion House - Fresh Deployment"
echo "========================================"
echo ""

# Check if running as root
if [ "$EUID" -eq 0 ]; then
    echo "⚠️  Warning: Running as root. Consider creating a dedicated user for deployments."
    echo ""
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found!"
    echo ""
    echo "Please create a .env file with all required environment variables."
    if [ -f .env.example ]; then
        echo "Copy .env.example and fill in your values:"
        echo "  cp .env.example .env"
        echo "  nano .env"
    else
        echo "See documentation for required environment variables."
    fi
    exit 1
fi

echo "✅ Found .env file"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo ""
    echo "❌ Error: Docker is not installed!"
    echo ""
    echo "Install Docker with:"
    echo "  curl -fsSL https://get.docker.com -o get-docker.sh"
    echo "  sudo sh get-docker.sh"
    echo "  sudo usermod -aG docker \$USER"
    echo ""
    echo "Or follow: https://docs.docker.com/engine/install/"
    exit 1
fi

echo "✅ Docker is installed"

# Check if Docker Compose is available
if ! docker compose version &> /dev/null; then
    echo ""
    echo "❌ Error: Docker Compose is not available!"
    echo ""
    echo "Docker Compose should come with Docker. Try updating Docker:"
    echo "  sudo apt-get update && sudo apt-get install docker-ce docker-ce-cli containerd.io docker-compose-plugin"
    exit 1
fi

echo "✅ Docker Compose is available"

# Check if Docker daemon is running
if ! docker ps &> /dev/null; then
    echo ""
    echo "❌ Error: Docker daemon is not running!"
    echo ""
    echo "Start Docker with:"
    echo "  sudo systemctl start docker"
    echo "  sudo systemctl enable docker"
    exit 1
fi

echo "✅ Docker daemon is running"
echo ""

# Clean up any existing containers/volumes (fresh start)
echo "🧹 Cleaning up any existing containers..."
docker compose -f docker-compose.prod.yml down -v 2>/dev/null || true

# Build images
echo ""
echo "🏗️  Building Docker images (this may take several minutes)..."
docker compose -f docker-compose.prod.yml build --no-cache

# Start services
echo ""
echo "🚀 Starting services..."
docker compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo ""
echo "⏳ Waiting for services to initialize (60 seconds)..."
sleep 60

# Check service health
echo ""
echo "🔍 Checking service health..."
docker compose -f docker-compose.prod.yml ps

# Show API health
echo ""
echo "🏥 Checking API health endpoint..."
API_HEALTH=$(curl -s http://localhost:4000/api/health || echo "unavailable")
if [[ "$API_HEALTH" == *"ok"* ]] || [[ "$API_HEALTH" == *"healthy"* ]]; then
    echo "✅ API is healthy"
else
    echo "⚠️  API health check failed. Check logs below."
fi

# Show recent logs
echo ""
echo "📋 Recent logs (last 30 lines):"
docker compose -f docker-compose.prod.yml logs --tail=30

# Seed admin user prompt
echo ""
echo "========================================"
echo ""
read -p "Do you want to seed an admin user? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🌱 Seeding admin user..."
    docker compose -f docker-compose.prod.yml exec -T api npm run seed:admin
    echo "✅ Admin user created (check output above for credentials)"
fi

# Seed products prompt
echo ""
read -p "Do you want to seed demo products and categories? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "🌱 Seeding products, categories, and sample data..."
    echo "   (This may take a few moments...)"
    docker compose -f docker-compose.prod.yml exec -T api npm run seed
    echo "✅ Products and categories seeded successfully"
fi

# Nginx setup prompt
echo ""
echo "========================================"
echo ""
read -p "Do you want to configure Nginx reverse proxy? (y/n): " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    
    # Check if Nginx is installed
    if ! command -v nginx &> /dev/null; then
        echo "📦 Nginx is not installed. Installing..."
        sudo apt-get update
        sudo apt-get install -y nginx
        echo "✅ Nginx installed"
    else
        echo "✅ Nginx is already installed"
    fi
    
    # Check if nginx.conf exists in project
    if [ ! -f nginx.conf ]; then
        echo "❌ Error: nginx.conf not found in project root"
    else
        echo ""
        echo "Please enter your domain name (e.g., yourdomain.com):"
        read -r DOMAIN
        
        if [ -z "$DOMAIN" ]; then
            echo "❌ Domain name cannot be empty. Skipping Nginx setup."
        else
            echo ""
            echo "🔧 Configuring Nginx for $DOMAIN..."
            
            # Create temporary config with domain substitution
            sed "s/yourdomain.com/$DOMAIN/g" nginx.conf > /tmp/yac-nginx.conf
            
            # Copy to Nginx sites-available
            sudo cp /tmp/yac-nginx.conf /etc/nginx/sites-available/yac-fashion-house
            
            # Remove default site if it exists
            sudo rm -f /etc/nginx/sites-enabled/default
            
            # Enable the site
            sudo ln -sf /etc/nginx/sites-available/yac-fashion-house /etc/nginx/sites-enabled/
            
            # Test Nginx configuration
            echo ""
            if sudo nginx -t; then
                echo "✅ Nginx configuration is valid"
                
                # Reload Nginx
                sudo systemctl reload nginx
                sudo systemctl enable nginx
                
                echo "✅ Nginx configured and reloaded"
                echo ""
                echo "📝 Note: The site is configured for HTTPS but SSL certificates are not yet installed."
                echo ""
                echo "To enable HTTPS with Let's Encrypt:"
                echo "  1. Ensure DNS A record points to this server's IP"
                echo "  2. Install certbot: sudo apt-get install -y certbot python3-certbot-nginx"
                echo "  3. Run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
                echo ""
            else
                echo "❌ Nginx configuration test failed. Please check the configuration."
                sudo rm -f /etc/nginx/sites-enabled/yac-fashion-house
            fi
            
            # Cleanup
            rm -f /tmp/yac-nginx.conf
        fi
    fi
fi

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "📊 Service URLs:"
echo "   - API: http://localhost:4000/api/health"
echo "   - Web: http://localhost:3000"
echo ""
echo "🔐 Next Steps:"
echo "   1. Set up Nginx reverse proxy (see nginx.conf)"
echo "   2. Configure SSL with Let's Encrypt"
echo "   3. Update DNS records to point to this server"
echo "   4. Configure firewall rules"
echo ""
echo "📝 Useful Commands:"
echo "   - View logs: docker compose -f docker-compose.prod.yml logs -f"
echo "   - View logs (specific service): docker compose -f docker-compose.prod.yml logs -f api"
echo "   - Stop services: docker compose -f docker-compose.prod.yml down"
echo "   - Restart services: docker compose -f docker-compose.prod.yml restart"
echo "   - Check status: docker compose -f docker-compose.prod.yml ps"
echo "   - Access API shell: docker compose -f docker-compose.prod.yml exec api sh"
echo "   - Seed admin: docker compose -f docker-compose.prod.yml exec api npm run seed:admin"
echo "   - Seed products: docker compose -f docker-compose.prod.yml exec api npm run seed"
echo ""
echo "📖 Documentation:"
echo "   - Nginx setup: See nginx.conf in project root"
echo "   - SSL setup: https://certbot.eff.org/"
echo ""
