import React from 'react';
import { render } from 'test-utils';
import { SearchBar } from '../SearchBar';

it('matches snapshot', () => {
  const { asFragment } = render(<SearchBar />);
  expect(asFragment()).toMatchSnapshot();
});
