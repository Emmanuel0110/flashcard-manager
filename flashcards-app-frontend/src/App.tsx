import React, { Dispatch, SetStateAction, createContext, useEffect, useMemo, useState } from "react";
import { Routes, Route } from "react-router-dom";
import "./App.css";
import Register from "./auth/components/Register";
import Layout from "./Layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "./Profile";
import Login from "./auth/components/Login";
import { Flashcard, User } from "./types";
import FlashcardForm from "./flashcards/components/FlashcardForm";
import Flashcards from "./flashcards/components/Flashcards";
import FlashcardComponent from "./flashcards/components/FlashcardComponent";
import { authHeaders, customFetch } from "./utils/http-helpers";

export let url = "/api/";

if (process.env.NODE_ENV === "production") {
  url = process.env.PUBLIC_URL + url;
}

export const ConfigContext = createContext(null as any);

export const fetchMoreFlashcards = (url: string, setFlashcards : Dispatch<SetStateAction<Flashcard[]>>, skip: number, limit: number) => {
  return customFetch(url + `&skip=${skip}&limit=${limit}`, { headers: authHeaders() })
      .then((data: any) => {
        setFlashcards((flashcards) => {
          return data.reduce((acc: Flashcard[], value: any) => {
            value = {...value, nextReviewDate: value.nextReviewDate ? new Date(value.nextReviewDate) : undefined}
            var index: number = acc.findIndex(flashcard => flashcard._id === value._id);
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
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null as boolean | null);
  const [user, setUser] = useState(null as User | null);
  const [searchFilter, setSearchFilter] = useState("");
  const [flashcards, setFlashcards] = useState([] as Flashcard[]);
  const [filter, setFilter] = useState("Published");

  useEffect(() => {
    fetchMoreFlashcards(url + "flashcards?filter=" + filter + (searchFilter !== "" ? ("&searchFilter=" + searchFilter) : ""), setFlashcards, 0, 20);
  }, [filter, searchFilter, isAuthenticated]);

  const filteredFlashcards = useMemo(() => {
    return flashcards.filter(flashcard => {
      return ((filter === "Draft" && flashcard.status === "Draft") ||
      (filter === "To be validated" && flashcard.status === "To be validated") ||
      (filter === "Published" && flashcard.status === "Published") ||
      (filter === "To be reviewed" && flashcard.nextReviewDate instanceof Date && flashcard.nextReviewDate.getTime() <= new Date().getTime())) &&
      (searchFilter === "" || flashcard.title.toLowerCase().includes(searchFilter.toLowerCase()));
    });
  }, [flashcards, filter]);

  return (
    <ConfigContext.Provider
      value={{
        filteredFlashcards,
        setFlashcards,
        isAuthenticated,
        setIsAuthenticated,
        searchFilter,
        setSearchFilter,
        user,
        setUser,
        filter,
        setFilter,
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
            <Route path="flashcards" element={<Flashcards filteredFlashcards={filteredFlashcards} />} />
            <Route path="flashcards/:flashcardId" element={<FlashcardComponent />} />
            <Route path="flashcards/:flashcardId/edit" element={<FlashcardForm />} />
            <Route path="flashcards/new" element={<FlashcardForm />} />
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
