import React, { Component, useContext } from "react";
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
        {Object.entries(searchFilter)
          .filter(([key, value]) => (key === "searchString" && value !== "") || (key === "tag" && value !== undefined)) // TODO : refactor
          .map(([key, value], index) => {
            return (
              <li key={index} className="filterItem">
                {`${key === "searchString" ? value : key === "tag" ? "#" + value.label : ""}`}
                <div
                  className="filterClose"
                  onClick={(e: React.MouseEvent<HTMLSpanElement>) =>
                    setSearchFilter(
                      key === "searchString"
                        ? { ...searchFilter, searchString: "" }
                        : key === "tag"
                        ? { ...searchFilter, tag: undefined }
                        : searchFilter
                    )
                  }
                ></div>
              </li>
            );
          })}
      </ul>
    </>
  );
}
