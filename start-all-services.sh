#!/bin/bash

# CaseFlow Complete System Startup Script
# Starts all services: PostgreSQL, Redis, Backend API, Web Frontend, Mobile App

set -e  # Exit on any error

echo "🚀 Starting CaseFlow Complete System..."
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')] $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')] $1${NC}"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')] $1${NC}"
}

print_info() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')] $1${NC}"
}

# Function to check if a port is in use
check_port() {
    local port=$1
    local service=$2
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        print_warning "$service is already running on port $port"
        return 0
    else
        return 1
    fi
}

# Function to wait for service to be ready
wait_for_service() {
    local port=$1
    local service=$2
    local max_attempts=30
    local attempt=1
    
    print_info "Waiting for $service to be ready on port $port..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:$port >/dev/null 2>&1; then
            print_status "$service is ready on port $port"
            return 0
        fi
        
        if [ $((attempt % 5)) -eq 0 ]; then
            print_info "Still waiting for $service... (attempt $attempt/$max_attempts)"
        fi
        
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "$service failed to start on port $port after $max_attempts attempts"
    return 1
}

# Function to cleanup on exit
cleanup() {
    print_warning "Shutting down all services..."
    jobs -p | xargs -r kill
    wait
    print_status "All services stopped"
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

print_status "Checking system requirements..."

# Check if required commands exist
for cmd in psql redis-server node npm; do
    if ! command -v $cmd &> /dev/null; then
        print_error "$cmd is not installed or not in PATH"
        exit 1
    fi
done

print_status "All required commands found"

# Start PostgreSQL if not running
print_info "Starting PostgreSQL..."
if ! check_port 5432 "PostgreSQL"; then
    # Try to start PostgreSQL using different methods
    if command -v brew &> /dev/null && brew services list | grep postgresql &> /dev/null; then
        brew services start postgresql &
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start postgresql &
    elif command -v pg_ctl &> /dev/null; then
        pg_ctl -D /usr/local/var/postgres start &
    else
        print_error "Could not start PostgreSQL. Please start it manually."
        exit 1
    fi
    sleep 3
fi

# Start Redis if not running
print_info "Starting Redis..."
if ! check_port 6379 "Redis"; then
    if command -v brew &> /dev/null && brew services list | grep redis &> /dev/null; then
        brew services start redis &
    elif command -v systemctl &> /dev/null; then
        sudo systemctl start redis &
    else
        redis-server &
    fi
    sleep 2
fi

# Start Backend API
print_info "Starting Backend API..."
if ! check_port 3000 "Backend API"; then
    cd acs-backend
    print_status "Installing backend dependencies..."
    npm install --silent
    print_status "Starting backend server on port 3000..."
    npm run dev &
    BACKEND_PID=$!
    cd ..
    
    # Wait for backend to be ready
    wait_for_service 3000 "Backend API"
fi

# Start Web Frontend
print_info "Starting Web Frontend..."
if ! check_port 5173 "Web Frontend"; then
    cd acs-frontend
    print_status "Installing frontend dependencies..."
    npm install --silent
    print_status "Starting web frontend on port 5173..."
    npm run dev &
    WEB_PID=$!
    cd ..
    
    # Wait for web to be ready
    wait_for_service 5173 "Web Frontend"
fi

# Start Mobile App
print_info "Starting Mobile App..."
if ! check_port 5174 "Mobile App"; then
    cd caseflow-mobile
    print_status "Installing mobile dependencies..."
    npm install --silent
    print_status "Starting mobile app on port 5174..."
    npm run dev:port &
    MOBILE_PID=$!
    cd ..
    
    # Wait for mobile to be ready
    wait_for_service 5174 "Mobile App"
fi

# Display status
echo ""
echo "🎉 All CaseFlow services are now running!"
echo "========================================"
print_status "Backend API:    http://localhost:3000"
print_status "Web Frontend:   http://localhost:5173"
print_status "Mobile App:     http://localhost:5174"
print_status "PostgreSQL:     localhost:5432"
print_status "Redis:          localhost:6379"
echo ""
print_info "Press Ctrl+C to stop all services"
echo ""

# Keep the script running and show logs
print_status "Monitoring services... (Press Ctrl+C to stop all)"

# Wait for all background jobs
wait
