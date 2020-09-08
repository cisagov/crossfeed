import React from 'react';
import { render } from 'test-utils/test-utils';
import { Layout } from '../Layout';

jest.mock('components/Header', () => ({
  Header: () => <div>HEADER</div>
}));
jest.mock('components/GovBanner', () => ({
  GovBanner: () => <div>GOV_BANNER</div>
}));

afterAll(() => {
  jest.restoreAllMocks();
});

describe('Layout component', () => {
  it('matches snapshot', () => {
    const { asFragment } = render(<Layout />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('renders children', () => {
    const { getByText } = render(<Layout>some children</Layout>);
    expect(getByText('some children')).toBeInTheDocument();
  });
});
