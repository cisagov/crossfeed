function getTermFilterValue(field, fieldValue) {
  // We do this because if the value is a boolean value, we need to apply
  // our filter differently. We're also only storing the string representation
  // of the boolean value, so we need to convert it to a Boolean.

  // TODO We need better approach for boolean values
  if (fieldValue === 'false' || fieldValue === 'true') {
    return { [field]: fieldValue === 'true' };
  }
  if (typeof fieldValue === 'number') {
    return { [field]: fieldValue };
  }
  if (field === 'name') {
    // If name does not have wildcards, make it wildcard by default
    if (fieldValue !== '' && !fieldValue.includes('*')) {
      fieldValue = '*' + fieldValue + '*';
    }
  }
  return { [`${field}.keyword`]: fieldValue };
}

function getTermFilter(filter) {
  const fieldPath = filter.field.split('.');
  let searchType = 'term';
  let search = {};
  if (['name', 'ip'].includes(filter.field)) {
    searchType = 'wildcard';
  }
  if (filter.field === 'services.port') {
    searchType = 'match';
  }

  if (filter.type === 'any') {
    search = {
      bool: {
        should: filter.values.map((filterValue) => ({
          [searchType]: getTermFilterValue(filter.field, filterValue)
        })),
        minimum_should_match: 1
      }
    };
  } else if (filter.type === 'all') {
    search = {
      bool: {
        filter: filter.values.map((filterValue) => ({
          [searchType]: getTermFilterValue(filter.field, filterValue)
        }))
      }
    };
  }
  if (fieldPath.length > 1) {
    return {
      nested: {
        path: fieldPath[0],
        query: search
      }
    };
  } else {
    return search;
  }
}

// function getRangeFilter(filter) {
//   if (filter.type === 'any') {
//     return {
//       bool: {
//         should: filter.values.map(filterValue => ({
//           range: {
//             [filter.field]: {
//               ...(filterValue.to && { lt: filterValue.to }),
//               ...(filterValue.to && { gt: filterValue.from })
//             }
//           }
//         })),
//         minimum_should_match: 1
//       }
//     };
//   } else if (filter.type === 'all') {
//     return {
//       bool: {
//         filter: filter.values.map(filterValue => ({
//           range: {
//             [filter.field]: {
//               ...(filterValue.to && { lt: filterValue.to }),
//               ...(filterValue.to && { gt: filterValue.from })
//             }
//           }
//         }))
//       }
//     };
//   }
// }

export default function buildRequestFilter(filters) {
  if (!filters) return;

  filters = filters.reduce((acc, filter) => {
    return [...acc, getTermFilter(filter)];
  }, []);

  if (filters.length < 1) return;
  return filters;
}
