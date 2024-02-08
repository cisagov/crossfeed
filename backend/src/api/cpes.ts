import { ProductInfo, connectToDatabase } from '../models';
import { wrapHandler, NotFound } from './helpers';

// TODO: Join cves to cpe get method
// TODO: Create CpeFilters and CpeSearch classes to handle filtering and pagination of additional fields

/**
 * @swagger
 * /cpes/{id}:
 *   get:
 *     description: Retrieve a CPE by ID
 *     tags:
 *       - CPEs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 */
export const get = wrapHandler(async (event) => {
  const connection = await connectToDatabase();
  const repository = connection.getRepository(ProductInfo);

  const id = event.pathParameters?.id;
  if (!id) {
    return NotFound;
  }

  const productInfo = await repository.findOne(id);
  if (!productInfo) {
    return NotFound;
  }

  return {
    statusCode: 200,
    body: JSON.stringify(productInfo)
  };
});
