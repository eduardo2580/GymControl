#!/usr/bin/env bash
# Gera uma chave aleatória adequada para JWT_SECRET (≥ 256 bits, base64-safe).
# Uso: scripts/gen-jwt-secret.sh
set -euo pipefail

if ! command -v openssl >/dev/null 2>&1; then
  echo "openssl não encontrado. Instale OpenSSL e tente de novo." >&2
  exit 1
fi

# 48 bytes ~> 64 caracteres base64 (sem padding curto)
openssl rand -base64 48 | tr -d '\n'
echo
