#!/bin/bash

# Script de configuración automática para Nexus Access
# Este script debe ejecutarse con sudo

if [[ $EUID -ne 0 ]]; then
   echo "Este script debe ejecutarse con sudo o como root" 
   exit 1
fi

echo "========================================"
echo "   CONFIGURADOR DE SERVIDOR - NEXUS"
echo "========================================"

# Detectar servidor deseado
echo "Seleccione el servidor que desea configurar:"
echo "1) Apache"
echo "2) Nginx"
read -p "Opción [1-2]: " choice

SERVER_TYPE="apache"
if [[ "$choice" == "2" ]]; then
    SERVER_TYPE="nginx"
fi

echo "[+] Instalando $SERVER_TYPE..."
apt update
if [[ "$SERVER_TYPE" == "apache" ]]; then
    apt install -y apache2
    # Habilitar módulos necesarios
    a2enmod proxy proxy_http rewrite headers
else
    apt install -y nginx
fi

# Obtener la ruta del script y del proyecto
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# 1. Configurar el servicio Systemd
echo "[+] Configurando servicio systemd (filemanager.service)..."
if [[ -f "$SCRIPT_DIR/filemanager.service" ]]; then
    cp "$SCRIPT_DIR/filemanager.service" /etc/systemd/system/filemanager.service
    systemctl daemon-reload
    systemctl enable filemanager
    systemctl restart filemanager
    echo "    - Servicio filemanager iniciado y habilitado."
else
    echo "    [!] Error: No se encontró $SCRIPT_DIR/filemanager.service. Ejecute install.py primero."
    exit 1
fi

# 2. Configurar el Servidor Web
if [[ "$SERVER_TYPE" == "apache" ]]; then
    echo "[+] Configurando Apache..."
    if [[ -f "$SCRIPT_DIR/filemanager-apache.conf" ]]; then
        cp "$SCRIPT_DIR/filemanager-apache.conf" /etc/apache2/sites-available/filemanager.conf
        a2ensite filemanager.conf
        systemctl restart apache2
        echo "    - Apache configurado y reiniciado."
    else
        echo "    [!] Error: No se encontró setup/filemanager-apache.conf"
    fi
else
    echo "[+] Configurando Nginx..."
    if [[ -f "$SCRIPT_DIR/filemanager-nginx.conf" ]]; then
        cp "$SCRIPT_DIR/filemanager-nginx.conf" /etc/nginx/sites-available/filemanager
        ln -sf /etc/nginx/sites-available/filemanager /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        nginx -t && systemctl restart nginx
        echo "    - Nginx configurado y reiniciado."
    else
        echo "    [!] Error: No se encontró setup/filemanager-nginx.conf"
    fi
fi

echo "========================================"
echo "   CONFIGURACIÓN COMPLETADA"
echo "========================================"
echo "La aplicación debería estar disponible en su dominio/IP."
echo "Estado del servicio: systemctl status nexus"
