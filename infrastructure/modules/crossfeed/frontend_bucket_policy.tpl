{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Sid":"PublicRead",
      "Effect":"Allow",
      "Principal": "*",
      "Action":["s3:GetObject"],
      "Resource":["arn:aws:s3:::${bucket_name}/*","arn:aws:s3:::${bucket_name}/*/"]
    }
  ]
}
