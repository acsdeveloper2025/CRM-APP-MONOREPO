#!/bin/bash

# Enterprise CRM Deployment Script
# This script deploys the enterprise-scale CRM system with all components

set -e  # Exit on any error

# Configuration
ENVIRONMENT=${1:-production}
DEPLOY_TYPE=${2:-full}  # full, backend-only, frontend-only, mobile-only
VERSION=${3:-latest}

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    if ! docker info &> /dev/null; then
        error "Docker is not running. Please start Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if required environment files exist
    if [[ ! -f ".env.${ENVIRONMENT}" ]]; then
        error "Environment file .env.${ENVIRONMENT} not found."
    fi
    
    success "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log "Loading environment variables for ${ENVIRONMENT}..."
    
    # Load environment-specific variables
    if [[ -f ".env.${ENVIRONMENT}" ]]; then
        export $(cat .env.${ENVIRONMENT} | grep -v '^#' | xargs)
        success "Environment variables loaded"
    else
        error "Environment file .env.${ENVIRONMENT} not found"
    fi
}

# Build Docker images
build_images() {
    log "Building Docker images..."
    
    case $DEPLOY_TYPE in
        "full"|"backend-only")
            log "Building backend image..."
            docker build -t crm-backend:${VERSION} \
                --build-arg NODE_ENV=${ENVIRONMENT} \
                --build-arg VERSION=${VERSION} \
                ./CRM-BACKEND/
            success "Backend image built"
            ;;
    esac
    
    case $DEPLOY_TYPE in
        "full"|"frontend-only")
            log "Building frontend image..."
            docker build -t crm-frontend:${VERSION} \
                --build-arg REACT_APP_ENV=${ENVIRONMENT} \
                --build-arg VERSION=${VERSION} \
                ./CRM-FRONTEND/
            success "Frontend image built"
            ;;
    esac
    
    case $DEPLOY_TYPE in
        "full"|"mobile-only")
            log "Building mobile app..."
            cd CRM-MOBILE
            
            # Build Android APK
            if [[ -f "android/gradlew" ]]; then
                log "Building Android APK..."
                cd android
                ./gradlew assembleRelease
                cd ..
                success "Android APK built"
            fi
            
            # Build iOS (if on macOS)
            if [[ "$OSTYPE" == "darwin"* ]] && command -v xcodebuild &> /dev/null; then
                log "Building iOS app..."
                npx react-native run-ios --configuration Release
                success "iOS app built"
            fi
            
            cd ..
            ;;
    esac
}

# Setup infrastructure
setup_infrastructure() {
    log "Setting up infrastructure..."
    
    # Create necessary directories
    mkdir -p logs
    mkdir -p backups
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/prometheus
    mkdir -p nginx/ssl
    
    # Generate SSL certificates if they don't exist
    if [[ ! -f "nginx/ssl/cert.pem" ]]; then
        log "Generating self-signed SSL certificates..."
        openssl req -x509 -newkey rsa:4096 -keyout nginx/ssl/key.pem -out nginx/ssl/cert.pem -days 365 -nodes \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        success "SSL certificates generated"
    fi
    
    # Setup Redis cluster configuration
    if [[ ! -f "redis/redis.conf" ]]; then
        log "Creating Redis configuration..."
        cat > redis/redis.conf << EOF
# Redis Enterprise Configuration
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
appendonly yes
appendfsync everysec
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
EOF
        success "Redis configuration created"
    fi
    
    # Setup Nginx configuration
    if [[ ! -f "nginx/nginx.conf" ]]; then
        log "Creating Nginx configuration..."
        cat > nginx/nginx.conf << EOF
events {
    worker_connections 1024;
}

http {
    upstream backend {
        least_conn;
        server backend-1:3000 max_fails=3 fail_timeout=30s;
        server backend-2:3000 max_fails=3 fail_timeout=30s;
        server backend-3:3000 max_fails=3 fail_timeout=30s;
    }
    
    server {
        listen 80;
        server_name _;
        return 301 https://\$server_name\$request_uri;
    }
    
    server {
        listen 443 ssl;
        server_name _;
        
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
        
        location / {
            proxy_pass http://frontend:80;
            proxy_set_header Host \$host;
            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \$scheme;
        }
    }
}
EOF
        success "Nginx configuration created"
    fi
}

# Deploy services
deploy_services() {
    log "Deploying services..."
    
    # Stop existing services
    log "Stopping existing services..."
    docker-compose -f docker-compose.enterprise.yml down --remove-orphans
    
    # Start infrastructure services first
    log "Starting infrastructure services..."
    docker-compose -f docker-compose.enterprise.yml up -d \
        postgres-primary postgres-replica \
        redis-1 redis-2 redis-3 \
        elasticsearch logstash kibana \
        prometheus grafana \
        rabbitmq
    
    # Wait for infrastructure to be ready
    log "Waiting for infrastructure to be ready..."
    sleep 30
    
    # Initialize Redis cluster
    log "Initializing Redis cluster..."
    docker exec redis-1 redis-cli --cluster create \
        redis-1:6379 redis-2:6379 redis-3:6379 \
        --cluster-replicas 0 --cluster-yes || warning "Redis cluster already initialized"
    
    # Start application services
    case $DEPLOY_TYPE in
        "full")
            log "Starting all application services..."
            docker-compose -f docker-compose.enterprise.yml up -d
            ;;
        "backend-only")
            log "Starting backend services..."
            docker-compose -f docker-compose.enterprise.yml up -d \
                backend-1 backend-2 backend-3 nginx
            ;;
        "frontend-only")
            log "Starting frontend services..."
            docker-compose -f docker-compose.enterprise.yml up -d frontend
            ;;
    esac
    
    success "Services deployed"
}

# Run health checks
run_health_checks() {
    log "Running health checks..."
    
    # Wait for services to start
    sleep 60
    
    # Check backend health
    if [[ "$DEPLOY_TYPE" == "full" || "$DEPLOY_TYPE" == "backend-only" ]]; then
        log "Checking backend health..."
        for i in {1..30}; do
            if curl -f -s http://localhost/api/health > /dev/null; then
                success "Backend is healthy"
                break
            fi
            if [[ $i -eq 30 ]]; then
                error "Backend health check failed"
            fi
            sleep 10
        done
    fi
    
    # Check frontend health
    if [[ "$DEPLOY_TYPE" == "full" || "$DEPLOY_TYPE" == "frontend-only" ]]; then
        log "Checking frontend health..."
        for i in {1..30}; do
            if curl -f -s http://localhost:3001 > /dev/null; then
                success "Frontend is healthy"
                break
            fi
            if [[ $i -eq 30 ]]; then
                error "Frontend health check failed"
            fi
            sleep 10
        done
    fi
    
    # Check database health
    log "Checking database health..."
    if docker exec postgres-primary pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}; then
        success "Database is healthy"
    else
        error "Database health check failed"
    fi
    
    # Check Redis health
    log "Checking Redis health..."
    if docker exec redis-1 redis-cli ping | grep -q PONG; then
        success "Redis is healthy"
    else
        error "Redis health check failed"
    fi
}

# Run load tests
run_load_tests() {
    if [[ "$ENVIRONMENT" == "production" ]]; then
        warning "Skipping load tests in production environment"
        return
    fi
    
    log "Running load tests..."
    
    # Install dependencies if needed
    if [[ ! -d "node_modules" ]]; then
        npm install
    fi
    
    # Run load test
    TOTAL_USERS=100 BACKEND_USERS=50 FIELD_AGENTS=50 TEST_DURATION=60 \
        node scripts/enterprise-load-test.js
    
    if [[ $? -eq 0 ]]; then
        success "Load tests passed"
    else
        error "Load tests failed"
    fi
}

# Backup current deployment
backup_deployment() {
    log "Creating backup of current deployment..."
    
    BACKUP_DIR="backups/deployment-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    docker exec postgres-primary pg_dump -U ${POSTGRES_USER} ${POSTGRES_DB} > "$BACKUP_DIR/database.sql"
    
    # Backup Redis data
    docker exec redis-1 redis-cli BGSAVE
    docker cp redis-1:/data/dump.rdb "$BACKUP_DIR/redis.rdb"
    
    # Backup configuration files
    cp -r nginx "$BACKUP_DIR/"
    cp -r monitoring "$BACKUP_DIR/"
    cp docker-compose.enterprise.yml "$BACKUP_DIR/"
    cp .env.${ENVIRONMENT} "$BACKUP_DIR/"
    
    success "Backup created at $BACKUP_DIR"
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo ""
    
    # Show running containers
    docker-compose -f docker-compose.enterprise.yml ps
    echo ""
    
    # Show service URLs
    echo "Service URLs:"
    echo "  Frontend: http://localhost:3001"
    echo "  Backend API: http://localhost/api"
    echo "  Grafana: http://localhost:3000 (admin/admin)"
    echo "  Kibana: http://localhost:5601"
    echo "  Prometheus: http://localhost:9090"
    echo "  RabbitMQ: http://localhost:15672 (guest/guest)"
    echo ""
    
    # Show logs command
    echo "To view logs:"
    echo "  docker-compose -f docker-compose.enterprise.yml logs -f [service-name]"
    echo ""
}

# Main deployment function
main() {
    log "Starting Enterprise CRM Deployment"
    log "Environment: $ENVIRONMENT"
    log "Deploy Type: $DEPLOY_TYPE"
    log "Version: $VERSION"
    echo ""
    
    check_prerequisites
    load_environment
    backup_deployment
    setup_infrastructure
    build_images
    deploy_services
    run_health_checks
    
    if [[ "$ENVIRONMENT" != "production" ]]; then
        run_load_tests
    fi
    
    show_status
    
    success "Enterprise CRM deployment completed successfully!"
}

# Handle script arguments
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "Usage: $0 [environment] [deploy-type] [version]"
        echo ""
        echo "Arguments:"
        echo "  environment   Environment to deploy to (development|staging|production)"
        echo "  deploy-type   Type of deployment (full|backend-only|frontend-only|mobile-only)"
        echo "  version       Version tag for Docker images (default: latest)"
        echo ""
        echo "Examples:"
        echo "  $0 production full v1.0.0"
        echo "  $0 staging backend-only latest"
        echo "  $0 development full latest"
        exit 0
        ;;
    *)
        main
        ;;
esac
