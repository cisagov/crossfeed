import React from 'react';
import { GovBanner } from '../GovBanner';
import { render, fireEvent, waitFor } from 'test-utils/test-utils';

describe('Gov Banner Component', () => {
  it('matches snapshot', () => {
    const { asFragment } = render(<GovBanner />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('expands and collapses as as expected', async () => {
    const { queryByText, getByText } = render(<GovBanner />);
    expect(queryByText(/Here's how you know/)).toBeInTheDocument();
    expect(queryByText('This site is secure.')).not.toBeInTheDocument();
    fireEvent.click(getByText(/Here's how you know/));
    await waitFor(() => {
      expect(getByText('This site is secure.')).toBeInTheDocument();
    });
    fireEvent.click(getByText(/Here's how you know/));
    await waitFor(() => {
      expect(queryByText('This site is secure.')).not.toBeInTheDocument();
    });
  });
});
