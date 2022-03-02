### Manual access

To manually access the accessor instance, we use AWS Session Manager. This way, we don't need to run an EC2 bastion instance that's exposed to the public Internet.

- Install the [Session Manager plugin](https://docs.aws.amazon.com/systems-manager/latest/userguide/session-manager-working-with-install-plugin.html) to the AWS CLI on your development machine.
- Set up a Session Manager port forwarding session to allow SSH access to the instance.

  ```bash
  # Set this environment variable to the ID of the EC2 bastion instance (which should be in a private subnet, but able to connect to the RDS instance).
  export INSTANCE_ID=i-0066feb5d7b0fe3a4
  # Generate an SSH key and send it to the EC2 instance
  # (this only needs to be done once).
  ssh-keygen -f accessor_rsa
  chmod 600 accessor_rsa
  aws ec2-instance-connect send-ssh-public-key \
      --instance-id $INSTANCE_ID \
      --availability-zone us-east-1b \
      --instance-os-user ubuntu \
      --ssh-public-key file://accessor_rsa.pub

  # Start port forwarding.
  aws ssm start-session \
      --target $INSTANCE_ID \
      --document-name AWS-StartPortForwardingSession \
      --parameters '{"portNumber":["22"], "localPortNumber":["9999"]}'
  ```

- In another terminal, SSH into the instance:

  ```bash
  # Set this environment variable to the URL of the RDS instance (XXX.rds.amazonaws.com)
  export RDS_URL=

  ssh ubuntu@localhost -p 9999 -i accessor_rsa
  ```

- Once you SSH into the instance, you should now be able to access the database and run scripts on it.
