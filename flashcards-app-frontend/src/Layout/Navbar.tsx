import { useContext } from "react";
import { Link } from "react-router-dom";
import { ConfigContext, emptyFilter, someFilter } from "../App";
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
  }: {
    user: User;
    searchFilter: SearchFilter;
    setSearchFilter: React.Dispatch<React.SetStateAction<SearchFilter>>;
    setIsAuthenticated: (arg: boolean) => void;
    tags: Tag[];
  } = useContext(ConfigContext);

  const cancelFilter = () => setSearchFilter(emptyFilter);

  const search = ({ _id, label }: { _id?: string; label?: string }) => {
    if (_id) {
      setSearchFilter({ ...searchFilter, tag: tags.find((tag) => tag._id === _id) });
    } else if (label) {
      setSearchFilter({ ...searchFilter, searchString: label });
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
            <AutoComplete dropdownList={tags} callback={search} placeholder="Search..." placement="bottom-start" />
          </div>
          {someFilter(searchFilter) && <div id="cancelFilterForSearch" onClick={cancelFilter}></div>}
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
