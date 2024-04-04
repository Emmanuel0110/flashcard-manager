import React, { ForwardedRef, forwardRef, useEffect, useRef, useState } from "react";
import { Overlay } from "react-bootstrap";
import { Placement } from "react-bootstrap/esm/types";

interface AutoCompleteProps {
  dropdownList: { _id: string; label: string }[];
  callback: ({_id, label}: {_id?: string, label?: string}) => void;
  placeholder: string;
  placement: string;
}

const useForwardRef = <T,>(
  ref: ForwardedRef<T>,
  initialValue: any = null
) => {
  const targetRef = useRef<T>(initialValue);

  useEffect(() => {
    if (!ref) return;

    if (typeof ref === 'function') {
      ref(targetRef.current);
    } else {
      ref.current = targetRef.current;
    }
  }, [ref]);

  return targetRef;
};

const AutoComplete = forwardRef<HTMLInputElement, AutoCompleteProps>(({dropdownList, callback, placeholder, placement }, ref) => {
  const [editingMode, setEditingMode] = useState(false);
  const [localDescription, setLocalDescription] = useState("");
  const forwardedRef = useForwardRef<HTMLInputElement>(ref);

  //Click outside feature ------------------
  const dropdownMenuRef: any = useRef();
  useEffect(() => {
    if (editingMode) document.addEventListener("click", globalClickListener);
    return () => document.removeEventListener("click", globalClickListener);
  }, [editingMode]);

  const globalClickListener = (nativeEvent: MouseEvent) => {
    if (nativeEvent.ctrlKey || (dropdownMenuRef && dropdownMenuRef.current.contains(nativeEvent.target))) return;
    setEditingMode(false);
  }; //-------------------------------------

  const validateEdit = (_id: string) => {
    callback({_id});
    setEditingMode(false);
    setLocalDescription("");
  };

  const onKeyUp = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setEditingMode(false);
      setLocalDescription("");
    } else if (e.key === "Enter") {
      callback({label: localDescription});
      setEditingMode(false);
      setLocalDescription("");
    }
  };

  const filteredDropdownList = dropdownList?.length
    ? dropdownList.filter((el) => el.label.toUpperCase().includes(localDescription.toUpperCase()))
    : [];

  return (
    <div ref={dropdownMenuRef}>
      <input
        ref={forwardedRef}
        type="text"
        placeholder={placeholder}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          setEditingMode(true);
          setLocalDescription(e.target.value)}
        }
        onKeyUp={onKeyUp}
        value={localDescription}
      />
      {editingMode && filteredDropdownList.length ? (
        <Overlay target={forwardedRef.current} show={true} placement={placement as Placement}>
          <ul className="dropdownList">
            {filteredDropdownList.map((el, index) => (
              <li
                key={index}
                className="dropdownItem"
                onClick={(e: React.MouseEvent) => {
                  validateEdit(el._id);
                }}
              >
                {"#" + el.label}
              </li>
            ))}
          </ul>
        </Overlay>
      ) : null}
    </div>
  );
});

export default AutoComplete;
