#!/bin/bash

# CRM E2E Test Runner Script
# Comprehensive test execution with environment setup and reporting

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
TEST_ENV=${TEST_ENV:-"local"}
BROWSER=${BROWSER:-"chromium"}
HEADLESS=${HEADLESS:-"true"}
WORKERS=${WORKERS:-"4"}
RETRIES=${RETRIES:-"1"}

echo -e "${BLUE}🚀 Starting CRM E2E Test Suite${NC}"
echo -e "${BLUE}Environment: ${TEST_ENV}${NC}"
echo -e "${BLUE}Browser: ${BROWSER}${NC}"
echo -e "${BLUE}Headless: ${HEADLESS}${NC}"

# Function to print section headers
print_section() {
    echo -e "\n${BLUE}=== $1 ===${NC}"
}

# Function to check if service is running
check_service() {
    local url=$1
    local name=$2
    local max_attempts=30
    local attempt=1

    echo -e "${YELLOW}Checking ${name} at ${url}...${NC}"
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -f "$url" > /dev/null 2>&1; then
            echo -e "${GREEN}✅ ${name} is running${NC}"
            return 0
        fi
        
        echo -e "${YELLOW}⏳ Waiting for ${name} (attempt ${attempt}/${max_attempts})...${NC}"
        sleep 2
        ((attempt++))
    done
    
    echo -e "${RED}❌ ${name} is not responding after ${max_attempts} attempts${NC}"
    return 1
}

# Function to setup test environment
setup_environment() {
    print_section "Environment Setup"
    
    # Create test directories
    mkdir -p test-results/{screenshots,videos,traces,downloads,html-report,allure-results}
    mkdir -p tests/{auth,fixtures/generated}
    
    # Set environment variables based on test environment
    case $TEST_ENV in
        "local")
            export PLAYWRIGHT_BASE_URL="http://localhost:3001"
            export PLAYWRIGHT_API_URL="http://localhost:3000"
            export TEST_DATABASE_URL="postgresql://test:test@localhost:5432/crm_test"
            export TEST_REDIS_URL="redis://localhost:6379/1"
            ;;
        "staging")
            export PLAYWRIGHT_BASE_URL="https://crm-staging.example.com"
            export PLAYWRIGHT_API_URL="https://api-staging.example.com"
            ;;
        "production")
            export PLAYWRIGHT_BASE_URL="https://crm.example.com"
            export PLAYWRIGHT_API_URL="https://api.example.com"
            ;;
    esac
    
    echo -e "${GREEN}✅ Environment configured for ${TEST_ENV}${NC}"
}

# Function to start local services
start_local_services() {
    if [ "$TEST_ENV" = "local" ]; then
        print_section "Starting Local Services"
        
        # Check if services are already running
        if check_service "$PLAYWRIGHT_API_URL/api/health" "Backend API"; then
            echo -e "${GREEN}Backend is already running${NC}"
        else
            echo -e "${YELLOW}Starting backend service...${NC}"
            cd ../CRM-BACKEND
            npm run dev &
            BACKEND_PID=$!
            cd ../CRM-FRONTEND
            echo $BACKEND_PID > .backend.pid
        fi
        
        if check_service "$PLAYWRIGHT_BASE_URL" "Frontend App"; then
            echo -e "${GREEN}Frontend is already running${NC}"
        else
            echo -e "${YELLOW}Starting frontend service...${NC}"
            npm run dev &
            FRONTEND_PID=$!
            echo $FRONTEND_PID > .frontend.pid
        fi
        
        # Wait for services to be ready
        check_service "$PLAYWRIGHT_API_URL/api/health" "Backend API"
        check_service "$PLAYWRIGHT_BASE_URL" "Frontend App"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_section "Installing Dependencies"
    
    # Install Playwright browsers if needed
    if [ ! -d "$HOME/.cache/ms-playwright" ] || [ "$FORCE_BROWSER_INSTALL" = "true" ]; then
        echo -e "${YELLOW}Installing Playwright browsers...${NC}"
        npx playwright install
        npx playwright install-deps
    else
        echo -e "${GREEN}Playwright browsers already installed${NC}"
    fi
    
    # Install test dependencies
    npm ci
    echo -e "${GREEN}✅ Dependencies installed${NC}"
}

# Function to run specific test suites
run_test_suite() {
    local suite=$1
    local project=${2:-"chromium-desktop"}
    
    print_section "Running ${suite} Tests"
    
    case $suite in
        "smoke")
            npx playwright test --project=$project --grep="@smoke" --reporter=line
            ;;
        "regression")
            npx playwright test --project=$project --grep="@regression" --reporter=line
            ;;
        "mobile")
            npx playwright test --project=mobile-chrome mobile-*.spec.ts --reporter=line
            ;;
        "api")
            npx playwright test --project=api-tests api-*.spec.ts --reporter=line
            ;;
        "accessibility")
            npx playwright test --project=accessibility accessibility-*.spec.ts --reporter=line
            ;;
        "performance")
            npx playwright test --project=slow-network performance-*.spec.ts --reporter=line
            ;;
        "full")
            npx playwright test --workers=$WORKERS --retries=$RETRIES
            ;;
        *)
            npx playwright test $suite --project=$project --reporter=line
            ;;
    esac
}

# Function to generate reports
generate_reports() {
    print_section "Generating Test Reports"
    
    # Generate HTML report
    if [ -f "test-results/test-results.json" ]; then
        npx playwright show-report --host=0.0.0.0 &
        REPORT_PID=$!
        echo $REPORT_PID > .report.pid
        echo -e "${GREEN}📊 HTML report available at: http://localhost:9323${NC}"
    fi
    
    # Generate Allure report if allure is available
    if command -v allure &> /dev/null; then
        echo -e "${YELLOW}Generating Allure report...${NC}"
        allure generate test-results/allure-results -o test-results/allure-report --clean
        echo -e "${GREEN}📊 Allure report generated at: test-results/allure-report${NC}"
    fi
    
    # Generate custom summary
    node -e "
        const fs = require('fs');
        if (fs.existsSync('test-results/test-results.json')) {
            const results = JSON.parse(fs.readFileSync('test-results/test-results.json', 'utf8'));
            console.log('\\n📊 Test Results Summary:');
            console.log('Total Tests:', results.stats.total);
            console.log('Passed:', results.stats.passed);
            console.log('Failed:', results.stats.failed);
            console.log('Skipped:', results.stats.skipped);
            console.log('Duration:', Math.round(results.stats.duration / 1000) + 's');
            console.log('Success Rate:', Math.round((results.stats.passed / results.stats.total) * 100) + '%');
        }
    "
}

# Function to cleanup processes
cleanup() {
    print_section "Cleanup"
    
    # Kill background processes
    if [ -f ".backend.pid" ]; then
        kill $(cat .backend.pid) 2>/dev/null || true
        rm .backend.pid
    fi
    
    if [ -f ".frontend.pid" ]; then
        kill $(cat .frontend.pid) 2>/dev/null || true
        rm .frontend.pid
    fi
    
    if [ -f ".report.pid" ]; then
        kill $(cat .report.pid) 2>/dev/null || true
        rm .report.pid
    fi
    
    echo -e "${GREEN}✅ Cleanup completed${NC}"
}

# Function to show help
show_help() {
    echo "CRM E2E Test Runner"
    echo ""
    echo "Usage: $0 [OPTIONS] [TEST_SUITE]"
    echo ""
    echo "Test Suites:"
    echo "  smoke         - Quick smoke tests"
    echo "  regression    - Full regression suite"
    echo "  mobile        - Mobile-specific tests"
    echo "  api           - API tests only"
    echo "  accessibility - Accessibility tests"
    echo "  performance   - Performance tests"
    echo "  full          - Complete test suite (default)"
    echo "  [filename]    - Run specific test file"
    echo ""
    echo "Options:"
    echo "  --env=ENV           Test environment (local|staging|production)"
    echo "  --browser=BROWSER   Browser to use (chromium|firefox|webkit)"
    echo "  --headless=BOOL     Run in headless mode (true|false)"
    echo "  --workers=NUM       Number of parallel workers"
    echo "  --retries=NUM       Number of retries for failed tests"
    echo "  --debug             Run in debug mode"
    echo "  --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 smoke --browser=firefox"
    echo "  $0 case-workflow.spec.ts --headless=false"
    echo "  $0 full --env=staging --workers=2"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env=*)
            TEST_ENV="${1#*=}"
            shift
            ;;
        --browser=*)
            BROWSER="${1#*=}"
            shift
            ;;
        --headless=*)
            HEADLESS="${1#*=}"
            shift
            ;;
        --workers=*)
            WORKERS="${1#*=}"
            shift
            ;;
        --retries=*)
            RETRIES="${1#*=}"
            shift
            ;;
        --debug)
            export DEBUG=1
            HEADLESS="false"
            shift
            ;;
        --help)
            show_help
            exit 0
            ;;
        *)
            TEST_SUITE="$1"
            shift
            ;;
    esac
done

# Set default test suite
TEST_SUITE=${TEST_SUITE:-"full"}

# Trap cleanup function on script exit
trap cleanup EXIT

# Main execution
main() {
    setup_environment
    install_dependencies
    start_local_services
    
    # Run tests
    echo -e "\n${BLUE}🧪 Running ${TEST_SUITE} test suite...${NC}"
    
    if run_test_suite "$TEST_SUITE" "$BROWSER-desktop"; then
        echo -e "\n${GREEN}✅ Tests completed successfully!${NC}"
        EXIT_CODE=0
    else
        echo -e "\n${RED}❌ Tests failed!${NC}"
        EXIT_CODE=1
    fi
    
    generate_reports
    
    exit $EXIT_CODE
}

# Run main function
main
