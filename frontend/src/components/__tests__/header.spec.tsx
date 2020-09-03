import React from 'react';
import { render, fireEvent } from 'test-utils';
import { Header } from '../Header';
import { wait, getByTestId } from '@testing-library/react';

describe('Header component', () => {
  it('matches snapshot', () => {
    const { asFragment } = render(<Header />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('can expand drawer', async () => {
    const { getByLabelText, getByTestId, queryByTestId } = render(<Header />);
    expect(queryByTestId('mobilenav')).not.toBeInTheDocument();
    expect(getByLabelText('toggle mobile menu')).toBeInTheDocument();
    fireEvent.click(getByLabelText('toggle mobile menu'));
    await wait(() => {
      expect(getByTestId('mobilenav')).toBeInTheDocument();
    });
  });
});
