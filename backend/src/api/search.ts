  import { connectToDatabase } from '../models';
  import { Unauthorized, wrapHandler } from './helpers';
  import { isGlobalWriteAdmin } from './auth';
  import ESClient from '../tasks/es-client';
  
  
export const search = wrapHandler(async (event) => {
    if (!isGlobalWriteAdmin(event)) {
        return Unauthorized;
    }
    await connectToDatabase();
    // const search = await validateBody(DomainSearch, event.body);

    const searchBody = JSON.parse(event.body!);

    const client = new ESClient();
    
    let searchResults;
    try {
        searchResults = await client.searchDomains(searchBody);
    } catch (e) {
        console.error(e.meta.body.error);
        throw e;
    }

    console.error("search results: ", searchResults.body);

    return {
        statusCode: 200,
        body: JSON.stringify(searchResults.body)
    }
});
