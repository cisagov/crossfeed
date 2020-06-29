import { Handler } from 'aws-lambda';
import { connectToDatabase, Scan } from '../models';
import { saveWebInfoToDb, getLiveWebsites } from './helpers';
import { plainToClass } from 'class-transformer';
import * as wappalyzer from 'simple-wappalyzer';
import axios from 'axios';

export const handler: Handler = async (event) => {
  await connectToDatabase();

  const scans = await Scan.find();
  for (let scan of scans) {
    console.log(scan);
    //   if (!scan.lastRun || scan.lastRun )
  }
  console.log(scans);
};
