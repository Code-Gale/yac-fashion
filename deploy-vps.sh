#!/bin/bash

# YAC Fashion House - VPS Deployment Script
# Idempotent: skips completed steps. Runs full pipeline by default (no prompts).
#
# Usage:
#   ./deploy-vps.sh                 # Full deploy, auto-run pending steps
#   ./deploy-vps.sh --interactive   # Prompt before seed / nginx / ssl
#   ./deploy-vps.sh --fresh         # Wipe volumes and rebuild
#   ./deploy-vps.sh --rebuild       # Force rebuild images (keeps data)
#   ./deploy-vps.sh --help

COMPOSE_FILE="docker-compose.prod.yml"
STATE_FILE=".deploy-state"
FRESH=false
REBUILD=false
SKIP_PULL=false
INTERACTIVE=false

# ─── Helpers ───────────────────────────────────────────────────────────

skip() { echo "⏭️  Skipping: $1 (already done)"; }

step_ok() {
  echo "✅ $1"
  [ -n "$2" ] && mark_state "$2"
}

section() {
  echo ""
  echo "========================================"
  echo "▶ $1"
  echo "========================================"
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
  grep "^${1}=" "$STATE_FILE" 2>/dev/null | cut -d= -f2- | tr -d '\r' || true
}

get_env_var() {
  grep -E "^${1}=" .env 2>/dev/null | cut -d= -f2- | tr -d '\r"' || true
}

get_domain_from_env() {
  local url domain
  url=$(get_env_var CLIENT_URL)
  url=${url#https://}
  url=${url#http://}
  domain=${url%%/*}
  domain=${domain%%:*}
  echo "$domain"
}

state_done() {
  [ -f "$STATE_FILE" ] && grep -q "^${1}=1" "$STATE_FILE" 2>/dev/null
}

should_run() {
  # Auto-run unless --interactive and user declines
  if [ "$INTERACTIVE" = false ]; then
    return 0
  fi
  confirm "$1"
}

services_running() {
  docker compose -f "$COMPOSE_FILE" ps --status running 2>/dev/null | grep -qE 'api|web|mongodb' || return 1
  return 0
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
  local count
  count=$(docker compose -f "$COMPOSE_FILE" exec -T mongodb \
    mongosh yac-fashion --quiet --eval "db.products.countDocuments()" 2>/dev/null | tr -d '\r\n ' || echo "0")
  if [[ "$count" =~ ^[0-9]+$ ]]; then
    echo "$count"
  else
    echo "0"
  fi
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
  read -p "$prompt (y/n): " -n 1 -r || true
  echo ""
  [[ $REPLY =~ ^[Yy]$ ]]
}

setup_nginx() {
  local domain="$1"
  if [ -z "$domain" ]; then
    echo "❌ No domain — set CLIENT_URL in .env (e.g. https://yacfashionhouse.com)"
    return 1
  fi
  if [ ! -f nginx-http.conf ]; then
    echo "❌ nginx-http.conf not found in project root"
    return 1
  fi

  if ! command -v nginx &>/dev/null; then
    echo "📦 Installing Nginx..."
    sudo apt-get update && sudo apt-get install -y nginx
  fi

  echo "🔧 Configuring Nginx for $domain..."
  sudo mkdir -p /var/www/certbot
  sudo rm -f /etc/nginx/sites-enabled/yac /etc/nginx/sites-enabled/default

  sed "s/yourdomain.com/$domain/g" nginx-http.conf > /tmp/yac-nginx.conf
  sudo cp /tmp/yac-nginx.conf /etc/nginx/sites-available/yac-fashion-house
  sudo ln -sf /etc/nginx/sites-available/yac-fashion-house /etc/nginx/sites-enabled/
  rm -f /tmp/yac-nginx.conf

  if sudo nginx -t; then
    sudo systemctl reload nginx || sudo systemctl start nginx
    sudo systemctl enable nginx
    set_state_var nginx_domain "$domain"
    mark_state nginx_configured
    step_ok "Nginx configured (HTTP) for $domain"
    return 0
  fi

  echo "❌ Nginx test failed"
  sudo rm -f /etc/nginx/sites-enabled/yac-fashion-house
  return 1
}

setup_ssl() {
  local domain="$1"
  local cert_email
  cert_email=$(get_env_var ADMIN_EMAIL)
  [ -z "$cert_email" ] && cert_email="admin@$domain"

  if ! command -v certbot &>/dev/null; then
    echo "📦 Installing certbot..."
    sudo apt-get update && sudo apt-get install -y certbot python3-certbot-nginx
  fi

  echo "🔒 Obtaining SSL certificate for $domain..."
  if sudo certbot --nginx -d "$domain" -d "www.$domain" \
      --non-interactive --agree-tos -m "$cert_email" --redirect; then
    mark_state ssl_enabled
    step_ok "HTTPS enabled: https://$domain"
    return 0
  fi

  echo "⚠️  Certbot failed. Ensure DNS points here, then run:"
  echo "  sudo certbot --nginx -d $domain -d www.$domain"
  return 1
}

usage() {
  cat <<'EOF'
YAC Fashion House - VPS Deployment Script

Usage:
  ./deploy-vps.sh [options]

Options:
  --interactive  Prompt before seed / nginx / ssl (default: auto-run pending steps)
  --fresh        Stop containers, remove volumes, rebuild from scratch
  --rebuild      Force rebuild Docker images (keeps database data)
  --no-pull      Skip git pull
  --help         Show this help

Pending steps run automatically using .env (CLIENT_URL, ADMIN_EMAIL).
State is tracked in .deploy-state
EOF
}

# ─── Parse args ─────────────────────────────────────────────────────────

while [ $# -gt 0 ]; do
  case "$1" in
    --fresh)       FRESH=true ;;
    --rebuild)     REBUILD=true ;;
    --no-pull)     SKIP_PULL=true ;;
    --interactive) INTERACTIVE=true ;;
    --help|-h)     usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
  shift
done

# Fix Windows line endings if present
if grep -q $'\r' "$0" 2>/dev/null; then
  sed -i 's/\r$//' "$0" 2>/dev/null || true
fi

# ─── Banner ─────────────────────────────────────────────────────────────

echo "🚀 YAC Fashion House - Deployment"
echo "========================================"
[ "$FRESH" = true ] && echo "⚠️  --fresh mode: will wipe volumes and rebuild"
[ "$REBUILD" = true ] && echo "⚠️  --rebuild mode: will force image rebuild"
[ "$INTERACTIVE" = true ] && echo "💬 Interactive mode: will prompt for optional steps"
echo ""

# ─── Prerequisites ─────────────────────────────────────────────────────

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
    git pull || echo "⚠️  git pull failed — continuing with local files"
    mark_state git_pulled
    step_ok "Git pull complete"
  fi
else
  skip "git pull (not a git repo or --no-pull)"
fi

# ─── Docker deploy ──────────────────────────────────────────────────────

section "Docker services"

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
  echo "🔄 Ensuring services are up..."
  docker compose -f "$COMPOSE_FILE" up -d || true
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
  echo "⚠️  API health check timed out — continuing with remaining steps"
  docker compose -f "$COMPOSE_FILE" logs api --tail=20 || true
fi

docker compose -f "$COMPOSE_FILE" ps || true

# ─── Seed admin ─────────────────────────────────────────────────────────

section "Admin user"

if admin_exists; then
  skip "admin seed (admin account already exists)"
  mark_state admin_seeded
elif should_run "Seed admin user?"; then
  echo "🌱 Seeding admin user..."
  if docker compose -f "$COMPOSE_FILE" exec -T api npm run seed:admin; then
    mark_state admin_seeded
    step_ok "Admin user ready"
  else
    echo "⚠️  Admin seed failed — check API logs"
  fi
else
  skip "admin seed (declined)"
fi

# ─── Seed products ──────────────────────────────────────────────────────

section "Demo products"

COUNT=$(product_count)
if [ "$COUNT" -gt 0 ] 2>/dev/null; then
  skip "product seed ($COUNT products already in database)"
  mark_state products_seeded
elif should_run "Seed demo products and categories?"; then
  echo "🌱 Seeding products..."
  if docker compose -f "$COMPOSE_FILE" exec -T api npm run seed; then
    mark_state products_seeded
    step_ok "Products seeded"
  else
    echo "⚠️  Product seed failed"
  fi
else
  skip "product seed (declined)"
fi

# ─── Nginx ──────────────────────────────────────────────────────────────

section "Nginx reverse proxy"

SAVED_DOMAIN=$(get_state_var nginx_domain)
[ -z "$SAVED_DOMAIN" ] && SAVED_DOMAIN=$(get_domain_from_env)
DOMAIN="$SAVED_DOMAIN"

if nginx_site_enabled && nginx_config_valid; then
  skip "Nginx setup (site already enabled and valid)"
  echo "   Domain: ${DOMAIN:-unknown}"
else
  if should_run "Configure Nginx for ${DOMAIN:-your domain}?"; then
    setup_nginx "$DOMAIN" || true
    DOMAIN=$(get_state_var nginx_domain)
    [ -z "$DOMAIN" ] && DOMAIN="$SAVED_DOMAIN"
  else
    skip "Nginx setup (declined)"
  fi
fi

# ─── SSL ─────────────────────────────────────────────────────────────────

section "SSL (Let's Encrypt)"

DOMAIN="${DOMAIN:-$(get_state_var nginx_domain)}"
[ -z "$DOMAIN" ] && DOMAIN=$(get_domain_from_env)

if [ -z "$DOMAIN" ]; then
  echo "⚠️  No domain in CLIENT_URL — skipping SSL"
elif ssl_cert_exists "$DOMAIN"; then
  skip "SSL (certificate already exists for $DOMAIN)"
  mark_state ssl_enabled
elif should_run "Run certbot for HTTPS on $DOMAIN?"; then
  setup_ssl "$DOMAIN" || true
else
  skip "SSL setup (declined)"
fi

# ─── Summary ─────────────────────────────────────────────────────────────

section "Deployment complete"

echo "📊 Local URLs:"
echo "   - API: http://localhost:4000/api/health"
echo "   - Web: http://localhost:3000"
if [ -n "$DOMAIN" ]; then
  if ssl_cert_exists "$DOMAIN"; then
    echo "   - Public: https://$DOMAIN"
  else
    echo "   - Public: http://$DOMAIN (SSL not configured yet)"
  fi
fi
echo ""
echo "📝 Useful commands:"
echo "   docker compose -f $COMPOSE_FILE logs -f"
echo "   docker compose -f $COMPOSE_FILE ps"
echo "   ./deploy-vps.sh --rebuild"
echo "   ./deploy-vps.sh --fresh"
echo ""
