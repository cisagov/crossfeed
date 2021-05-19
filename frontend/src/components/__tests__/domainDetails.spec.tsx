import { generateWebpageTree } from 'components/DomainDetails';

describe('generateWebpageTree', () => {
  it('no path', () => {
    const pages = [
      {
        url: 'https://www.cisa.gov/'
      }
    ];
    const tree = generateWebpageTree(pages as any);
    expect(tree).toMatchSnapshot();
  });
  it('basic path', () => {
    const pages = [
      {
        url: 'https://www.cisa.gov/a/b/c'
      }
    ];
    const tree = generateWebpageTree(pages as any);
    expect(tree).toMatchSnapshot();
  });
  it('single path', () => {
    const pages = [
      {
        url: 'https://www.cisa.gov/a'
      }
    ];
    const tree = generateWebpageTree(pages as any);
    expect(tree).toMatchSnapshot();
  });
  it('trailing slash', () => {
    const pages = [
      {
        url: 'https://www.cisa.gov/a/'
      }
    ];
    const tree = generateWebpageTree(pages as any);
    expect(tree).toMatchSnapshot();
  });
});
