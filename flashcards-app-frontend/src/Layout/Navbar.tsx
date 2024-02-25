import { ChangeEvent, useContext } from "react";
import { Link } from "react-router-dom";
import { ConfigContext } from "../App";
import { User } from "../types";
import { logout } from "../auth/authActions";

function Navbar() {
  const { user, searchFilter, setSearchFilter, setIsAuthenticated}: {user: User, searchFilter: string, setSearchFilter: (arg: string) => void, setIsAuthenticated: (arg: boolean) => void} = useContext(ConfigContext);
  return (
    <div id="navbar" className="navb">
      <div id="searchArea">
        <input
          id="searchAreaInput"
          type="text"
          placeholder="Search..."
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            setSearchFilter(e.target.value);
          }}
          value={searchFilter}
        />
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
