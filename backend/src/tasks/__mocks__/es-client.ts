export const syncDomainsIndex = jest.fn(() => ({}));

export const updateDomains = jest.fn(() => ({}));

export default jest.fn(() => ({
  syncDomainsIndex,
  updateDomains
}));
