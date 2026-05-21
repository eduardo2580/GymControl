output "ecr_repository_url" {
  description = "URL do repositório ECR — use no docker tag/push."
  value       = aws_ecr_repository.this.repository_url
}

output "apprunner_url" {
  description = "URL pública do backend. Configure como rewrite no vercel.json."
  value       = "https://${aws_apprunner_service.this.service_url}"
}

output "db_endpoint" {
  description = "Endpoint do RDS (privado)."
  value       = aws_db_instance.this.address
}

output "jwt_secret_arn" {
  description = "ARN do segredo JWT no Secrets Manager."
  value       = aws_secretsmanager_secret.jwt.arn
}

output "db_password_arn" {
  description = "ARN da senha master do DB no Secrets Manager."
  value       = aws_secretsmanager_secret.db_password.arn
}
