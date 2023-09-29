resource "aws_kms_key" "key" {
  description             = "KMS key"
  deletion_window_in_days = 10
  enable_key_rotation     = true
  policy = jsonencode({
    Version : "2012-10-17",

    Id : "key-default-1",

    Statement : [
      {
        Sid : "Enable IAM User Permissions",

        Effect : "Allow",

        Principal : {
          AWS : "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        },

        Action : [
          "kms:BypassPolicyLockoutSafetyCheck",
          "kms:CallerAccount",
          "kms:CancelKeyDeletion",
          "kms:ConnectCustomKeyStore",
          "kms:CreateAlias",
          "kms:CreateCustomKeyStore",
          "kms:CreateGrant",
          "kms:CreateKey",
          "kms:DataKeyPairSpec",
          "kms:Decrypt",
          "kms:DeleteAlias",
          "kms:DeleteCustomKeyStore",
          "kms:DeleteImportedKeyMaterial",
          "kms:DescribeCustomKeyStores",
          "kms:DescribeKey",
          "kms:DisableKey",
          "kms:DisableKeyRotation",
          "kms:DisconnectCustomKeyStore",
          "kms:EnableKey",
          "kms:EnableKeyRotation",
          "kms:Encrypt",
          "kms:EncryptionAlgorithm",
          "kms:EncryptionContextKeys",
          "kms:ExpirationModel",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyPair",
          "kms:GenerateDataKeyPairWithoutPlaintext",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:GenerateMac",
          "kms:GenerateRandom",
          "kms:GetKeyPolicy",
          "kms:GetKeyRotationStatus",
          "kms:GetParametersForImport",
          "kms:GetPublicKey",
          "kms:GrantConstraintType",
          "kms:GrantIsForAWSResource",
          "kms:GrantOperations",
          "kms:GranteePrincipal",
          "kms:ImportKeyMaterial",
          "kms:KeyOrigin",
          "kms:KeySpec",
          "kms:KeyUsage",
          "kms:ListAliases",
          "kms:ListGrants",
          "kms:ListKeyPolicies",
          "kms:ListKeys",
          "kms:ListResourceTags",
          "kms:ListRetirableGrants",
          "kms:MacAlgorithm",
          "kms:MessageType",
          "kms:MultiRegion",
          "kms:MultiRegionKeyType",
          "kms:PrimaryRegion",
          "kms:PutKeyPolicy",
          "kms:ReEncryptFrom",
          "kms:ReEncryptOnSameKey",
          "kms:ReEncryptTo",
          "kms:ReplicaRegion",
          "kms:ReplicateKey",
          "kms:RequestAlias",
          "kms:ResourceAliases",
          "kms:RetireGrant",
          "kms:RetiringPrincipal",
          "kms:RevokeGrant",
          "kms:ScheduleKeyDeletion",
          "kms:Sign",
          "kms:SigningAlgorithm",
          "kms:TagResource",
          "kms:UntagResource",
          "kms:UpdateAlias",
          "kms:UpdateCustomKeyStore",
          "kms:UpdateKeyDescription",
          "kms:UpdatePrimaryRegion",
          "kms:ValidTo",
          "kms:Verify",
          "kms:VerifyMac",
          "kms:ViaService",
          "kms:WrappingAlgorithm",
          "kms:WrappingKeySpec"
        ],
        Resource : "*"
      },

      {
        Effect : "Allow",

        Principal : {
          Service : "logs.${data.aws_region.current.name}.amazonaws.com"
        },

        Action : [
          "kms:Decrypt",
          "kms:DescribeCustomKeyStores",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:EncryptionAlgorithm",
          "kms:EncryptionContextKeys",
          "kms:GenerateDataKey",
          "kms:GenerateDataKeyPair",
          "kms:GenerateDataKeyPairWithoutPlaintext",
          "kms:GenerateDataKeyWithoutPlaintext",
          "kms:ReEncryptFrom",
          "kms:ReEncryptOnSameKey",
          "kms:ReEncryptTo"
        ],
        Resource : "*",

        Condition : {
          ArnLike : {
            "kms:EncryptionContext:aws:logs:arn" : "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      },
      {
        Sid : "Allow CloudTrail to encrypt logs",
        Effect : "Allow",
        Principal : {
          Service : "cloudtrail.amazonaws.com"
        },
        Action : "kms:GenerateDataKey*",
        Resource : "*",
        Condition : {
          StringEquals : {
            "aws:SourceArn" : "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.cloudtrail_name}"
          },
          StringLike : {
            "kms:EncryptionContext:aws:cloudtrail:arn" : "arn:aws:cloudtrail:*:${data.aws_caller_identity.current.account_id}:trail/*"
          }
        }
      },
      {
        "Sid" : "Allow CloudTrail to decrypt a trail",
        "Effect" : "Allow",
        "Principal" : {
          "Service" : "cloudtrail.amazonaws.com"
        },
        "Action" : "kms:Decrypt",
        "Resource" : "*"
      },
      {
        Sid : "Allow CloudTrail access",
        Effect : "Allow",
        Principal : {
          Service : "cloudtrail.amazonaws.com"
        },
        Action : "kms:DescribeKey",
        Resource : "arn:aws:kms:region:${data.aws_caller_identity.current.account_id}:key/*}",
        Condition : {
          StringEquals : {
            "aws:SourceArn" : "arn:aws:cloudtrail:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:trail/${var.cloudtrail_name}"
          }
        }
      }
    ]
  })
  tags = {
    project = var.project
    stage   = var.stage
  }
}

resource "aws_kms_alias" "key" {
  target_key_id = aws_kms_key.key.id
  name          = "alias/${var.stage}-key"
}