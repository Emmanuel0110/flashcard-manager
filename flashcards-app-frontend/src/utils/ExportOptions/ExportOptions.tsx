import React, { useEffect, useRef, useState } from "react";
import "./ExportOptions.css";

interface DotOptionsProps {
  options: { callback: () => void; label: string }[];
}

const ExportOptions: React.FC<DotOptionsProps> = ({ options }) => {
  const [isVisible, setIsVisible] = useState(false);

  //Click outside feature ------------------
  const dropdownMenuRef: any = useRef();
  useEffect(() => {
    if (isVisible) document.addEventListener("click", globalClickListener);
    return () => document.removeEventListener("click", globalClickListener);
  }, [isVisible]);

  const globalClickListener = (nativeEvent: MouseEvent) => {
    if (nativeEvent.ctrlKey || (dropdownMenuRef && dropdownMenuRef.current.contains(nativeEvent.target))) return;
    setIsVisible(false);
  }; //-------------------------------------

  const onClickDots: React.MouseEventHandler<HTMLDivElement> = (e) => {
    e.stopPropagation();
    setIsVisible((isVisible) => {
      return !isVisible;
    });
  };
  const onClick = (callback: () => void) => {
    callback();
    setIsVisible(false);
  };
  return (
    <div className="exportOptions">
      <div className="export-icon" onClick={onClickDots}></div>
      {isVisible && (
        <div ref={dropdownMenuRef} className="exportOptionMenu">
          {options.map(({ callback, label }, index) => (
            <div key={index} className="optionLabel" onClick={(e) => onClick(callback)}>
              {label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ExportOptions;
