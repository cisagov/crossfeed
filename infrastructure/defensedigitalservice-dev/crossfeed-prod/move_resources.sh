#! /usr/bin/env bash

# RUN THIS ONCE TO MOVE RESOURCES

# Now that all the code is inside a module the state needs to be updated, which is just to ensure that nothing changes

while read line ; do
  aws-vault exec "${AWS_PROFILE}" --region us-east-1 -- terraform state mv "${line}" "module.crossfeed.${line}"
done < resources.txt