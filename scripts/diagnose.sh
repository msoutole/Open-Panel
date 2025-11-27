#!/bin/bash

################################################################################
# Open-Panel Diagnostic Script
# Coleta informações detalhadas para troubleshooting
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

source "$SCRIPT_DIR/config.sh"
source "$SCRIPT_DIR/lib/common.sh"

print_section "🔍 Open-Panel Diagnostics Report"

# Sistema
print_subsection "System Information"
echo "OS: $(uname -s) $(uname -r)"
echo "Arch: $(uname -m)"
echo "Cores: $(nproc)"
echo "Memory: $(free -h | grep "^Mem" | awk '{print $2}')"
echo "Uptime: $(uptime -p)"

# Disco
print_subsection "Disk Usage"
df -h "$PROJECT_ROOT" | tail -1

# Docker
print_subsection "Docker Status"
if is_docker_running; then
    echo "Docker: $(docker --version)"
    echo "Compose: $(docker-compose --version)"
    echo "Containers: $(docker ps -a | wc -l)"
    echo "Images: $(docker images | wc -l)"

    # Container details
    for container in "${CONTAINERS_MAIN[@]}"; do
        status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
        health=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "N/A")
        echo "  $container: $status ($health)"
    done
else
    echo "Docker: NOT RUNNING"
fi

# Node & npm
print_subsection "Runtime"
echo "Node: $(node --version 2>/dev/null || echo 'Not installed')"
echo "npm: $(npm --version 2>/dev/null || echo 'Not installed')"
echo "Git: $(git --version 2>/dev/null || echo 'Not installed')"

# Portas
print_subsection "Network Ports"
for port in $PORT_WEB $PORT_API $PORT_POSTGRES $PORT_REDIS; do
    if (echo >/dev/tcp/localhost/$port) 2>/dev/null; then
        echo "  Port $port: Open"
    else
        echo "  Port $port: Closed"
    fi
done

# Logs recentes
print_subsection "Recent Logs (últimas 20 linhas)"
if [ -f "$LOG_FILE" ]; then
    tail -20 "$LOG_FILE"
else
    echo "No logs found"
fi

# Arquivo completo para export
report_file="diagnostic-report-$(date +%Y%m%d-%H%M%S).txt"
{
    echo "=== Open-Panel Diagnostic Report ==="
    date
    echo ""
    echo "System: $(uname -s) $(uname -r)"
    echo "Project: $PROJECT_ROOT"
    docker ps -a
    docker images
    echo ""
    echo "=== Docker logs (postgres) ==="
    docker logs --tail 30 "$CONTAINER_POSTGRES" 2>/dev/null
    echo ""
    echo "=== Docker logs (redis) ==="
    docker logs --tail 30 "$CONTAINER_REDIS" 2>/dev/null
} > "$report_file"

print_success "Report saved: $report_file"
log_info "Diagnostics completed"
