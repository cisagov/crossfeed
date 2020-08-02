import React, { InputHTMLAttributes } from 'react';

export const FileInput = (props: InputHTMLAttributes<HTMLInputElement>) => (
  <div className="usa-file-input">
    <div className="usa-file-input__target">
      <div className="usa-file-input__instructions" aria-hidden="true">
        {/* <span className="usa-file-input__drag-text">Drag file here or </span>
        <span className="usa-file-input__choose">choose from folder</span> */}

        <span className="usa-file-input__choose">Choose from folder</span>
      </div>
      <div className="usa-file-input__box"></div>
      <input className="usa-file-input__input" type="file" {...props} />
    </div>
  </div>
);
