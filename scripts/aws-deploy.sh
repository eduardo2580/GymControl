#!/usr/bin/env bash
# Build da imagem Docker, push pro ECR e disparo de novo deploy no App Runner.
# Pré-requisitos: docker, aws cli e terraform configurados.
# Uso: scripts/aws-deploy.sh [tag]
#   tag — opcional, default 'latest'.
set -euo pipefail

TAG="${1:-latest}"
INFRA_DIR="$(cd "$(dirname "$0")/.." && pwd)/infra/terraform"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$INFRA_DIR"
ECR_URL=$(terraform output -raw ecr_repository_url)
REGION=$(terraform output -raw -no-color 2>/dev/null || true)
REGION="${REGION:-sa-east-1}"
SERVICE_NAME="$(terraform output -raw -no-color 2>/dev/null && true) gymcontrol-showcase"

echo ">> login no ECR ($ECR_URL)"
aws ecr get-login-password --region "$REGION" \
  | docker login --username AWS --password-stdin "${ECR_URL%/*}"

echo ">> build da imagem"
cd "$REPO_ROOT"
docker build -t "gymcontrol:$TAG" .
docker tag "gymcontrol:$TAG" "$ECR_URL:$TAG"

echo ">> push pro ECR"
docker push "$ECR_URL:$TAG"

echo ">> forçando novo deploy no App Runner"
SERVICE_ARN=$(aws apprunner list-services \
  --region "$REGION" \
  --query "ServiceSummaryList[?ServiceName=='gymcontrol-showcase'].ServiceArn" \
  --output text)

if [ -z "$SERVICE_ARN" ] || [ "$SERVICE_ARN" = "None" ]; then
  echo "App Runner ainda não existe — rode 'terraform apply' primeiro." >&2
  exit 1
fi

aws apprunner start-deployment --region "$REGION" --service-arn "$SERVICE_ARN"
echo ">> OK. Acompanhe em https://console.aws.amazon.com/apprunner/"
