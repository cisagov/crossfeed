resource "aws_cognito_user_pool" "pool" {
  name = var.user_pool_name
  mfa_configuration = "ON"
  username_attributes = ["email"]
  auto_verified_attributes = ["email"]

  software_token_mfa_configuration {
    enabled = true
  }

  sms_configuration {
    external_id    = var.user_pool_name
    sns_caller_arn = aws_iam_role.pool_sns_role.arn
  }
}

resource "aws_iam_role" "pool_sns_role" {
  name_prefix = "${var.user_pool_name}-SMS-Role"
  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "",
      "Effect": "Allow",
      "Principal": {
        "Service": "cognito-idp.amazonaws.com"
      },
      "Action": "sts:AssumeRole",
      "Condition": {
        "StringEquals": {
          "sts:ExternalId": "${var.user_pool_name}"
        }
      }
    }
  ]
}
EOF
}

resource "aws_iam_role_policy" "pool_sns_policy" {
  role = aws_iam_role.pool_sns_role.id
  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "sns:publish"
      ],
      "Effect": "Allow",
      "Resource": "*"
    }
  ]
}
EOF
}

resource "aws_cognito_user_pool_domain" "auth_domain" {
  domain       = var.user_pool_domain
  user_pool_id = aws_cognito_user_pool.pool.id
}

resource "aws_cognito_user_pool_client" "client" {
  name         = "crossfeed"
  user_pool_id = aws_cognito_user_pool.pool.id
  callback_urls = ["http://localhost"]
  supported_identity_providers = ["COGNITO"]
  allowed_oauth_scopes = ["email", "openid"]
  allowed_oauth_flows = ["code"]
  explicit_auth_flows = ["ALLOW_CUSTOM_AUTH", "ALLOW_REFRESH_TOKEN_AUTH", "ALLOW_USER_SRP_AUTH"]
  allowed_oauth_flows_user_pool_client = true
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