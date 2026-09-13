#!/bin/sh
set -e
: "${WEB_API_URL:=/api/v1}"
printf 'window.__CARTAS_CONFIG__ = { API_URL: "%s" };\n' "$WEB_API_URL" > /usr/share/nginx/html/config.js