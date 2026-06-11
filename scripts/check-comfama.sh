#!/bin/bash
# Script para verificar si las preinscripciones de Comfama han cambiado de estado.
# Si el estado cambia (o ya no dice "Preinscripciones cerradas"), el script termina con código 1,
# lo que hace fallar el Github Action y envía una notificación por correo.
#
# Para evitar el bloqueo de Radware Bot Manager, se consume la página a través del proxy de Google Translate.

URL="https://www-comfama-com.translate.goog/aprendizaje/primera-infancia/preescolares/?_x_tr_sl=es&_x_tr_tl=en"
USER_AGENT="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

echo "Descargando contenido a través del proxy de Google Translate..."
content=$(curl -sL -A "$USER_AGENT" "$URL")

if [ -z "$content" ]; then
  echo "Error: No se pudo obtener respuesta de la URL (contenido vacío)."
  exit 0 # Evitamos falsos positivos si Google Translate falla temporalmente
fi

# Buscamos la frase clave indicativa de que siguen cerradas
if echo "$content" | grep -q "Preinscripciones cerradas"; then
  echo "Estado actual: Preinscripciones cerradas. Todo sigue igual."
  exit 0
else
  echo "¡ALERTA! El texto 'Preinscripciones cerradas' ya no se encuentra en la página."
  echo "Es probable que las inscripciones estén abiertas o el diseño haya cambiado."
  exit 1
fi
