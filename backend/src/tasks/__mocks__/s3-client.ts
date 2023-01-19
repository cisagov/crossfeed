export const saveCSV = jest.fn(() => 'http://mock_url');
export const listReports = jest.fn(() => ({ Contents: 'report content' }));

export default jest.fn(() => ({
  saveCSV,
  listReports
}));
