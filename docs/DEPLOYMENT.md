# Deployment Guide

## Prerequisites
- Docker and Docker Compose installed
- GitHub account and repository
- Hosting provider account (AWS, Heroku, DigitalOcean, etc.)

## Local Deployment

### Using Docker
```bash
# Clone repository
git clone <repository-url>
cd retail-erp

# Create environment files
cp backend/.env.production backend/.env

# Update .env with production values
# DB_HOST, DB_PASSWORD, JWT_SECRET, etc.

# Build and run
docker-compose -f docker-compose.yml up -d

# View logs
docker-compose logs -f
```

## Cloud Deployment

### Heroku
```bash
# Install Heroku CLI
# Login
heroku login

# Create app
heroku create retail-erp-prod

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set DB_HOST=your_db_host
heroku config:set JWT_SECRET=your_secret

# Deploy
git push heroku main
```

### AWS
```bash
# Using Docker on AWS ECR
aws ecr create-repository --repository-name retail-erp

# Build and push Docker images
docker build -t retail-erp:latest .
docker tag retail-erp:latest <aws-account>.dkr.ecr.<region>.amazonaws.com/retail-erp:latest
docker push <aws-account>.dkr.ecr.<region>.amazonaws.com/retail-erp:latest

# Deploy to ECS or Elastic Beanstalk
```

### DigitalOcean
```bash
# Create Droplet
# SSH into droplet
ssh root@your_droplet_ip

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Clone and deploy
git clone <repository-url>
cd retail-erp
docker-compose up -d
```

## GitHub Actions CI/CD

The project includes GitHub Actions workflow for automatic deployment.

### Configure Secrets
1. Go to Repository Settings > Secrets
2. Add these secrets:
   - `DB_HOST`
   - `DB_USER`
   - `DB_PASSWORD`
   - `JWT_SECRET`
   - `DOCKER_HUB_USERNAME`
   - `DOCKER_HUB_TOKEN`

### Trigger Deployment
Push to main branch:
```bash
git push origin main
```

GitHub Actions will automatically:
1. Run tests
2. Build Docker images
3. Push to registry
4. Deploy to production

## Database Migration

```bash
# Run migrations
docker-compose exec backend npm run migrate

# Run seeders
docker-compose exec backend npm run seed
```

## Backup and Recovery

### Database Backup
```bash
# Backup PostgreSQL
docker-compose exec postgres pg_dump -U postgres retail_erp_prod > backup.sql

# Restore
docker-compose exec -T postgres psql -U postgres retail_erp_prod < backup.sql
```

## Monitoring

### Logs
```bash
# View all logs
docker-compose logs

# View specific service
docker-compose logs backend
docker-compose logs frontend
```

### Health Checks
```bash
# Check API health
curl http://localhost:5000/api/health

# Check container status
docker-compose ps
```

## Scaling

### Horizontal Scaling
```bash
# Scale backend services
docker-compose up -d --scale backend=3
```

### Load Balancing
Configure nginx or similar reverse proxy

## SSL/HTTPS

### Using Let's Encrypt
```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com

# Update docker-compose.yml with certificate paths
```

## Performance Optimization

1. Enable Redis caching
2. Configure CDN for static assets
3. Enable gzip compression
4. Optimize database queries
5. Implement connection pooling

## Security Hardening

1. Use strong passwords
2. Enable firewall rules
3. Configure SSL/TLS
4. Regular security updates
5. Monitor access logs
6. Implement rate limiting
7. Set up DDoS protection

## Troubleshooting

### Container won't start
```bash
docker-compose logs <service-name>
```

### Database connection error
```bash
docker-compose exec postgres psql -U postgres -c "SELECT version();"
```

### Port conflicts
```bash
# Find process using port
lsof -i :<port>
```

## Maintenance

### Regular Tasks
- Monitor disk space
- Review logs
- Update dependencies
- Database optimization
- Security patches
- Backup verification

### Scheduled Jobs
- Database backups (daily)
- Log rotation (weekly)
- Updates (monthly)

## Rollback

```bash
# Rollback to previous version
git revert <commit-hash>
git push origin main

# Or restart previous container
docker-compose down
docker pull <previous-image>
docker-compose up -d
```

## Support

Document any deployment issues and solutions for future reference.
