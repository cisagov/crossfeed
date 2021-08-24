require('dotenv').config({ path: '../.env' });

import { APIGatewayProxyResult } from "aws-lambda";
import { export_ } from "./api/vulnerabilities";
import {UserType} from "./models";

/**
 * Manually export all vulnerabilities.
 * To run, go to a CISA prod bastion host with database access and then run:
 * git clone https://github.com/cisagov/crossfeed.git
 * cd backend
 * npm install
 * NODE_OPTIONS=--max_old_space_size=50240 npx ts-node src/custom.ts
 */


const PAGE_SIZE = 100000;
const urls: string[] = [];
let page = 0;

(async() => {
    while (true) {
        const res = await export_({
            body: JSON.stringify({page, sort: "createdAt", order: "ASC", pageSize: PAGE_SIZE}),
            requestContext: {
                authorizer: {
                    id: "XXXXX-sample-user",
                    userType: UserType.GLOBAL_ADMIN
                }
            } as any
        } as any, {} as any, {} as any);
        const {url, resultCount} = JSON.parse((res as APIGatewayProxyResult).body);
        console.log(url, resultCount);
        urls.push(url);
        page++;
        if (resultCount == 0) {
            break;
        }
    }
})();
