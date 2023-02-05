// From https://github.com/trussworks/react-uswds/pull/2239.
// Apache License: https://github.com/trussworks/react-uswds/blob/main/LICENSE

import React from 'react';

import { Button } from '@trussworks/react-uswds';

export const ModalToggleButton = ({
  modalRef,
  children,
  opener,
  closer,
  ...props
}: any) => {
  const handleClick: React.MouseEventHandler<HTMLButtonElement> = (e) => {
    if (!modalRef || !modalRef.current) {
      console.error('ModalRef is required');
      return false;
    }

    if (opener && !closer) {
      // Only open
      modalRef.current.toggleModal(e, true);
    } else if (closer && !opener) {
      // Only close
      modalRef.current.toggleModal(e, false);
    } else {
      // Toggle
      modalRef.current.toggleModal(e);
    }
  };

  const dataProps: {
    'data-close-modal'?: boolean;
    'data-open-modal'?: boolean;
  } = {
    'data-close-modal': true,
    'data-open-modal': true
  };

  if (opener && !closer) delete dataProps['data-close-modal'];
  if (closer && !opener) delete dataProps['data-open-modal'];

  return (
    <Button
      {...props}
      {...dataProps}
      type="button"
      aria-controls={modalRef?.current?.modalId}
      onClick={async (e) => {
        props.onClick && (await props.onClick(e));
        handleClick(e);
      }}
    >
      {children}
    </Button>
  );
};
