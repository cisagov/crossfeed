import { Cve, connectToDatabase } from '../models';
import { wrapHandler } from './helpers';

// TODO: Add test for joining product_info
// TODO: Create CveFilters and CveSearch classes to handle filtering and pagination of additional fields

/**
 * @swagger
 *
 * /cves/{cve_uid}:
 *  get:
 *    description: Retrieve a single CVE record by its ID.
 *    tags:
 *    - CVE
 *    parameters:
 *    - name: cve_uid
 *      in: path
 *      required: true
 *      schema:
 *        type: string
 */
export const get = wrapHandler(async (event) => {
  await connectToDatabase();
  const cve_uid = event.pathParameters?.cve_uid;

  const cve = await Cve.createQueryBuilder('cve')
    .leftJoinAndSelect('cve.product_info', 'product_info')
    .where('cve.cve_uid = :cve_uid', { cve_uid: cve_uid })
    .getOne();

  if (!cve) {
    return {
      statusCode: 404,
      body: JSON.stringify(Error)
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(cve)
  };
});

//TODO: Remove getByName endpoint once a one-to-one relationship is established between vulnerability.cve and cve.cve_id
/**
 * @swagger
 *
 * /cves/name/{cve_name}:
 *  get:
 *    description: Retrieve a single CVE record by its name.
 *    tags:
 *    - CVE
 *    parameters:
 *    - name: cve_name
 *      in: path
 *      required: true
 *      schema:
 *        type: string
 */
export const getByName = wrapHandler(async (event) => {
  await connectToDatabase();
  const cve_name = event.pathParameters?.cve_name;

  const cve = await Cve.createQueryBuilder('cve')
    .leftJoinAndSelect('cve.product_info', 'product_info')
    .where('cve.cve_name = :cve_name', { cve_name })
    .getOne();

  if (!cve) {
    return {
      statusCode: 404,
      body: JSON.stringify(Error)
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(cve)
  };
});
