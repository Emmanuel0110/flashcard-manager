import React, { useContext } from "react";
import { SearchFilter } from "../../types";
import { ConfigContext } from "../../App";

export default function FilterBar() {
  const {
    searchFilter,
    setSearchFilter,
  }: {
    searchFilter: SearchFilter;
    setSearchFilter: React.Dispatch<React.SetStateAction<SearchFilter>>;
  } = useContext(ConfigContext);

  return (
    <>
      <ul id="filterList">
        {searchFilter.map((filterArrayOR, index) => {
          return (
            <li key={index} className="filterItem">
              {filterArrayOR.join(" ")}
              <div
                className="filterClose"
                onClick={(e: React.MouseEvent<HTMLSpanElement>) =>
                  setSearchFilter(searchFilter.filter((el, elIndex) => elIndex !== index))
                }
              ></div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
