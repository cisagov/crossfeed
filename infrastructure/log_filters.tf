resource "aws_cloudwatch_log_metric_filter" "root_user" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_root_user
  pattern        = "{$.userIdentity.type=\"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType !=\"AwsServiceEvent\"}"
  metric_transformation {
    name          = var.log_metric_root_user
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_call" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_unauthorized_api_call
  pattern        = "{($.errorCode=\"*UnauthorizedOperation\") || ($.errorCode=\"AccessDenied*\")}"
  metric_transformation {
    name          = var.log_metric_unauthorized_api_call
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "login_without_mfa" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_login_without_mfa
  pattern        = "{($.eventName=\"ConsoleLogin\") && ($.additionalEventData.MFAUsed !=\"Yes\") && ($.userIdentity.type=\"IAMUser\") && ($.responseElements.ConsoleLogin=\"Success\")}"
  metric_transformation {
    name          = var.log_metric_login_without_mfa
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "iam_policy" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_iam_policy
  pattern        = "{($.eventSource=iam.amazonaws.com) && (($.eventName=DeleteGroupPolicy) || ($.eventName=DeleteRolePolicy) || ($.eventName=DeleteUserPolicy) || ($.eventName=PutGroupPolicy) || ($.eventName=PutRolePolicy) || ($.eventName=PutUserPolicy) || ($.eventName=CreatePolicy) || ($.eventName=DeletePolicy) || ($.eventName=CreatePolicyVersion) || ($.eventName=DeletePolicyVersion) || ($.eventName=AttachRolePolicy) || ($.eventName=DetachRolePolicy) || ($.eventName=AttachUserPolicy) || ($.eventName=DetachUserPolicy) || ($.eventName=AttachGroupPolicy) || ($.eventName=DetachGroupPolicy))}"
  metric_transformation {
    name          = var.log_metric_iam_policy
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudtrail" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_cloudtrail
  pattern        = "{($.eventName=CreateTrail) || ($.eventName=UpdateTrail) || ($.eventName=DeleteTrail) || ($.eventName=StartLogging) || ($.eventName=StopLogging)}"
  metric_transformation {
    name          = var.log_metric_cloudtrail
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "login_failure" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_login_failure
  pattern        = "{($.eventName=ConsoleLogin) && ($.errorMessage=\"Failed authentication\")}"
  metric_transformation {
    name          = var.log_metric_login_failure
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cmk_delete_disable" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_cmk_delete_disable
  pattern        = "{($.eventSource=kms.amazonaws.com) && (($.eventName=DisableKey) || ($.eventName=ScheduleKeyDeletion))}"
  metric_transformation {
    name          = var.log_metric_cmk_delete_disable
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "s3_bucket_policy" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_s3_bucket_policy
  pattern        = "{($.eventSource=s3.amazonaws.com) && (($.eventName=PutBucketAcl) || ($.eventName=PutBucketPolicy) || ($.eventName=PutBucketCors) || ($.eventName=PutBucketLifecycle) || ($.eventName=PutBucketReplication) || ($.eventName=DeleteBucketPolicy) || ($.eventName=DeleteBucketCors) || ($.eventName=DeleteBucketLifecycle) || ($.eventName=DeleteBucketReplication))}"
  metric_transformation {
    name          = var.log_metric_s3_bucket_policy
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "aws_config" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_aws_config
  pattern        = "{($.eventSource=config.amazonaws.com) && (($.eventName=StopConfigurationRecorder) || ($.eventName=DeleteDeliveryChannel) || ($.eventName=PutDeliveryChannel) || ($.eventName=PutConfigurationRecorder))}"
  metric_transformation {
    name          = var.log_metric_aws_config
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "security_group" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_security_group
  pattern        = "{($.eventName=AuthorizeSecurityGroupIngress) || ($.eventName=AuthorizeSecurityGroupEgress) || ($.eventName=RevokeSecurityGroupIngress) || ($.eventName=RevokeSecurityGroupEgress) || ($.eventName=CreateSecurityGroup) || ($.eventName=DeleteSecurityGroup)}"
  metric_transformation {
    name          = var.log_metric_security_group
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "nacl" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_nacl
  pattern        = "{($.eventName=CreateNetworkAcl) || ($.eventName=CreateNetworkAclEntry) || ($.eventName=DeleteNetworkAcl) || ($.eventName=DeleteNetworkAclEntry) || ($.eventName=ReplaceNetworkAclEntry) || ($.eventName=ReplaceNetworkAclAssociation)}"
  metric_transformation {
    name          = var.log_metric_nacl
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "network_gateway" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_network_gateway
  pattern        = "{($.eventName=CreateCustomerGateway) || ($.eventName=DeleteCustomerGateway) || ($.eventName=AttachInternetGateway) || ($.eventName=CreateInternetGateway) || ($.eventName=DeleteInternetGateway) || ($.eventName=DetachInternetGateway)}"
  metric_transformation {
    name          = var.log_metric_network_gateway
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "route_table" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_route_table
  pattern        = "{($.eventSource=ec2.amazonaws.com) && (($.eventName=CreateRoute) || ($.eventName=CreateRouteTable) || ($.eventName=ReplaceRoute) || ($.eventName=ReplaceRouteTableAssociation) || ($.eventName=DeleteRouteTable) || ($.eventName=DeleteRoute) || ($.eventName=DisassociateRouteTable))}"
  metric_transformation {
    name          = var.log_metric_route_table
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "vpc" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_vpc
  pattern        = "{($.eventName=CreateVpc) || ($.eventName=DeleteVpc) || ($.eventName=ModifyVpcAttribute) || ($.eventName=AcceptVpcPeeringConnection) || ($.eventName=CreateVpcPeeringConnection) || ($.eventName=DeleteVpcPeeringConnection) || ($.eventName=RejectVpcPeeringConnection) || ($.eventName=AttachClassicLinkVpc) || ($.eventName=DetachClassicLinkVpc) || ($.eventName=DisableVpcClassicLink) || ($.eventName=EnableVpcClassicLink)}"
  metric_transformation {
    name          = var.log_metric_vpc
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "ec2_shutdown" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_ec2_shutdown
  pattern        = "{($.eventName=StopInstances) || ($.eventName=TerminateInstances)}"
  metric_transformation {
    name          = var.log_metric_ec2_shutdown
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "db_shutdown" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_db_shutdown
  pattern        = "{$.eventName=StopDBInstance}"
  metric_transformation {
    name          = var.log_metric_db_shutdown
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "db_deletion" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_db_deletion
  pattern        = "{$.eventName=DeleteDBInstance}"
  metric_transformation {
    name          = var.log_metric_db_deletion
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}