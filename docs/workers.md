# Worker architecture

The `Scan` model represents a scheduled scan that is run on all organizations.
A scan can be of multiple types -- for example, `amass`, or `findomain`.

## Scheduling

The lambda function `scheduler.ts` goes through each organization and sees which scans
need to be run based on their schedule and when they were last run on a particular organization.

## Running

When a scan is run, a `ScanTask` model is created, which launches a Fargate task.

### Local runs

Locally, each worker runs through a Docker container.

The Fargate

## ScanTask model

The `ScanTask` model represents a single scan

## Local runs

