export const saveCSV = jest.fn(() => 'http://mock_url');

export default jest.fn(() => ({
  saveCSV
}));
