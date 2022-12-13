resource "aws_cognito_user_pool" "pool" {
  name                     = var.user_pool_name
  mfa_configuration        = "ON"
  username_attributes      = ["email"]
  auto_verified_attributes = ["email"]

  software_token_mfa_configuration {
    enabled = true
  }

  email_configuration {
    email_sending_account  = "DEVELOPER"
    source_arn             = aws_ses_email_identity.default.arn
    reply_to_email_address = var.ses_support_email_replyto
  }

  verification_message_template {
    email_subject = "Crossfeed verification code"
    email_message = "Your verification code is {####}. Please enter this code in when logging into Crossfeed to complete your account setup."
  }

  tags = {
    Project = var.project
  }
}

resource "aws_ses_email_identity" "default" {
  email = var.ses_support_email_sender
}

resource "aws_cognito_user_pool_domain" "auth_domain" {
  domain       = var.user_pool_domain
  user_pool_id = aws_cognito_user_pool.pool.id
}

resource "aws_cognito_user_pool_client" "client" {
  name                                 = "crossfeed"
  user_pool_id                         = aws_cognito_user_pool.pool.id
  callback_urls                        = ["http://localhost"]
  supported_identity_providers         = ["COGNITO"]
  allowed_oauth_scopes                 = ["email", "openid"]
  allowed_oauth_flows                  = ["code"]
  explicit_auth_flows                  = ["ALLOW_CUSTOM_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
  allowed_oauth_flows_user_pool_client = true
  prevent_user_existence_errors        = "ENABLED"
}

resource "aws_ssm_parameter" "user_pool_id" {
  name      = var.ssm_user_pool_id
  type      = "String"
  value     = aws_cognito_user_pool.pool.id
  overwrite = true

  tags = {
    Project = var.project
  }
}

resource "aws_ssm_parameter" "user_pool_client_id" {
  name      = var.ssm_user_pool_client_id
  type      = "String"
  value     = aws_cognito_user_pool_client.client.id
  overwrite = true

  tags = {
    Project = var.project
  }
}