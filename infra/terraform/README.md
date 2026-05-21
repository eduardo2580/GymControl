# Infraestrutura (Terraform)

Stack mínima para subir o GymControl na AWS:

- **VPC** com 2 subnets privadas em 2 AZs, sem IGW e sem NAT.
- **RDS MySQL 8.0** `db.t4g.micro`, criptografado, privado, backup retention de 1 dia (mínimo).
- **Secrets Manager** com 2 segredos: senha master do DB e `JWT_SECRET` (ambos gerados aleatoriamente pelo Terraform).
- **ECR** com lifecycle policy (mantém 5 imagens).
- **App Runner** atrás de VPC Connector, lendo a imagem do ECR e os segredos do Secrets Manager.

## Pré-requisitos

- Terraform ≥ 1.6
- AWS CLI configurado (`aws configure`) com permissões para criar VPC, RDS, IAM, Secrets Manager, ECR, App Runner.
- Docker (para buildar e enviar a imagem ao ECR).

## Workflow

```bash
# 1. Inicializa o módulo
terraform init

# 2. Vê o plano
terraform plan

# 3. Cria a infraestrutura (~10 min — RDS demora)
terraform apply

# 4. Pega a URL do ECR e faz login
ECR_URL=$(terraform output -raw ecr_repository_url)
aws ecr get-login-password --region sa-east-1 \
  | docker login --username AWS --password-stdin "$ECR_URL"

# 5. Build e push da imagem (do diretório raiz do repo)
cd ../..
docker build -t gymcontrol:latest .
docker tag gymcontrol:latest "$ECR_URL:latest"
docker push "$ECR_URL:latest"

# 6. Volta pra infra e força o App Runner a puxar a nova imagem
cd infra/terraform
aws apprunner start-deployment --service-arn $(aws apprunner list-services \
  --query "ServiceSummaryList[?ServiceName=='gymcontrol-showcase'].ServiceArn" \
  --output text)

# 7. Pega a URL pública do backend
terraform output apprunner_url
```

Na **primeira execução**, o backend sobe com `AUTO_MIGRATE=1`. Ele detecta que o
RDS está vazio e roda automaticamente `sql/01_schema.sql` + `sql/02_seed.sql`.
Depois disso o `AUTO_MIGRATE` continua ligado mas é no-op (já existe `usuarios`).

## Destruindo tudo

```bash
terraform destroy
```

`recovery_window_in_days = 0` nos secrets + `force_delete = true` no ECR +
`skip_final_snapshot = true` no RDS garantem zero pendência.

> ⚠️ O `tfstate` local contém credenciais sensíveis (a senha do DB e o JWT).
> **Nunca** commitar `*.tfstate`. Para uso em equipe, migre para um backend
> remoto (S3 + DynamoDB lock) — fora do escopo deste showcase temporário.

## Custo estimado (sa-east-1, free-tier)

| Recurso | Custo aproximado |
|---|---|
| RDS t4g.micro (free-tier 12m) | $0 / mês |
| App Runner (0.25 vCPU, 0.5 GB) | ~$7-10 / mês com pouco tráfego |
| Secrets Manager (2 segredos) | $0.80 / mês |
| ECR | < $0.50 / mês (5 imagens) |
| **Total** | **~$8-11 / mês** |

Pra um showcase de 2 meses: ~$20 no total. Lembre de rodar `terraform destroy`.
