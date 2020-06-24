import React from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

interface IndicatorProps {
  left?: boolean;
  pad?: boolean;
}

export const PaginatorIndicatorIcon: React.FC<IndicatorProps> = ({
  left = false,
  pad = false,
}) => (
  <>
    {left ? (
      <FaChevronLeft size={12} className={pad ? "margin-right-1" : ""} />
    ) : (
      <FaChevronRight size={12} className={pad ? "margin-left-1" : ""} />
    )}
  </>
);
