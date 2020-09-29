import React from 'react';
import { render } from 'test-utils';
import { SearchBar } from '../SearchBar';

it('matches snapshot', () => {
  const { asFragment } = render(
    <SearchBar
      onChange={jest.fn()}
      autocompletedResults={[]}
      onSelectResult={jest.fn()}
    />
  );
  expect(asFragment()).toMatchSnapshot();
});
