#!/bin/bash
set -e

echo "==================================="
echo "Doomsday Droplet Setup Script"
echo "==================================="

# Update system
echo "Updating system packages..."
apt-get update && apt-get upgrade -y

# Install Docker
echo "Installing Docker..."
apt-get install -y ca-certificates curl gnupg
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Start Docker
systemctl start docker
systemctl enable docker

# Install Git
echo "Installing Git..."
apt-get install -y git

# Create app directory
echo "Creating app directory..."
mkdir -p /opt/doomsday
cd /opt/doomsday

echo ""
echo "==================================="
echo "Setup complete!"
echo "==================================="
echo ""
echo "Next steps:"
echo "1. Clone your repository:"
echo "   git clone https://github.com/Lnk-dev/app.git ."
echo ""
echo "2. Copy and configure environment file:"
echo "   cp deploy/.env.production.example deploy/.env.production"
echo "   nano deploy/.env.production"
echo ""
echo "3. Update YOUR_SERVER_IP in .env.production with your droplet's IP"
echo ""
echo "4. Run the deployment:"
echo "   cd deploy && ./deploy.sh"
echo ""
