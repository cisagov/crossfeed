import { Cve, connectToDatabase } from '../models';
import { NotFound, wrapHandler } from './helpers';

// TODO: Add test for joining cpe table
// TODO: Create CveFilters and CveSearch classes to handle filtering and pagination of additional fields

/**
 * @swagger
 * /cves/{id}:
 *   get:
 *     description: Retrieve a CVE by ID.
 *     tags:
 *       - CVEs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
export const get = wrapHandler(async (event) => {
  await connectToDatabase();
  const id = event.pathParameters?.id;

  const cve = await Cve.createQueryBuilder('cve')
    .leftJoinAndSelect('cve.cpes', 'cpe')
    .where('cve.id = :id', { id: id })
    .getOne();

  if (!cve) {
    return NotFound;
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
 * /cves/name/{name}:
 *  get:
 *    description: Retrieve a single CVE record by its name.
 *    tags:
 *    - CVE
 *    parameters:
 *    - name: name
 *      in: path
 *      required: true
 *      schema:
 *        type: string
 */
export const getByName = wrapHandler(async (event) => {
  await connectToDatabase();
  const name = event.pathParameters?.name;

  const cve = await Cve.createQueryBuilder('cve')
    .leftJoinAndSelect('cve.cpes', 'cpe')
    .where('cve.name = :name', { name: name })
    .getOne();

  if (!cve) {
    return NotFound;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(cve)
  };
});
