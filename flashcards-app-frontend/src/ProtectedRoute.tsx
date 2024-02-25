import { Navigate, Outlet } from "react-router";
import { loadUser } from "./auth/authActions";
import { Dispatch, SetStateAction } from "react";
import { User } from "./types";

interface ProtectedRouteProps {
  redirectPath: string;
  isAuthenticated: Boolean | null;
  setIsAuthenticated: (b: boolean) => void;
  setUser: Dispatch<SetStateAction<User | null>>
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ isAuthenticated, setIsAuthenticated, setUser, redirectPath }) => {

  if (isAuthenticated === true) {
    return <Outlet />;
  } else if (isAuthenticated === false) {
    return <Navigate to={redirectPath} replace />;
  } else {
    loadUser(setUser, setIsAuthenticated)
    return <div>Loading...</div>;
  }
};

export default ProtectedRoute;
