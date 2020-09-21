export const syncDomainsIndex = jest.fn(() => ({}));

export const updateDomains = jest.fn(() => ({}));

export const searchDomains = jest.fn(() => ({}));

export default jest.fn(() => ({
  syncDomainsIndex,
  updateDomains,
  searchDomains
}));
