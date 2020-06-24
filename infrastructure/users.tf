resource "aws_cognito_user_pool" "pool" {
  name = var.user_pool["name"]
}

resource "aws_cognito_user_pool_domain" "auth_domain" {
  domain       = var.user_pool["domain"]
  user_pool_id = aws_cognito_user_pool.pool.id
}

resource "aws_cognito_user_group" "admin_group" {
  name         = "admin-group"
  description  = "Group of Admin Level Users"
  user_pool_id = aws_cognito_user_pool.pool.id
}

resource "aws_cognito_user_group" "users_group" {
  name         = "users-group"
  description  = "Crossfeed Customer Role"
  user_pool_id = aws_cognito_user_pool.pool.id
}

resource "aws_cognito_user_pool_client" "apps" {
  name         = var.user_pool["app_name"]
  user_pool_id = aws_cognito_user_pool.pool.id
}

resource "aws_ssm_parameter" "user_pool_id" {
  name      = var.ssm_user_pool
  type      = "String"
  value     = aws_cognito_user_pool.pool.id
  overwrite = true

  tags = {
    Project = var.project
  }
}
