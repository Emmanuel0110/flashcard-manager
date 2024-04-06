import React, { ForwardedRef, forwardRef, useEffect, useRef, useState } from "react";
import { Overlay } from "react-bootstrap";
import { Placement } from "react-bootstrap/esm/types";

interface AutoCompleteProps {
  dropdownList: { _id: string; label: string }[];
  callback: ({ _id, label }: { _id?: string; label?: string }) => void;
  placeholder: string;
  placement: string;
  onPaste?: any;
}

const useForwardRef = <T,>(ref: ForwardedRef<T>, initialValue: any = null) => {
  const targetRef = useRef<T>(initialValue);

  useEffect(() => {
    if (!ref) return;

    if (typeof ref === "function") {
      ref(targetRef.current);
    } else {
      ref.current = targetRef.current;
    }
  }, [ref]);

  return targetRef;
};

const DropdownItem = ({
  _id,
  label,
  index,
  selectedIndex,
  callback,
}: {
  _id: string;
  label: string;
  index: number;
  selectedIndex: number | null;
  callback: any;
}) => {
  const dropdownItemRef = useRef<HTMLLIElement>(null);
  useEffect(() => {
    const { current } = dropdownItemRef;
    if (current !== null && selectedIndex === index) {
      current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [selectedIndex]);

  return (
    <li
      ref={dropdownItemRef}
      key={index}
      className={"dropdownItem" + (selectedIndex === index ? " selected" : "")}
      onClick={(e: React.MouseEvent) => {
        callback(_id);
      }}
    >
      {"#" + label}
    </li>
  );
};

const AutoComplete = forwardRef<HTMLInputElement, AutoCompleteProps>(
  ({ dropdownList, callback, placeholder, placement, onPaste }, ref) => {
    const [editingMode, setEditingMode] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
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
      closeOverlay();
    }; //-------------------------------------

    const closeOverlay = () => {
      setEditingMode(false);
      setSelectedIndex(null);
      setLocalDescription("");
    };

    const filteredDropdownList = dropdownList?.length
      ? dropdownList.filter((el) => el.label.toUpperCase().includes(localDescription.toUpperCase()))
      : [];

    const validateEdit = (_id: string) => {
      callback({ _id });
      closeOverlay();
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        closeOverlay();
      } else if (e.key === "Enter") {
        if (selectedIndex !== null && filteredDropdownList[selectedIndex] !== undefined) {
          validateEdit(filteredDropdownList[selectedIndex]._id);
        } else {
          callback({ label: localDescription });
        }
        closeOverlay();
      } else if (e.key === "ArrowUp") {
        setSelectedIndex((selectedIndex) => {
          if (typeof selectedIndex === "number") {
            return selectedIndex === 0 ? filteredDropdownList.length - 1 : selectedIndex - 1;
          }
          return filteredDropdownList.length - 1;
        });
      } else if (e.key === "ArrowDown") {
        setSelectedIndex((selectedIndex) => {
          if (typeof selectedIndex === "number") {
            return selectedIndex === filteredDropdownList.length - 1 ? 0 : selectedIndex + 1;
          }
          return 0;
        });
      }
    };

    return (
      <div ref={dropdownMenuRef}>
        <input
          ref={forwardedRef}
          type="text"
          placeholder={placeholder}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setEditingMode(true);
            setLocalDescription(e.target.value);
          }}
          onKeyDown={onKeyDown}
          value={localDescription}
          onPaste={onPaste}
        />
        {editingMode && filteredDropdownList.length ? (
          <Overlay target={forwardedRef.current} show={true} placement={placement as Placement}>
            <ul className="dropdownList" style={{ width: forwardedRef.current.offsetWidth, zIndex: 10 }}>
              {filteredDropdownList.map(({ _id, label }, index) => (
                <DropdownItem
                  _id={_id}
                  label={label}
                  index={index}
                  selectedIndex={selectedIndex}
                  callback={validateEdit}
                />
              ))}
            </ul>
          </Overlay>
        ) : null}
      </div>
    );
  }
);

export default AutoComplete;
