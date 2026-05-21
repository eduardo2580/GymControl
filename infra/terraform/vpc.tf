# VPC com subnets PRIVADAS apenas. Sem IGW, sem NAT.
# - RDS fica nas privadas (não acessível pela internet).
# - App Runner usa o VPC Connector para enxergar as privadas e falar com o RDS.
# - App Runner egress = "VPC" significa que todo egresso vai via VPC. Como não
#   temos NAT, o backend não consegue chamar internet — o que é ok, ele só fala
#   com o RDS. Se um dia precisar (ex.: SDK pra serviço externo), adicione NAT.

resource "aws_vpc" "main" {
  cidr_block           = "10.10.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = { Name = "${local.name}-vpc" }
}

resource "aws_subnet" "private" {
  count             = length(local.private_subnet_cidrs)
  vpc_id            = aws_vpc.main.id
  cidr_block        = local.private_subnet_cidrs[count.index]
  availability_zone = local.azs[count.index]

  tags = {
    Name = "${local.name}-private-${local.azs[count.index]}"
  }
}

# Security group do App Runner (cliente do RDS).
resource "aws_security_group" "apprunner" {
  name        = "${local.name}-apprunner"
  description = "App Runner VPC connector"
  vpc_id      = aws_vpc.main.id

  egress {
    description = "Liberado para a VPC (RDS)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [aws_vpc.main.cidr_block]
  }

  tags = { Name = "${local.name}-apprunner-sg" }
}

# Security group do RDS — só aceita 3306 do SG do App Runner.
resource "aws_security_group" "rds" {
  name        = "${local.name}-rds"
  description = "RDS - apenas App Runner"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "MySQL do App Runner"
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.apprunner.id]
  }

  tags = { Name = "${local.name}-rds-sg" }
}
