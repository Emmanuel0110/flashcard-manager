import React, { Dispatch, SetStateAction, createContext, useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Register from "./auth/components/Register";
import Layout from "./Layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "./Profile";
import Login from "./auth/components/Login";
import { Flashcard, SearchFilter, Tag, User } from "./types";
import FlashcardList from "./flashcards/components/FlashcardList";
import { authHeaders, customFetch } from "./utils/http-helpers";
import FlashcardListWithDetail from "./flashcards/components/FlashcardListWithDetail";

export let url = "/api/";

if (process.env.NODE_ENV === "production") {
  url = process.env.PUBLIC_URL + url;
}

export const ConfigContext = createContext(null as any);

export const fetchTags = () => {
  return customFetch(url + "tags", { headers: authHeaders() }).catch((err: Error) => {
    console.log(err);
  });
};

export const fetchMoreFlashcards = (
  url: string,
  setFlashcards: Dispatch<SetStateAction<Flashcard[]>>,
  skip: number,
  limit: number
) => {
  return customFetch(url + `&skip=${skip}&limit=${limit}`, { headers: authHeaders() })
    .then((data: any) => {
      setFlashcards((flashcards) => {
        return data.reduce((acc: Flashcard[], value: any) => {
          value = { ...value, nextReviewDate: value.nextReviewDate ? new Date(value.nextReviewDate) : undefined };
          var index: number = acc.findIndex((flashcard) => flashcard._id === value._id);
          if (index === -1) {
            return [...acc, value];
          } else {
            acc.splice(index, 1, value);
            return [...acc];
          }
        }, flashcards);
      });
    })
    .catch((err: Error) => {
      console.log(err);
    });
};

export const emptyFilter: SearchFilter = { searchString: "", tag: undefined };
export const someFilter = (searchFilter: SearchFilter): boolean =>
  searchFilter.searchString !== "" || searchFilter.tag !== undefined;

const isFiltered = (flashcard: Flashcard, searchFilter: SearchFilter) => {
  const { searchString, tag } = searchFilter;
  return (
    (!searchString || flashcard.title.toLowerCase().includes(searchString.toLowerCase())) &&
    (!tag || flashcard.tags.map((tag) => tag._id).includes(tag._id))
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null as boolean | null);
  const [user, setUser] = useState(null as User | null);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>({ searchString: "", tag: undefined });
  const [flashcards, setFlashcards] = useState([] as Flashcard[]);
  const [openedFlashcards, setOpenedFlashcards] = useState([] as {id: string, edit: boolean}[]);
  const [filter, setFilter] = useState("Published");
  const [tags, setTags] = useState([] as Tag[]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTags().then((tags) => setTags(tags));
  }, [isAuthenticated]);

  useEffect(() => {
    const { searchString, tag } = searchFilter;
    fetchMoreFlashcards(
      url +
        "flashcards?filter=" +
        filter +
        (searchString ? "&searchString=" + searchString : "") +
        (tag ? "&tagId=" + tag._id : ""),
      setFlashcards,
      0,
      30
    ).then(() => {
      if (filter === "To be reviewed" && filteredFlashcards.length > 0)
        navigate("/flashcards/" + filteredFlashcards[0]._id);
    });
  }, [filter, searchFilter, isAuthenticated]);

  const filteredFlashcards = useMemo(() => {
    return flashcards.filter((flashcard) => {
      return (
        ((filter === "Draft" && flashcard.status === "Draft") ||
          (filter === "To be validated" && flashcard.status === "To be validated") ||
          (filter === "Published" && flashcard.status === "Published") ||
          (filter === "My favorites" && flashcard.nextReviewDate instanceof Date) ||
          (filter === "To be reviewed" &&
            flashcard.nextReviewDate instanceof Date &&
            flashcard.nextReviewDate.getTime() <= new Date().getTime())) &&
        (!someFilter(searchFilter) || isFiltered(flashcard, searchFilter))
      );
    });
  }, [flashcards, filter, searchFilter]);

  return (
    <ConfigContext.Provider
      value={{
        flashcards,
        filteredFlashcards,
        setFlashcards,
        openedFlashcards,
        setOpenedFlashcards,
        isAuthenticated,
        setIsAuthenticated,
        searchFilter,
        setSearchFilter,
        user,
        setUser,
        filter,
        setFilter,
        tags,
        setTags,
      }}
    >
      <Routes>
        <Route
          path="register/*"
          element={
            <Register isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          }
        />
        <Route
          path="login/*"
          element={
            <Login isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
          }
        />
        <Route
          element={
            <ProtectedRoute
              isAuthenticated={isAuthenticated}
              setIsAuthenticated={setIsAuthenticated}
              setUser={setUser}
              redirectPath={"login"}
            />
          }
        >
          <Route element={<Layout />}>
            <Route path="flashcards" element={<FlashcardList filteredFlashcards={filteredFlashcards} />} />
            <Route
              path="flashcards/:flashcardId"
              element={
                <FlashcardListWithDetail filteredFlashcards={filteredFlashcards} openedFlashcards={openedFlashcards} />
              }
            />
            <Route path="profile" element={<Profile />} />
            <Route
              path="/"
              element={
                <Login isAuthenticated={isAuthenticated} setIsAuthenticated={setIsAuthenticated} setUser={setUser} />
              }
            />
          </Route>
        </Route>
        <Route path="*" element={<p>There's nothing here: 404!</p>} />
      </Routes>
    </ConfigContext.Provider>
  );
}
