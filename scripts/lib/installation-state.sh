#!/bin/bash

################################################################################
# Sistema de Gerenciamento de Estado de Instalação
#
# Este módulo gerencia o estado da instalação do SOU+SER by SOULLABS,
# permitindo execuções idempotentes e rastreamento de progresso.
################################################################################

STATE_FILE=".openpanel.state"
STATE_LOCK_FILE=".openpanel.state.lock"

##
# Verifica se jq está instalado (necessário para JSON)
#
ensure_jq() {
    if ! command -v jq >/dev/null 2>&1; then
        log_info "Instalando jq para gerenciamento de estado..."

        if command_exists apt-get; then
            sudo apt-get update && sudo apt-get install -y jq
        elif command_exists brew; then
            brew install jq
        elif command_exists dnf; then
            sudo dnf install -y jq
        elif command_exists pacman; then
            sudo pacman -S --noconfirm jq
        else
            log_warn "Não foi possível instalar jq. Estado será gerenciado em texto simples."
            return 1
        fi
    fi
    return 0
}

##
# Inicializa arquivo de estado
#
init_installation_state() {
    if [ ! -f "$STATE_FILE" ]; then
        if ensure_jq; then
            cat > "$STATE_FILE" <<EOF
{
  "installation_started": "$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)",
  "installation_completed": false,
  "installation_count": 1,
  "last_run": "$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)",
  "dependencies_installed": false,
  "docker_services_healthy": false,
  "database_initialized": false,
  "admin_created": false,
  "credentials_generated": false
}
EOF
        else
            # Fallback para formato texto simples
            cat > "$STATE_FILE" <<EOF
installation_started=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)
installation_completed=false
installation_count=1
last_run=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)
dependencies_installed=false
docker_services_healthy=false
database_initialized=false
admin_created=false
credentials_generated=false
EOF
        fi
        log_info "Estado de instalação inicializado"
    else
        # Incrementar contador de execuções
        if ensure_jq && jq empty "$STATE_FILE" 2>/dev/null; then
            local count=$(jq -r '.installation_count // 1' "$STATE_FILE")
            count=$((count + 1))
            local tmp_file="${STATE_FILE}.tmp"
            jq ".installation_count = $count | .last_run = \"$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)\"" "$STATE_FILE" > "$tmp_file"
            mv "$tmp_file" "$STATE_FILE"
            log_info "Execução #$count detectada"
        else
            # Fallback para texto simples
            local count=$(grep "installation_count=" "$STATE_FILE" | cut -d'=' -f2)
            count=$((count + 1))
            sed -i.bak "s/installation_count=.*/installation_count=$count/" "$STATE_FILE" 2>/dev/null || \
                sed -i "" "s/installation_count=.*/installation_count=$count/" "$STATE_FILE" 2>/dev/null
            sed -i.bak "s/last_run=.*/last_run=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)/" "$STATE_FILE" 2>/dev/null || \
                sed -i "" "s/last_run=.*/last_run=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)/" "$STATE_FILE" 2>/dev/null
            rm -f "${STATE_FILE}.bak"
            log_info "Execução #$count detectada"
        fi
    fi
}

##
# Atualiza estado de uma etapa
#
update_state() {
    local key="$1"
    local value="$2"

    if ensure_jq && jq empty "$STATE_FILE" 2>/dev/null; then
        local tmp_file="${STATE_FILE}.tmp"
        jq ".$key = $value" "$STATE_FILE" > "$tmp_file"
        mv "$tmp_file" "$STATE_FILE"
    else
        # Fallback para texto simples
        if grep -q "^${key}=" "$STATE_FILE"; then
            sed -i.bak "s/^${key}=.*/${key}=$value/" "$STATE_FILE" 2>/dev/null || \
                sed -i "" "s/^${key}=.*/${key}=$value/" "$STATE_FILE" 2>/dev/null
        else
            echo "${key}=$value" >> "$STATE_FILE"
        fi
        rm -f "${STATE_FILE}.bak"
    fi

    log_debug "Estado atualizado: $key = $value"
}

##
# Verifica se etapa já foi concluída
#
is_step_completed() {
    local key="$1"

    if [ ! -f "$STATE_FILE" ]; then
        return 1
    fi

    if ensure_jq && jq empty "$STATE_FILE" 2>/dev/null; then
        local value=$(jq -r ".$key // false" "$STATE_FILE")
        [ "$value" = "true" ]
    else
        # Fallback para texto simples
        if grep -q "^${key}=true" "$STATE_FILE"; then
            return 0
        else
            return 1
        fi
    fi
}

##
# Marca instalação como concluída
#
mark_installation_complete() {
    update_state "installation_completed" "true"

    if ensure_jq && jq empty "$STATE_FILE" 2>/dev/null; then
        local tmp_file="${STATE_FILE}.tmp"
        jq ".completed_at = \"$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)\"" "$STATE_FILE" > "$tmp_file"
        mv "$tmp_file" "$STATE_FILE"
    else
        echo "completed_at=$(date -Iseconds 2>/dev/null || date +%Y-%m-%dT%H:%M:%S)" >> "$STATE_FILE"
    fi

    log_info "Instalação marcada como concluída"
}

##
# Reseta o estado de instalação (usar com cuidado)
#
reset_installation_state() {
    if [ -f "$STATE_FILE" ]; then
        backup_file "$STATE_FILE"
        rm -f "$STATE_FILE"
        log_warn "Estado de instalação resetado"
    fi
}

##
# Exibe o estado atual
#
show_installation_state() {
    if [ ! -f "$STATE_FILE" ]; then
        echo "Nenhum estado de instalação encontrado"
        return
    fi

    if ensure_jq && jq empty "$STATE_FILE" 2>/dev/null; then
        echo "Estado de Instalação:"
        jq . "$STATE_FILE"
    else
        echo "Estado de Instalação:"
        cat "$STATE_FILE"
    fi
}
