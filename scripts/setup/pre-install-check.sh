#!/bin/bash
# ============================================================================
# OpenPanel - Verificação Pré-Instalação
# ============================================================================
# Script para verificar pré-requisitos e problemas comuns antes da instalação
# Identifica portas em uso, permissões, e configurações do sistema
#
# Uso:
#   sudo ./pre-install-check.sh
# ============================================================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

CHECK="${GREEN}✓${NC}"
CROSS="${RED}✗${NC}"
ARROW="${BLUE}➜${NC}"
WARN="${YELLOW}⚠${NC}"
INFO="${CYAN}ℹ${NC}"

ISSUES=0
WARNINGS=0
FIXES=()

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo -e "${CROSS} ${RED}Este script precisa ser executado como root (use sudo)${NC}"
    exit 1
fi

echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}         VERIFICAÇÃO PRÉ-INSTALAÇÃO OPENPANEL${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

# ============================================================================
# VERIFICAÇÕES DO SISTEMA
# ============================================================================

echo -e "${INFO} Verificando sistema operacional..."
if [ -f /etc/os-release ]; then
    . /etc/os-release
    if [ "$ID" = "ubuntu" ] || [ "$ID" = "debian" ]; then
        echo -e "${CHECK} $ID $VERSION_ID - OK"
    else
        echo -e "${CROSS} Sistema não suportado: $ID (use Ubuntu/Debian)"
        ((ISSUES++))
    fi
else
    echo -e "${CROSS} Não foi possível detectar sistema operacional"
    ((ISSUES++))
fi

# ============================================================================
# VERIFICAÇÕES DE PERMISSÕES
# ============================================================================

echo ""
echo -e "${INFO} Verificando permissões..."
if [ "$EUID" -eq 0 ]; then
    echo -e "${CHECK} Executando como root - OK"
else
    echo -e "${CROSS} Não está executando como root"
    ((ISSUES++))
fi

# ============================================================================
# VERIFICAÇÕES DE PACOTES INSTALADOS
# ============================================================================

echo ""
echo -e "${INFO} Verificando pacotes necessários..."

# Docker
if command -v docker >/dev/null 2>&1; then
    DOCKER_VERSION=$(docker --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+')
    echo -e "${CHECK} Docker $DOCKER_VERSION - OK"
else
    echo -e "${CROSS} Docker não instalado"
    ((ISSUES++))
    FIXES+=("Instale Docker: curl -fsSL https://get.docker.com | sh")
fi

# Docker Compose
if command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
    echo -e "${CHECK} Docker Compose - OK"
else
    echo -e "${WARN} Docker Compose pode não estar funcionando"
    ((WARNINGS++))
fi

# Node.js
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node -v | sed 's/v//')
    if [ "$(printf '%s\n' "18.0.0" "$NODE_VERSION" | sort -V | head -n1)" = "18.0.0" ]; then
        echo -e "${CHECK} Node.js $NODE_VERSION - OK"
    else
        echo -e "${CROSS} Node.js $NODE_VERSION muito antigo (mínimo 18.0.0)"
        ((ISSUES++))
        FIXES+=("Atualize Node.js: https://nodejs.org/")
    fi
else
    echo -e "${CROSS} Node.js não instalado"
    ((ISSUES++))
    FIXES+=("Instale Node.js 18+: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -")
fi

# Git
if command -v git >/dev/null 2>&1; then
    echo -e "${CHECK} Git - OK"
else
    echo -e "${CROSS} Git não instalado"
    ((ISSUES++))
    FIXES+=("Instale Git: sudo apt-get install git")
fi

# ============================================================================
# VERIFICAÇÕES DE PORTAS
# ============================================================================

echo ""
echo -e "${INFO} Verificando portas..."

PORTS_TO_CHECK=(
    "53:DNS (necessário para AdGuard Home - opcional)"
    "80:HTTP (necessário para Traefik)"
    "443:HTTPS (necessário para Traefik)"
    "3000:Aplicação Web"
    "3001:API"
    "5432:PostgreSQL"
    "6379:Redis"
    "8080:Dashboard Traefik"
)

PORTS_IN_USE=()

for port_info in "${PORTS_TO_CHECK[@]}"; do
    PORT=$(echo "$port_info" | cut -d: -f1)
    DESC=$(echo "$port_info" | cut -d: -f2-)
    
    if netstat -tuln 2>/dev/null | grep -q ":$PORT " || ss -tuln 2>/dev/null | grep -q ":$PORT "; then
        echo -e "${WARN} Porta $PORT ($DESC) - EM USO"
        PORTS_IN_USE+=("$PORT")
        ((WARNINGS++))
    else
        echo -e "${CHECK} Porta $PORT ($DESC) - Disponível"
    fi
done

# ============================================================================
# VERIFICAÇÕES DE ESPAÇO EM DISCO
# ============================================================================

echo ""
echo -e "${INFO} Verificando espaço em disco..."

AVAILABLE=$(df / | tail -1 | awk '{print $4}')
AVAILABLE_GB=$((AVAILABLE / 1024 / 1024))

if [ "$AVAILABLE_GB" -ge 20 ]; then
    echo -e "${CHECK} Espaço disponível: ${AVAILABLE_GB}GB - OK"
else
    echo -e "${WARN} Espaço disponível: ${AVAILABLE_GB}GB (recomendado: 20GB+)"
    ((WARNINGS++))
fi

# ============================================================================
# VERIFICAÇÕES DE MEMÓRIA
# ============================================================================

echo ""
echo -e "${INFO} Verificando memória..."

MEMORY=$(free -b | awk '/^Mem:/ {print $2}')
MEMORY_GB=$((MEMORY / 1024 / 1024 / 1024))

if [ "$MEMORY_GB" -ge 4 ]; then
    echo -e "${CHECK} Memória disponível: ${MEMORY_GB}GB - OK"
else
    echo -e "${WARN} Memória disponível: ${MEMORY_GB}GB (recomendado: 4GB+)"
    ((WARNINGS++))
fi

# ============================================================================
# VERIFICAÇÕES DE REDE
# ============================================================================

echo ""
echo -e "${INFO} Verificando conectividade..."

if ping -c 1 -W 2 8.8.8.8 >/dev/null 2>&1; then
    echo -e "${CHECK} Conectividade à Internet - OK"
else
    echo -e "${WARN} Sem conectividade à Internet (não bloqueante)"
    ((WARNINGS++))
fi

# ============================================================================
# VERIFICAÇÕES DE DOCKER
# ============================================================================

if command -v docker >/dev/null 2>&1; then
    echo ""
    echo -e "${INFO} Verificando Docker..."
    
    if docker ps >/dev/null 2>&1; then
        echo -e "${CHECK} Docker daemon rodando - OK"
    else
        echo -e "${CROSS} Docker daemon não está rodando"
        ((ISSUES++))
        FIXES+=("Inicie Docker: sudo systemctl start docker")
    fi
    
    # Verificar grupo docker
    if id -nG "$SUDO_USER" 2>/dev/null | grep -q "\bdocker\b"; then
        echo -e "${CHECK} Usuário no grupo docker - OK"
    else
        echo -e "${WARN} Usuário $SUDO_USER não está no grupo docker"
        echo -e "   ${ARROW} Para corrigir: sudo usermod -aG docker $SUDO_USER"
        echo -e "   ${ARROW} Depois faça logout e login novamente"
        ((WARNINGS++))
    fi
fi

# ============================================================================
# VERIFICAÇÕES DE SYSTEMD-RESOLVED
# ============================================================================

echo ""
echo -e "${INFO} Verificando systemd-resolved..."

if systemctl is-active --quiet systemd-resolved 2>/dev/null; then
    echo -e "${WARN} systemd-resolved está ativo (conflita com AdGuard Home na porta 53)"
    ((WARNINGS++))
    FIXES+=("Para instalar AdGuard: scripts/setup/disable-systemd-resolved.sh")
else
    echo -e "${CHECK} systemd-resolved desabilitado ou não instalado"
fi

# ============================================================================
# RESUMO
# ============================================================================

echo ""
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}                           RESUMO${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${NC}"
echo ""

if [ $ISSUES -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ Nenhum problema encontrado! Pronto para instalar.${NC}"
    echo ""
    exit 0
fi

if [ $ISSUES -gt 0 ]; then
    echo -e "${RED}❌ PROBLEMAS ENCONTRADOS: $ISSUES${NC}"
    echo ""
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  AVISOS: $WARNINGS${NC}"
    echo ""
fi

# Mostrar correções sugeridas
if [ ${#FIXES[@]} -gt 0 ]; then
    echo -e "${YELLOW}Sugestões de correção:${NC}"
    for ((i=0; i<${#FIXES[@]}; i++)); do
        echo -e "   $((i+1)). ${FIXES[i]}"
    done
    echo ""
fi

if [ $ISSUES -gt 0 ]; then
    echo -e "${RED}Corrija os problemas acima antes de prosseguir.${NC}"
    exit 1
else
    echo -e "${GREEN}Avisos encontrados, mas pode prosseguir com cautela.${NC}"
    exit 0
fi
