import { ChangeEvent, useContext, useState } from "react";
import { Link } from "react-router-dom";
import { ConfigContext } from "../App";
import { User } from "../types";
import { logout } from "../auth/authActions";

function Navbar() {
  const {
    user,
    searchFilter,
    setSearchFilter,
    setIsAuthenticated,
  }: {
    user: User;
    searchFilter: string;
    setSearchFilter: (arg: string) => void;
    setIsAuthenticated: (arg: boolean) => void;
  } = useContext(ConfigContext);
  const [localSearchString, setLocalSearchString] = useState("");

  const someFilter: boolean = searchFilter !== "";
  const cancelFilter = () => setSearchFilter("");

  return (
    <div id="navbar" className="navb">
      <div id="searchArea">
        <div id="searchAreaContainer">
          <input
            id="searchAreaInput"
            type="text"
            placeholder="Search..."
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setLocalSearchString(e.target.value);
            }}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") {
                setSearchFilter(localSearchString);
                setLocalSearchString("");
              }
            }}
            value={localSearchString}
          />
          {someFilter && <div id="cancelFilterForSearch" onClick={cancelFilter}></div>}
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
