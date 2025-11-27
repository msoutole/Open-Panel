#!/bin/bash

################################################################################
# Open-Panel Status Check Script for Linux/macOS
#
# Verificação detalhada de status de todos os serviços com múltiplas dimensões:
# - Status dos containers
# - Health status
# - Uso de recursos (CPU, Memory)
# - Disponibilidade de portas
# - Endpoints HTTP
# - Espaço em disco
#
# Uso: ./scripts/status/check-status.sh [options]
# Opções:
#   --json              Output em JSON
#   --csv               Output em CSV
#   --html              Gera relatório HTML
#   --watch             Monitor contínuo (refresh a cada 5s)
#   --verbose           Output detalhado
#   --help              Exibe ajuda
################################################################################

set -o pipefail

# ============================================================================
# CONFIGURAÇÃO INICIAL
# ============================================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_ROOT"

# Carregar configurações e utilitários
source "$SCRIPT_DIR/../config.sh"
source "$SCRIPT_DIR/../lib/common.sh"

# Variáveis do script
OUTPUT_FORMAT="text"  # text, json, csv, html
WATCH_MODE=false
VERBOSE_MODE=false

# ============================================================================
# PARSE ARGUMENTOS
# ============================================================================

while [[ $# -gt 0 ]]; do
    case $1 in
        --json) OUTPUT_FORMAT="json"; shift ;;
        --csv) OUTPUT_FORMAT="csv"; shift ;;
        --html) OUTPUT_FORMAT="html"; shift ;;
        --watch) WATCH_MODE=true; shift ;;
        --verbose) VERBOSE_MODE=true; shift ;;
        --help)
            echo "Uso: $0 [options]"
            echo "Opções:"
            echo "  --json      Output em formato JSON"
            echo "  --csv       Output em formato CSV"
            echo "  --html      Gera relatório HTML"
            echo "  --watch     Monitor contínuo (refresh a cada 5s)"
            echo "  --verbose   Output detalhado"
            echo "  --help      Exibe esta ajuda"
            exit 0
            ;;
        *)
            log_error "Opção desconhecida: $1"
            exit 1
            ;;
    esac
done

# ============================================================================
# ESTRUTURAS DE DADOS PARA COLETA
# ============================================================================

declare -A CONTAINER_STATUS
declare -A CONTAINER_HEALTH
declare -A CONTAINER_CPU
declare -A CONTAINER_MEMORY
declare -A PORT_STATUS
declare -A ENDPOINT_STATUS

# ============================================================================
# FUNÇÕES DE COLETA DE DADOS
# ============================================================================

collect_container_data() {
    log_debug "Coletando dados dos containers..."

    for container in "${CONTAINERS_MAIN[@]}"; do
        # Status
        CONTAINER_STATUS[$container]=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not found")

        # Health
        CONTAINER_HEALTH[$container]=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no healthcheck")

        # CPU e Memory (se rodando)
        if [ "${CONTAINER_STATUS[$container]}" = "running" ]; then
            local stats=$(docker stats --no-stream "$container" 2>/dev/null | tail -n 1)
            CONTAINER_CPU[$container]=$(echo "$stats" | awk '{print $3}')
            CONTAINER_MEMORY[$container]=$(echo "$stats" | awk '{print $4}')
        else
            CONTAINER_CPU[$container]="N/A"
            CONTAINER_MEMORY[$container]="N/A"
        fi

        log_debug "Container $container: ${CONTAINER_STATUS[$container]}, Health: ${CONTAINER_HEALTH[$container]}"
    done
}

check_ports() {
    log_debug "Verificando portas..."

    local ports=($PORT_WEB $PORT_API $PORT_TRAEFIK_DASHBOARD $PORT_POSTGRES $PORT_REDIS)
    local port_names=("Web" "API" "Traefik" "PostgreSQL" "Redis")

    for i in "${!ports[@]}"; do
        local port=${ports[$i]}
        local name=${port_names[$i]}

        if command_exists nc; then
            if nc -z localhost "$port" 2>/dev/null; then
                PORT_STATUS[$port]="✓ Open"
            else
                PORT_STATUS[$port]="✗ Closed"
            fi
        else
            # Fallback: usar bash
            if (echo >/dev/tcp/localhost/$port) 2>/dev/null; then
                PORT_STATUS[$port]="✓ Open"
            else
                PORT_STATUS[$port]="✗ Closed"
            fi
        fi
    done
}

check_endpoints() {
    log_debug "Verificando endpoints HTTP..."

    # Health endpoint
    if curl -sf "$API_HEALTH_ENDPOINT" >/dev/null 2>&1; then
        ENDPOINT_STATUS["health"]="✓ OK"
    else
        ENDPOINT_STATUS["health"]="✗ Unavailable"
    fi

    # Auth status endpoint
    if curl -sf "$API_AUTH_STATUS_ENDPOINT" >/dev/null 2>&1; then
        ENDPOINT_STATUS["auth"]="✓ OK"
    else
        ENDPOINT_STATUS["auth"]="✗ Unavailable"
    fi

    # Web interface
    if curl -sf "$URL_WEB" >/dev/null 2>&1; then
        ENDPOINT_STATUS["web"]="✓ OK"
    else
        ENDPOINT_STATUS["web"]="✗ Unavailable"
    fi
}

check_disk_usage() {
    log_debug "Verificando uso de disco..."

    if command_exists df; then
        df -BG "$PROJECT_ROOT" | tail -n 1
    fi
}

check_docker_status() {
    log_debug "Verificando Docker daemon..."

    if is_docker_running; then
        docker info --format='{{.Containers}} containers, {{.Images}} images' 2>/dev/null || echo "Running"
    else
        echo "Not running"
    fi
}

# ============================================================================
# FUNÇÕES DE OUTPUT
# ============================================================================

print_text_format() {
    print_section "📊 Open-Panel Status Report"

    print_subsection "🐳 Docker Daemon"
    local docker_status=$(check_docker_status)
    if is_docker_running; then
        print_success "Docker: $docker_status"
    else
        print_error "Docker: $docker_status"
    fi

    print_subsection "📦 Containers"
    printf "%-25s %-15s %-15s %-10s %-10s\n" "Container" "Status" "Health" "CPU" "Memory"
    printf "%-25s %-15s %-15s %-10s %-10s\n" "─────────────────────────" "─────────────────" "─────────────────" "──────────" "──────────"

    for container in "${CONTAINERS_MAIN[@]}"; do
        local status=${CONTAINER_STATUS[$container]}
        local health=${CONTAINER_HEALTH[$container]}
        local cpu=${CONTAINER_CPU[$container]:-N/A}
        local memory=${CONTAINER_MEMORY[$container]:-N/A}

        # Colorize status
        local status_display="$status"
        if [ "$status" = "running" ]; then
            status_display="${COLOR_GREEN}$status${COLOR_NC}"
        else
            status_display="${COLOR_RED}$status${COLOR_NC}"
        fi

        local health_display="$health"
        if [ "$health" = "healthy" ]; then
            health_display="${COLOR_GREEN}✓ $health${COLOR_NC}"
        elif [ "$health" = "no healthcheck" ]; then
            health_display="${COLOR_GRAY}$health${COLOR_NC}"
        else
            health_display="${COLOR_YELLOW}⚠ $health${COLOR_NC}"
        fi

        printf "%-25s %-15s %-15s %-10s %-10s\n" "$container" "$status_display" "$health_display" "$cpu" "$memory"
    done

    print_subsection "🔌 Network Ports"
    for port in $PORT_WEB $PORT_API $PORT_TRAEFIK_DASHBOARD; do
        local port_name=""
        case $port in
            $PORT_WEB) port_name="Web UI" ;;
            $PORT_API) port_name="API" ;;
            $PORT_TRAEFIK_DASHBOARD) port_name="Traefik" ;;
        esac
        echo -n "  Port $port ($port_name): "
        if [[ "${PORT_STATUS[$port]}" == *"Open"* ]]; then
            print_success "${PORT_STATUS[$port]}"
        else
            print_error "${PORT_STATUS[$port]}"
        fi
    done

    print_subsection "🌐 Endpoints"
    for endpoint in "health" "auth" "web"; do
        local status=${ENDPOINT_STATUS[$endpoint]}
        echo -n "  $endpoint: "
        if [[ "$status" == *"✓"* ]]; then
            print_success "$status"
        else
            print_warn "$status"
        fi
    done

    print_subsection "💾 Disk Usage"
    local disk_info=$(check_disk_usage)
    echo "  $disk_info"

    print_subsection "📍 Access Information"
    echo "  Web Interface:  ${COLOR_CYAN}http://localhost:${PORT_WEB}${COLOR_NC}"
    echo "  API:            ${COLOR_CYAN}http://localhost:${PORT_API}${COLOR_NC}"
    echo "  Traefik:        ${COLOR_CYAN}http://localhost:${PORT_TRAEFIK_DASHBOARD}${COLOR_NC}"

    # Sumário final
    print_subsection "✅ Summary"
    local running_count=$(docker ps --quiet 2>/dev/null | wc -l)
    echo "  Running containers: $running_count / ${#CONTAINERS_MAIN[@]}"

    local healthy_count=0
    for container in "${CONTAINERS_MAIN[@]}"; do
        if [ "${CONTAINER_HEALTH[$container]}" = "healthy" ]; then
            ((healthy_count++))
        fi
    done
    echo "  Healthy containers: $healthy_count / ${#CONTAINERS_MAIN[@]}"
}

print_json_format() {
    local json='{
  "timestamp": "'$(date -Iseconds)'",
  "docker": {
    "running": '$(is_docker_running && echo "true" || echo "false")'
  },
  "containers": {'

    local first=true
    for container in "${CONTAINERS_MAIN[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            json="$json,"
        fi

        json="$json
    \"$container\": {
      \"status\": \"${CONTAINER_STATUS[$container]}\",
      \"health\": \"${CONTAINER_HEALTH[$container]}\",
      \"cpu\": \"${CONTAINER_CPU[$container]}\",
      \"memory\": \"${CONTAINER_MEMORY[$container]}\"
    }"
    done

    json="$json
  },
  "ports": {"

    local port_list=($PORT_WEB $PORT_API $PORT_TRAEFIK_DASHBOARD $PORT_POSTGRES $PORT_REDIS)
    local first=true
    for port in "${port_list[@]}"; do
        if [ "$first" = true ]; then
            first=false
        else
            json="$json,"
        fi
        json="$json
    \"$port\": \"${PORT_STATUS[$port]}\"
    "
    done

    json="$json
  },
  "endpoints": {"

    local first=true
    for endpoint in "health" "auth" "web"; do
        if [ "$first" = true ]; then
            first=false
        else
            json="$json,"
        fi
        json="$json
    \"$endpoint\": \"${ENDPOINT_STATUS[$endpoint]}\"
    "
    done

    json="$json
  }
}"

    echo "$json" | jq . 2>/dev/null || echo "$json"
}

print_csv_format() {
    echo "Container,Status,Health,CPU,Memory"
    for container in "${CONTAINERS_MAIN[@]}"; do
        echo "$container,${CONTAINER_STATUS[$container]},${CONTAINER_HEALTH[$container]},${CONTAINER_CPU[$container]},${CONTAINER_MEMORY[$container]}"
    done
}

print_html_format() {
    local timestamp=$(date)
    local html="<!DOCTYPE html>
<html>
<head>
    <meta charset=\"UTF-8\">
    <title>Open-Panel Status Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        h1 { color: #333; border-bottom: 3px solid #007bff; padding-bottom: 10px; }
        h2 { color: #007bff; margin-top: 30px; }
        table { border-collapse: collapse; width: 100%; background-color: white; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        th { background-color: #007bff; color: white; padding: 12px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #ddd; }
        tr:hover { background-color: #f9f9f9; }
        .healthy { color: #28a745; font-weight: bold; }
        .unhealthy { color: #dc3545; font-weight: bold; }
        .unknown { color: #ffc107; font-weight: bold; }
        .info-box { background-color: #e7f3ff; border-left: 4px solid #007bff; padding: 12px; margin: 10px 0; }
    </style>
</head>
<body>
    <h1>🚀 Open-Panel Status Report</h1>
    <p><strong>Generated:</strong> $timestamp</p>

    <div class=\"info-box\">
        <strong>Docker Status:</strong> $(is_docker_running && echo "✓ Running" || echo "✗ Not Running")
    </div>

    <h2>📦 Containers Status</h2>
    <table>
        <tr>
            <th>Container</th>
            <th>Status</th>
            <th>Health</th>
            <th>CPU</th>
            <th>Memory</th>
        </tr>"

    for container in "${CONTAINERS_MAIN[@]}"; do
        local health_class="unknown"
        [ "${CONTAINER_HEALTH[$container]}" = "healthy" ] && health_class="healthy"
        [ "${CONTAINER_HEALTH[$container]}" = "unhealthy" ] && health_class="unhealthy"

        html="$html
        <tr>
            <td>$container</td>
            <td>${CONTAINER_STATUS[$container]}</td>
            <td class=\"$health_class\">${CONTAINER_HEALTH[$container]}</td>
            <td>${CONTAINER_CPU[$container]}</td>
            <td>${CONTAINER_MEMORY[$container]}</td>
        </tr>"
    done

    html="$html
    </table>

    <h2>🔌 Network Ports</h2>
    <table>
        <tr><th>Port</th><th>Service</th><th>Status</th></tr>
        <tr><td>$PORT_WEB</td><td>Web UI</td><td>${PORT_STATUS[$PORT_WEB]}</td></tr>
        <tr><td>$PORT_API</td><td>API</td><td>${PORT_STATUS[$PORT_API]}</td></tr>
        <tr><td>$PORT_TRAEFIK_DASHBOARD</td><td>Traefik</td><td>${PORT_STATUS[$PORT_TRAEFIK_DASHBOARD]}</td></tr>
    </table>

    <h2>🌐 Endpoints</h2>
    <table>
        <tr><th>Endpoint</th><th>Status</th></tr>
        <tr><td>API Health</td><td>${ENDPOINT_STATUS[health]}</td></tr>
        <tr><td>Auth Status</td><td>${ENDPOINT_STATUS[auth]}</td></tr>
        <tr><td>Web Interface</td><td>${ENDPOINT_STATUS[web]}</td></tr>
    </table>

    <h2>💾 System Information</h2>
    <div class=\"info-box\">
        <p><strong>Disk Usage:</strong><br>$(check_disk_usage | sed 's/</\&lt;/g; s/>/\&gt;/g')</p>
    </div>
</body>
</html>"

    echo "$html" > "status-report-$(date +%Y%m%d-%H%M%S).html"
    print_success "HTML report saved: status-report-$(date +%Y%m%d-%H%M%S).html"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================

if [ "$WATCH_MODE" = true ]; then
    while true; do
        clear
        collect_container_data
        check_ports
        check_endpoints
        print_text_format
        echo ""
        echo "Press Ctrl+C to stop. Refreshing in 5 seconds..."
        sleep 5
    done
else
    # Single run
    collect_container_data
    check_ports
    check_endpoints

    case "$OUTPUT_FORMAT" in
        json) print_json_format ;;
        csv) print_csv_format ;;
        html) print_html_format ;;
        *) print_text_format ;;
    esac

    log_info "Status check completed"
fi