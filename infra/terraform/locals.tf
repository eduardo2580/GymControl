data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  name = "${var.project_name}-${var.environment}"

  # Pega as 2 primeiras AZs da região — RDS subnet group precisa de >= 2 AZs.
  azs = slice(data.aws_availability_zones.available.names, 0, 2)

  # /20 dá ~4k IPs por subnet — exagero pro projeto, mas zero custo extra.
  private_subnet_cidrs = ["10.10.1.0/24", "10.10.2.0/24"]
}
