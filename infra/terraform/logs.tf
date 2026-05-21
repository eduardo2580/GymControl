# App Runner cria automaticamente 2 log groups por serviço:
#   /aws/apprunner/<service>/<service-id>/service       — output do container
#   /aws/apprunner/<service>/<service-id>/application   — logs do build/runtime
# Sem configuração, eles ficam com retenção infinita. Aqui forçamos 7 dias
# para manter o custo previsível e respeitar minimização de dados (PII em logs
# já é redigida em código, mas mesmo assim não há porque guardar para sempre).

resource "aws_cloudwatch_log_group" "apprunner_service" {
  name              = "/aws/apprunner/${aws_apprunner_service.this.service_name}/${aws_apprunner_service.this.service_id}/service"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "apprunner_application" {
  name              = "/aws/apprunner/${aws_apprunner_service.this.service_name}/${aws_apprunner_service.this.service_id}/application"
  retention_in_days = 7
}
