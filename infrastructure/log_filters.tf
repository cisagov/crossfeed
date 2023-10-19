resource "aws_cloudwatch_log_metric_filter" "cloudwatch1" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch1
  pattern        = "{$.userIdentity.type=\"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType !=\"AwsServiceEvent\"}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch1
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch2" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch2
  pattern        = "{($.errorCode=\"*UnauthorizedOperation\") || ($.errorCode=\"AccessDenied*\")}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch2
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch3" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch3
  pattern        = "{($.eventName=\"ConsoleLogin\") && ($.additionalEventData.MFAUsed !=\"Yes\") && ($.userIdentity.type=\"IAMUser\") && ($.responseElements.ConsoleLogin=\"Success\")}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch3
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch4" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch4
  pattern        = "{($.eventSource=iam.amazonaws.com) && (($.eventName=DeleteGroupPolicy) || ($.eventName=DeleteRolePolicy) || ($.eventName=DeleteUserPolicy) || ($.eventName=PutGroupPolicy) || ($.eventName=PutRolePolicy) || ($.eventName=PutUserPolicy) || ($.eventName=CreatePolicy) || ($.eventName=DeletePolicy) || ($.eventName=CreatePolicyVersion) || ($.eventName=DeletePolicyVersion) || ($.eventName=AttachRolePolicy) || ($.eventName=DetachRolePolicy) || ($.eventName=AttachUserPolicy) || ($.eventName=DetachUserPolicy) || ($.eventName=AttachGroupPolicy) || ($.eventName=DetachGroupPolicy))}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch4
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch5" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch5
  pattern        = "{($.eventName=CreateTrail) || ($.eventName=UpdateTrail) || ($.eventName=DeleteTrail) || ($.eventName=StartLogging) || ($.eventName=StopLogging)}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch5
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch6" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch6
  pattern        = "{($.eventName=ConsoleLogin) && ($.errorMessage=\"Failed authentication\")}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch6
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch7" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch7
  pattern        = "{($.eventSource=kms.amazonaws.com) && (($.eventName=DisableKey) || ($.eventName=ScheduleKeyDeletion))}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch7
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch8" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch8
  pattern        = "{($.eventSource=s3.amazonaws.com) && (($.eventName=PutBucketAcl) || ($.eventName=PutBucketPolicy) || ($.eventName=PutBucketCors) || ($.eventName=PutBucketLifecycle) || ($.eventName=PutBucketReplication) || ($.eventName=DeleteBucketPolicy) || ($.eventName=DeleteBucketCors) || ($.eventName=DeleteBucketLifecycle) || ($.eventName=DeleteBucketReplication))}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch8
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch9" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch9
  pattern        = "{($.eventSource=config.amazonaws.com) && (($.eventName=StopConfigurationRecorder) || ($.eventName=DeleteDeliveryChannel) || ($.eventName=PutDeliveryChannel) || ($.eventName=PutConfigurationRecorder))}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch9
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch10" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch10
  pattern        = "{($.eventName=AuthorizeSecurityGroupIngress) || ($.eventName=AuthorizeSecurityGroupEgress) || ($.eventName=RevokeSecurityGroupIngress) || ($.eventName=RevokeSecurityGroupEgress) || ($.eventName=CreateSecurityGroup) || ($.eventName=DeleteSecurityGroup)}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch10
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch11" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch11
  pattern        = "{($.eventName=CreateNetworkAcl) || ($.eventName=CreateNetworkAclEntry) || ($.eventName=DeleteNetworkAcl) || ($.eventName=DeleteNetworkAclEntry) || ($.eventName=ReplaceNetworkAclEntry) || ($.eventName=ReplaceNetworkAclAssociation)}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch11
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch12" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch12
  pattern        = "{($.eventName=CreateCustomerGateway) || ($.eventName=DeleteCustomerGateway) || ($.eventName=AttachInternetGateway) || ($.eventName=CreateInternetGateway) || ($.eventName=DeleteInternetGateway) || ($.eventName=DetachInternetGateway)}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch12
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch13" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch13
  pattern        = "{($.eventSource=ec2.amazonaws.com) && (($.eventName=CreateRoute) || ($.eventName=CreateRouteTable) || ($.eventName=ReplaceRoute) || ($.eventName=ReplaceRouteTableAssociation) || ($.eventName=DeleteRouteTable) || ($.eventName=DeleteRoute) || ($.eventName=DisassociateRouteTable))}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch13
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}

resource "aws_cloudwatch_log_metric_filter" "cloudwatch14" {
  log_group_name = var.cloudtrail_log_group_name
  name           = var.log_metric_name_cloudwatch14
  pattern        = "{($.eventName=CreateVpc) || ($.eventName=DeleteVpc) || ($.eventName=ModifyVpcAttribute) || ($.eventName=AcceptVpcPeeringConnection) || ($.eventName=CreateVpcPeeringConnection) || ($.eventName=DeleteVpcPeeringConnection) || ($.eventName=RejectVpcPeeringConnection) || ($.eventName=AttachClassicLinkVpc) || ($.eventName=DetachClassicLinkVpc) || ($.eventName=DisableVpcClassicLink) || ($.eventName=EnableVpcClassicLink)}"
  metric_transformation {
    name          = var.log_metric_name_cloudwatch14
    namespace     = var.log_metric_namespace
    default_value = 0
    value         = 1
  }
}
