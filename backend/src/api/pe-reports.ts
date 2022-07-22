import {
  IsString,
  isUUID,
  IsObject,
  IsArray,
  IsNumber,
  IsBoolean,
  IsOptional
} from 'class-validator';
import { validateBody, wrapHandler, NotFound, Unauthorized } from './helpers';
import { FindManyOptions } from 'typeorm';
import { getTagOrganizations } from './auth';
import {
  Organization,
  connectToDatabase,
  Role,
  ScanTask,
  Scan,
  User,
  OrganizationTag
} from '../models';

import S3Client from '../tasks/s3-client';

export const export_pe_report = wrapHandler(async (event) => {
  const orgName = JSON.parse(event.body!).currentOrganization.name;
  const Key = JSON.parse(event.body!).Key;
  const client = new S3Client();
  const url = await client.exportPeReport(orgName, Key);
  if (url == 'File does not exist') {
    return {
      statusCode: 404,
      body: ''
    };
  }
  return {
    statusCode: 200,
    body: JSON.stringify({ url })
  };
});

export const upload_pe_report = wrapHandler(async (event) => {
  const body = JSON.parse(event.body!);
  console.log(body);
  if (!body.filename) {
    throw new Error('Invalid payload');
  }
  console.log(body.currentOrganization.name);
  const client = new S3Client();
  const url = await client.uploadPeReport(
    body.currentOrganization.name,
    body.filename
  );

  return {
    statusCode: 200,
    body: JSON.stringify({ url })
  };
});

export const list_pe_reports = wrapHandler(async (event) => {
  const orgName = JSON.parse(event.body!).currentOrganization.name;
  const client = new S3Client();
  const data = await client.listPeReports(orgName);
  return {
    statusCode: 200,
    body: JSON.stringify(data)
  };
});
