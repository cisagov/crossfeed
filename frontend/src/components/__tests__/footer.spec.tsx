import React from 'react';
import { Footer } from '../Footer';
import { render } from 'test-utils';

describe('Footer component', () => {
  it('matches snapshot', () => {
    const { asFragment } = render(<Footer />);
    expect(asFragment()).toMatchSnapshot();
  });
});
