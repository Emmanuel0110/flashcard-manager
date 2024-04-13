import { Dispatch, useContext, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ConfigContext, someFilter } from "../App";
import { SearchFilter, Tag, User } from "../types";
import { logout } from "../auth/authActions";
import AutoComplete from "../utils/Autocomplete";

function Navbar() {
  const {
    user,
    searchFilter,
    setSearchFilter,
    setIsAuthenticated,
    tags,
    treeFilter,
    setTreeFilter,
  }: {
    user: User;
    searchFilter: SearchFilter;
    setSearchFilter: React.Dispatch<React.SetStateAction<SearchFilter>>;
    setIsAuthenticated: (arg: boolean) => void;
    tags: Tag[];
    treeFilter: string[];
    setTreeFilter: React.Dispatch<React.SetStateAction<string[]>>;
  } = useContext(ConfigContext);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "k":
        if (e.ctrlKey) {
          e.preventDefault();
          inputRef.current?.focus();
        }
        break;
      default:
    }
  };

  const cancelFilter = () => {
    setSearchFilter([]);
    setTreeFilter([]);
  };

  const search = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      const tag = tags.find((tag) => tag._id === _id)!;
      setLocalDescription((localDescription) => localDescription + tag.label);
    } else if (label) {
      setSearchFilter([...searchFilter, [label]]);
      setLocalDescription("");
    }
  };

  return (
    <div id="navbar" className="navb">
      <div id="githubIconArea">
        <a href="https://github.com/Emmanuel0110/flashcard-manager">
          <div className="githubIcon"></div>
        </a>
      </div>
      <div id="searchArea">
        <div id="searchAreaContainer">
          <div id="searchAreaInput">
            <AutoComplete
              ref={inputRef}
              dropdownList={tags}
              callback={search}
              placeholder="Search..."
              placement="bottom-start"
            />
          </div>
          {someFilter(searchFilter, treeFilter) && <div id="cancelFilterForSearch" onClick={cancelFilter}></div>}
        </div>
      </div>
      <div id="nameLabel">{user?.username}</div>
      <Link to="/profile">
        <div id="avatar-icon"></div>
      </Link>

      <div className="navButton" onClick={() => logout(setIsAuthenticated)}>
        Logout
      </div>
    </div>
  );
}

export default Navbar;
