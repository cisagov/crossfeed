import React from "react";
import classNames from "classnames";
import { Button } from "@trussworks/react-uswds";
import classes from "./styles.module.scss";

type BaseButtonProps = Omit<Partial<JSX.IntrinsicElements["button"]>, "color">;

interface PaginatorButtonProps extends BaseButtonProps {
  disabled?: boolean;
  isPageNumber?: boolean;
  active?: boolean;
  onClick: React.MouseEventHandler<HTMLButtonElement>;
}

export const PaginatorButton: React.FC<PaginatorButtonProps> = ({
  disabled = false,
  isPageNumber = false,
  active = false,
  type = "button",
  onClick,
  children,
  ...rest
}) => {
  return (
    <Button
      className={classNames(classes.pageLink, {
        [classes.disabled]: disabled,
        [classes.currentPage]: isPageNumber && active,
        [classes.isPageNumber]: isPageNumber,
      })}
      unstyled
      onClick={!disabled ? onClick : undefined}
      type={type}
      {...rest}
    >
      {children}
    </Button>
  );
};
