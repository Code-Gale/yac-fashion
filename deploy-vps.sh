#!/bin/bash

# YAC Fashion House - VPS Deployment Script
# Idempotent: skips steps already completed. Safe to re-run for updates.
#
# Usage:
#   ./deploy-vps.sh              # Update deployment, skip completed steps
#   ./deploy-vps.sh --fresh      # Wipe volumes and rebuild everything
#   ./deploy-vps.sh --rebuild    # Force rebuild images (keeps data)
#   ./deploy-vps.sh --help

set -e

COMPOSE_FILE="docker-compose.prod.yml"
STATE_FILE=".deploy-state"
FRESH=false
REBUILD=false
SKIP_PULL=false

# ─── Helpers ───────────────────────────────────────────────────────────

skip() { echo "⏭️  Skipping: $1 (already done)"; }

step_ok() {
  echo "✅ $1"
  [ -n "$2" ] && mark_state "$2"
}

mark_state() {
  [ -n "$1" ] || return 0
  touch "$STATE_FILE"
  if grep -q "^${1}=" "$STATE_FILE" 2>/dev/null; then
    sed -i "s|^${1}=.*|${1}=1|" "$STATE_FILE"
  else
    echo "${1}=1" >> "$STATE_FILE"
  fi
}

set_state_var() {
  local key="$1" val="$2"
  touch "$STATE_FILE"
  if grep -q "^${key}=" "$STATE_FILE" 2>/dev/null; then
    sed -i "s|^${key}=.*|${key}=${val}|" "$STATE_FILE"
  else
    echo "${key}=${val}" >> "$STATE_FILE"
  fi
}

get_state_var() {
  grep "^${1}=" "$STATE_FILE" 2>/dev/null | cut -d= -f2- || true
}

state_done() {
  [ -f "$STATE_FILE" ] && grep -q "^${1}=1" "$STATE_FILE" 2>/dev/null
}

services_running() {
  docker compose -f "$COMPOSE_FILE" ps --status running 2>/dev/null | grep -qE 'api|web|mongodb'
}

api_healthy() {
  local resp
  resp=$(curl -sf http://localhost:4000/api/health 2>/dev/null || echo "")
  [[ "$resp" == *"ok"* ]] || [[ "$resp" == *"healthy"* ]]
}

wait_for_api() {
  local i max=30
  for i in $(seq 1 $max); do
    if api_healthy; then return 0; fi
    sleep 2
  done
  return 1
}

admin_exists() {
  local out
  out=$(docker compose -f "$COMPOSE_FILE" exec -T api npm run seed:admin 2>&1 || true)
  echo "$out" | grep -qi "Admin already exists"
}

product_count() {
  docker compose -f "$COMPOSE_FILE" exec -T mongodb \
    mongosh yac-fashion --quiet --eval "db.products.countDocuments()" 2>/dev/null | tr -d '\r\n' || echo "0"
}

nginx_site_enabled() {
  [ -L /etc/nginx/sites-enabled/yac-fashion-house ] 2>/dev/null
}

nginx_config_valid() {
  command -v nginx &>/dev/null && sudo nginx -t &>/dev/null
}

ssl_cert_exists() {
  local domain="$1"
  [ -n "$domain" ] && [ -f "/etc/letsencrypt/live/${domain}/fullchain.pem" ]
}

confirm() {
  local prompt="$1"
  read -p "$prompt (y/n): " -n 1 -r
  echo ""
  [[ $REPLY =~ ^[Yy]$ ]]
}

usage() {
  cat <<'EOF'
YAC Fashion House - VPS Deployment Script

Usage:
  ./deploy-vps.sh [options]

Options:
  --fresh       Stop containers, remove volumes, rebuild from scratch
  --rebuild     Force rebuild Docker images (keeps database data)
  --no-pull     Skip git pull
  --help        Show this help

By default the script is idempotent: completed steps are skipped on re-run.
State is tracked in .deploy-state
EOF
}

# ─── Parse args ─────────────────────────────────────────────────────────

while [ $# -gt 0 ]; do
  case "$1" in
    --fresh)   FRESH=true ;;
    --rebuild) REBUILD=true ;;
    --no-pull) SKIP_PULL=true ;;
    --help|-h) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
  shift
done

# ─── Banner ─────────────────────────────────────────────────────────────

echo "🚀 YAC Fashion House - Deployment"
echo "========================================"
[ "$FRESH" = true ] && echo "⚠️  --fresh mode: will wipe volumes and rebuild"
[ "$REBUILD" = true ] && echo "⚠️  --rebuild mode: will force image rebuild"
echo ""

# ─── Prerequisites (always checked) ────────────────────────────────────

if [ ! -f .env ]; then
  echo "❌ Error: .env file not found!"
  [ -f .env.example ] && echo "  cp .env.example .env && nano .env"
  exit 1
fi
step_ok "Found .env file" "env_ok"

for cmd in docker; do
  command -v "$cmd" &>/dev/null || { echo "❌ $cmd is not installed"; exit 1; }
done
docker compose version &>/dev/null || { echo "❌ Docker Compose not available"; exit 1; }
docker ps &>/dev/null || { echo "❌ Docker daemon is not running"; exit 1; }
step_ok "Prerequisites OK" "prereqs_ok"

# ─── Git pull ───────────────────────────────────────────────────────────

if [ "$SKIP_PULL" = false ] && [ -d .git ]; then
  if state_done git_pulled && [ "$FRESH" = false ] && [ "$REBUILD" = false ]; then
    skip "git pull"
  else
    echo "📥 Pulling latest changes..."
    git pull
    mark_state git_pulled
    step_ok "Git pull complete"
  fi
else
  skip "git pull (not a git repo or --no-pull)"
fi

echo ""

# ─── Docker deploy ──────────────────────────────────────────────────────

if [ "$FRESH" = true ]; then
  echo "🧹 Fresh deploy: removing containers and volumes..."
  docker compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true
  rm -f "$STATE_FILE"
  echo "🏗️  Building images (no cache)..."
  docker compose -f "$COMPOSE_FILE" build --no-cache
  echo "🚀 Starting services..."
  docker compose -f "$COMPOSE_FILE" up -d
elif services_running && [ "$REBUILD" = false ]; then
  skip "full rebuild (containers already running)"
  echo "🔄 Applying config changes and ensuring services are up..."
  docker compose -f "$COMPOSE_FILE" up -d
else
  if [ "$REBUILD" = true ]; then
    echo "🏗️  Rebuilding images..."
    docker compose -f "$COMPOSE_FILE" build --no-cache
  else
    echo "🏗️  Building images (using cache)..."
    docker compose -f "$COMPOSE_FILE" build
  fi
  echo "🚀 Starting services..."
  docker compose -f "$COMPOSE_FILE" up -d --remove-orphans
fi

mark_state docker_deployed

echo ""
echo "⏳ Waiting for API to become healthy..."
if wait_for_api; then
  step_ok "API is healthy"
else
  echo "⚠️  API health check timed out — check logs:"
  docker compose -f "$COMPOSE_FILE" logs api --tail=20
fi

echo ""
docker compose -f "$COMPOSE_FILE" ps

# ─── Seed admin ─────────────────────────────────────────────────────────

echo ""
echo "========================================"

if admin_exists; then
  skip "admin seed (admin account already exists)"
  mark_state admin_seeded
else
  if confirm "Seed admin user?"; then
    echo "🌱 Seeding admin user..."
    docker compose -f "$COMPOSE_FILE" exec -T api npm run seed:admin
    mark_state admin_seeded
    step_ok "Admin user created"
  fi
fi

# ─── Seed products ──────────────────────────────────────────────────────

COUNT=$(product_count)
if [ "${COUNT:-0}" -gt 0 ] 2>/dev/null; then
  skip "product seed ($COUNT products already in database)"
  mark_state products_seeded
else
  if confirm "Seed demo products and categories?"; then
    echo "🌱 Seeding products..."
    docker compose -f "$COMPOSE_FILE" exec -T api npm run seed
    mark_state products_seeded
    step_ok "Products seeded"
  fi
fi

# ─── Nginx ──────────────────────────────────────────────────────────────

echo ""
echo "========================================"

SAVED_DOMAIN=$(get_state_var nginx_domain)

if nginx_site_enabled && nginx_config_valid; then
  skip "Nginx setup (yac-fashion-house site already enabled and valid)"
  if [ -n "$SAVED_DOMAIN" ]; then
    echo "   Domain: $SAVED_DOMAIN"
    if ssl_cert_exists "$SAVED_DOMAIN"; then
      skip "SSL (certificate exists for $SAVED_DOMAIN)"
      mark_state ssl_enabled
    elif confirm "Retry certbot for HTTPS on $SAVED_DOMAIN?"; then
      :
    else
      SAVED_DOMAIN=""
    fi
  fi
fi

if ! nginx_site_enabled || ! nginx_config_valid; then
  if confirm "Configure Nginx reverse proxy?"; then
    if ! command -v nginx &>/dev/null; then
      echo "📦 Installing Nginx..."
      sudo apt-get update && sudo apt-get install -y nginx
    fi

    if [ ! -f nginx-http.conf ]; then
      echo "❌ nginx-http.conf not found in project root"
    else
      DEFAULT_DOMAIN="$SAVED_DOMAIN"
      [ -z "$DEFAULT_DOMAIN" ] && DEFAULT_DOMAIN=$(grep -E '^CLIENT_URL=' .env 2>/dev/null | sed 's|.*://||;s|/.*||' || true)

      echo ""
      echo "Domain name${DEFAULT_DOMAIN:+ [$DEFAULT_DOMAIN]}:"
      read -r DOMAIN
      [ -z "$DOMAIN" ] && DOMAIN="$DEFAULT_DOMAIN"

      if [ -z "$DOMAIN" ]; then
        echo "❌ No domain provided. Skipping Nginx."
      else
        echo "🔧 Configuring Nginx for $DOMAIN..."
        sudo mkdir -p /var/www/certbot
        sudo rm -f /etc/nginx/sites-enabled/yac /etc/nginx/sites-enabled/default

        sed "s/yourdomain.com/$DOMAIN/g" nginx-http.conf > /tmp/yac-nginx.conf
        sudo cp /tmp/yac-nginx.conf /etc/nginx/sites-available/yac-fashion-house
        sudo ln -sf /etc/nginx/sites-available/yac-fashion-house /etc/nginx/sites-enabled/
        rm -f /tmp/yac-nginx.conf

        if sudo nginx -t; then
          sudo systemctl reload nginx
          sudo systemctl enable nginx
          set_state_var nginx_domain "$DOMAIN"
          mark_state nginx_configured
          step_ok "Nginx configured (HTTP) for $DOMAIN"
          SAVED_DOMAIN="$DOMAIN"
        else
          echo "❌ Nginx test failed"
          sudo rm -f /etc/nginx/sites-enabled/yac-fashion-house
        fi
      fi
    fi
  fi
fi

# ─── SSL (certbot) ───────────────────────────────────────────────────────

DOMAIN="${SAVED_DOMAIN:-$(get_state_var nginx_domain)}"

if [ -n "$DOMAIN" ] && ! ssl_cert_exists "$DOMAIN"; then
  if state_done ssl_enabled && [ "$FRESH" = false ]; then
    skip "SSL setup (marked done in state, but cert missing — retry manually)"
  elif confirm "Run certbot to enable HTTPS for $DOMAIN?"; then
    if ! command -v certbot &>/dev/null; then
      sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
    fi
    echo "Email for Let's Encrypt [admin@$DOMAIN]:"
    read -r CERT_EMAIL
    [ -z "$CERT_EMAIL" ] && CERT_EMAIL="admin@$DOMAIN"
    echo "🔒 Obtaining SSL certificate..."
    if sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
        --non-interactive --agree-tos -m "$CERT_EMAIL" --redirect; then
      mark_state ssl_enabled
      step_ok "HTTPS enabled: https://$DOMAIN"
    else
      echo "⚠️  Certbot failed. Retry when DNS is ready:"
      echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    fi
  fi
elif [ -n "$DOMAIN" ] && ssl_cert_exists "$DOMAIN"; then
  skip "SSL (certificate already exists for $DOMAIN)"
  mark_state ssl_enabled
fi

# ─── Summary ─────────────────────────────────────────────────────────────

echo ""
echo "========================================"
echo "✅ Deployment Complete!"
echo "========================================"
echo ""
echo "📊 Local service URLs:"
echo "   - API: http://localhost:4000/api/health"
echo "   - Web: http://localhost:3000"
[ -n "$DOMAIN" ] && echo "   - Public: https://$DOMAIN (if SSL configured)"
echo ""
echo "📝 Useful commands:"
echo "   docker compose -f $COMPOSE_FILE logs -f"
echo "   docker compose -f $COMPOSE_FILE ps"
echo "   docker compose -f $COMPOSE_FILE restart api"
echo "   ./deploy-vps.sh --rebuild    # rebuild images, keep data"
echo "   ./deploy-vps.sh --fresh      # wipe everything and start over"
echo ""
