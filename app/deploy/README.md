# Doomsday Production Deployment

Deploy the full Doomsday stack to a Digital Ocean Droplet.

## Prerequisites

- Digital Ocean account
- Domain name (optional)

## Quick Start

### 1. Create Digital Ocean Droplet

1. Go to [Digital Ocean](https://cloud.digitalocean.com/)
2. Create a new Droplet:
   - **Image**: Ubuntu 24.04 LTS
   - **Plan**: Basic ($12/mo minimum - 2GB RAM recommended)
   - **Region**: Choose closest to your users
   - **Authentication**: SSH Key (recommended) or Password
3. Note your Droplet's **IP address**

### 2. Connect to Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

### 3. Run Setup Script

```bash
# Download and run setup script
curl -fsSL https://raw.githubusercontent.com/Lnk-dev/app/main/deploy/setup-droplet.sh | bash
```

Or manually:

```bash
# Update system
apt-get update && apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# Install Git
apt-get install -y git

# Create app directory
mkdir -p /opt/doomsday
cd /opt/doomsday
```

### 4. Clone Repository

```bash
cd /opt/doomsday
git clone https://github.com/Lnk-dev/app.git .
```

### 5. Configure Environment

```bash
cd deploy
cp .env.production.example .env.production
nano .env.production
```

**Required changes:**

```bash
# Generate secure password
DB_PASSWORD=$(openssl rand -base64 32)
echo "DB_PASSWORD=$DB_PASSWORD"

# Generate JWT secret
JWT_SECRET=$(openssl rand -base64 64)
echo "JWT_SECRET=$JWT_SECRET"

# Set your server IP
VITE_API_URL=http://YOUR_DROPLET_IP/api
VITE_WS_URL=http://YOUR_DROPLET_IP
```

### 6. Deploy

```bash
./deploy.sh
```

## Post-Deployment

### View Logs

```bash
cd /opt/doomsday/deploy
docker compose -f docker-compose.prod.yml logs -f
```

### Check Status

```bash
docker compose -f docker-compose.prod.yml ps
```

### Restart Services

```bash
docker compose -f docker-compose.prod.yml restart
```

### Update Deployment

```bash
cd /opt/doomsday
git pull
cd deploy
./deploy.sh
```

### Stop Everything

```bash
docker compose -f docker-compose.prod.yml down
```

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Digital Ocean                      │
│  ┌───────────────────────────────────────────────┐  │
│  │                    Droplet                     │  │
│  │  ┌─────────────────────────────────────────┐  │  │
│  │  │              Docker Network              │  │  │
│  │  │                                         │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌───────┐ │  │  │
│  │  │  │   web    │  │   api    │  │  db   │ │  │  │
│  │  │  │ (nginx)  │→│ (hono)   │→│(postgres)│ │  │  │
│  │  │  │  :80     │  │  :3001   │  │ :5432 │ │  │  │
│  │  │  └──────────┘  └──────────┘  └───────┘ │  │  │
│  │  │       ↑                                 │  │  │
│  │  └───────│─────────────────────────────────┘  │  │
│  └──────────│────────────────────────────────────┘  │
└─────────────│───────────────────────────────────────┘
              │
         Users (HTTP :80)
```

## Troubleshooting

### Container won't start

```bash
docker compose -f docker-compose.prod.yml logs api
docker compose -f docker-compose.prod.yml logs web
```

### Database connection issues

```bash
docker compose -f docker-compose.prod.yml exec db psql -U doomsday -d doomsday
```

### Rebuild containers

```bash
docker compose -f docker-compose.prod.yml up -d --build --force-recreate
```

### Clear everything and start fresh

```bash
docker compose -f docker-compose.prod.yml down -v
./deploy.sh
```

## SSL/HTTPS (Optional)

For HTTPS with Let's Encrypt, install Certbot:

```bash
apt-get install certbot python3-certbot-nginx

# Run after deployment
certbot --nginx -d yourdomain.com
```

## Firewall Setup

```bash
ufw allow 22    # SSH
ufw allow 80    # HTTP
ufw allow 443   # HTTPS (if using SSL)
ufw enable
```
