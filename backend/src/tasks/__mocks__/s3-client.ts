export const getWebpageBody = jest.fn(() => 'webpage body');

export default jest.fn(() => ({
  getWebpageBody
}));
