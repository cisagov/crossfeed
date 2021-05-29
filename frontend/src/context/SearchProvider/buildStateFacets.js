import { get } from 'lodash';

function getValueFacet(aggregations, fieldName) {
  const value = get(aggregations, fieldName);
  if (value?.buckets?.length > 0) {
    return [
      {
        field: fieldName,
        type: 'value',
        data: value.buckets.map((bucket) => ({
          // Boolean values and date values require using `key_as_string`
          value: bucket.key_as_string || bucket.key,
          count: bucket.doc_count
        }))
      }
    ];
  }
}

// function getRangeFacet(aggregations, fieldName) {
//   const value = get(aggregations, fieldName);
//   if (value?.buckets?.length  > 0) {
//     return [
//       {
//         field: fieldName,
//         type: "range",
//         data: value.buckets.map(bucket => ({
//           // Boolean values and date values require using `key_as_string`
//           value: {
//             to: bucket.to,
//             from: bucket.from,
//             name: bucket.key
//           },
//           count: bucket.doc_count
//         }))
//       }
//     ];
//   }
// }

const FACETS = [
  'name',
  'fromRootDomain',
  'services.port',
  'vulnerabilities.cve',
  'vulnerabilities.severity',
  'organization.name',
  'services.products.cpe'
];
export default function buildStateFacets(aggregations) {
  const facets = {};

  for (let facetName of FACETS) {
    const value = getValueFacet(aggregations, facetName);
    if (value) {
      facets[facetName] = value;
    }
  }

  if (Object.keys(facets).length > 0) {
    return facets;
  }
}
