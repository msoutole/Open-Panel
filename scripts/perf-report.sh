#!/bin/bash

################################################################################
# Open-Panel Performance Report
# Monitora e reporta performance dos serviços
################################################################################

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_ROOT"

source "$SCRIPT_DIR/config.sh"
source "$SCRIPT_DIR/lib/common.sh"

print_section "📊 Open-Panel Performance Report"

print_subsection "Container Resource Usage"
docker stats --no-stream 2>/dev/null || {
    log_error "Docker stats não disponível"
    exit 1
}

print_subsection "Container Restart Count"
for container in "${CONTAINERS_MAIN[@]}"; do
    restarts=$(docker inspect --format='{{.RestartCount}}' "$container" 2>/dev/null || echo "0")
    print_info "$container: $restarts restarts"
done

print_subsection "Disk Performance"
if command_exists iostat; then
    iostat -x 1 2 | tail -20
else
    print_warn "iostat not available"
fi

print_subsection "Network Activity"
if command_exists ss; then
    echo "Active connections:"
    ss -tan | grep ESTABLISHED | wc -l
elif command_exists netstat; then
    netstat -tan | grep ESTABLISHED | wc -l
fi

print_subsection "API Response Times"
for endpoint in "$API_HEALTH_ENDPOINT" "$API_AUTH_STATUS_ENDPOINT"; do
    time curl -sf "$endpoint" >/dev/null 2>&1 || print_warn "Endpoint unavailable: $endpoint"
done

print_subsection "Summary"
print_info "Report generated at $(date)"
print_info "Use 'docker stats' for real-time monitoring"

log_info "Performance report completed"
