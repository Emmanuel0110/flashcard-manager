import React, { createContext, useEffect, useMemo, useRef, useState } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import "./App.css";
import Register from "./auth/components/Register";
import Layout from "./Layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "./Profile";
import Login from "./auth/components/Login";
import { Flashcard, OpenFlashcardData, SearchFilter, Tag, User, View } from "./types";
import FlashcardList from "./flashcards/components/FlashcardList";
import { authHeaders, customFetch } from "./utils/http-helpers";
import FlashcardListWithDetail from "./flashcards/components/FlashcardListWithDetail";
import {
  deleteRemoteFlashcard,
  editRemoteFlashcard,
  fetchTags,
  getRemoteFlashcardById,
  saveNewFlashcard,
  subscribeToRemoteFlashcard,
} from "./flashcards/flashcardActions";

export let url = "/api/";

if (process.env.NODE_ENV === "production") {
  url = process.env.PUBLIC_URL + url;
}

export const ConfigContext = createContext(null as any);

export const updateListWithNewFlashcards = (flashcards: Flashcard[], newFlashcards: any): Flashcard[] => {
  return newFlashcards.reduce((acc: Flashcard[], value: any) => {
    value = { ...value, nextReviewDate: value.nextReviewDate ? new Date(value.nextReviewDate) : undefined };
    var index: number = acc.findIndex((flashcard) => flashcard._id === value._id);
    if (index === -1) {
      return [...acc, value];
    } else {
      acc.splice(index, 1, value);
      return [...acc];
    }
  }, flashcards);
};

export const someFilter = (searchFilter: SearchFilter, treeFilter: string[]): boolean =>
  searchFilter.length !== 0 || treeFilter.length !== 0;

const isFilteredBySearchFilter = (flashcard: Flashcard, searchFilter: SearchFilter) => {
  return searchFilter.every((el) =>
    el.some((filterString) => {
      if (filterString.toLowerCase().startsWith("not ")) {
        if (filterString.toLowerCase().slice(4).trim().startsWith("#")) {
          return !flashcard.tags.find(
            ({ label }) => label.toLowerCase() === filterString.toLowerCase().trim().slice(5)
          );
        } else {
          return !flashcard.title
            .toLowerCase()
            .includes(filterString.toLowerCase().trim().slice(4).replace(/^\"/, "").replace(/\"$/, ""));
        }
      } else {
        if (filterString.toLowerCase().trim().startsWith("#")) {
          return flashcard.tags.find(({ label }) => label.toLowerCase() === filterString.toLowerCase().trim().slice(1));
        } else {
          return (flashcard.question + flashcard.answer)
            .toLowerCase()
            .includes(filterString.toLowerCase().replace(/^\"/, "").replace(/\"$/, ""));
        }
      }
    })
  );
};

const isFiltered = (flashcard: Flashcard, searchFilter: SearchFilter, treeFilter: string[]) => {
  return (
    isFilteredBySearchFilter(flashcard, searchFilter) && (treeFilter.length === 0 || treeFilter.includes(flashcard._id))
  );
};

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(null as boolean | null);
  const [user, setUser] = useState(null as User | null);
  const [treeFilter, setTreeFilter] = useState<string[]>([]);
  const [searchFilter, setSearchFilter] = useState<SearchFilter>([]);
  const [flashcards, setFlashcards] = useState([] as Flashcard[]);
  const [openedFlashcards, setOpenedFlashcards] = useState([] as OpenFlashcardData[]);
  const [status, setStatus] = useState("Published");
  const [tags, setTags] = useState([] as Tag[]);
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      fetchTags().then((tags) => setTags(tags));
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated && filteredFlashcards.length < 30) {
      fetchMoreFlashcards(0, 30).then(() => {
        if (status === "To be reviewed" && filteredFlashcards.length > 0) {
          setOpenedFlashcards([]);
          navigate("/flashcards/" + filteredFlashcards[0]._id);
        }
      });
    }
  }, [status, searchFilter, isAuthenticated]);

  useEffect(() => {
    if (openedFlashcards.length !== 0) {
      setOpenedFlashcards((openFlashcards) =>
        openFlashcards.map((openFlashcard) => {
          const flashcard = flashcards.find(({ _id }) => _id === openFlashcard.id);
          return flashcard ? { ...openFlashcard, data: flashcard } : openFlashcard;
        })
      );
    }
  }, [flashcards]);

  const filteredFlashcards = useMemo(() => {
    console.log(searchFilter);
    return flashcards.filter((flashcard) => {
      return (
        ((status === "Draft" && flashcard.status === "Draft") ||
          (status === "To be validated" && flashcard.status === "To be validated") ||
          (status === "Published" && flashcard.status === "Published") ||
          (status === "My favorites" && flashcard.nextReviewDate instanceof Date) ||
          (status === "To be reviewed" &&
            flashcard.nextReviewDate instanceof Date &&
            flashcard.nextReviewDate.getTime() <= new Date().getTime())) &&
        (!someFilter(searchFilter, treeFilter) || isFiltered(flashcard, searchFilter, treeFilter))
      );
    });
  }, [flashcards, status, searchFilter, treeFilter]);

  const viewHistory = useRef<View[]>([]);
  const viewIndex = useRef(0);

  const location = useLocation();
  const preventHistorization = useRef(false);

  useEffect(() => {
    if (preventHistorization.current) {
      preventHistorization.current = false;
    } else {
      if (viewHistory.current.length > 0) {
        viewHistory.current = viewHistory.current.slice(0, viewIndex.current + 1);
      }
      viewIndex.current =
        viewHistory.current.push({
          openedFlashcards,
          status,
          searchFilter,
          treeFilter,
          location: location.pathname,
        }) - 1;
    }
  }, [location, status, searchFilter]);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        if (e.altKey) {
          e.preventDefault();
          if (viewIndex.current > 0) {
            viewIndex.current--;
            refreshView(viewIndex.current);
          }
        }
        break;
      case "ArrowRight":
        if (e.altKey) {
          e.preventDefault();
          if (viewIndex.current < viewHistory.current.length - 1) {
            viewIndex.current++;
            refreshView(viewIndex.current);
          }
        }
        break;
      default:
    }
  };

  const refreshView = (index: number) => {
    preventHistorization.current = true;
    const { openedFlashcards, status, searchFilter, treeFilter, location } = viewHistory.current[index];
    setOpenedFlashcards(openedFlashcards);
    setStatus(status);
    setSearchFilter(searchFilter);
    setTreeFilter(treeFilter);
    navigate(location);
  };

  const closeTab = (tabIndex: number) => {
    setOpenedFlashcards((openedFlashcards) =>
      openedFlashcards.filter((flashcard, indexOpenFlashcard) => indexOpenFlashcard !== tabIndex)
    );
    navigate(
      openedFlashcards.length > 1
        ? "/flashcards/" + (openedFlashcards[tabIndex + 1]?.id || openedFlashcards[tabIndex - 1]?.id)
        : "/flashcards"
    );
  };

  const fetchMoreFlashcards = (skip: number, limit: number) => {
    //Replace tag label by tag id
    const filter = searchFilter.map((el) =>
      el.map((el) =>
        el.replace(/\#\S+/, (substring) =>
          substring.length > 1 && tags.map(({ label }) => label).includes(substring.slice(1))
            ? "#" + tags.find(({ label }) => label === substring.slice(1))!._id
            : ""
        )
      )
    );
    return customFetch(url + "search", {
      method: "POST", // we want to GET flashcards but with a complex filter (string[][])
      headers: authHeaders(),
      body: JSON.stringify({ status, filter, skip, limit }),
    })
      .then((newFlashcards: any) => {
        setFlashcards((flashcards) => updateListWithNewFlashcards(flashcards, newFlashcards));
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };

  const deleteFlashcard = (flashcardId: string) => {
    deleteRemoteFlashcard(flashcardId).then((res) => {
      if (res.success) {
        setFlashcards((flashcards: Flashcard[]) => flashcards.filter((flashcard) => flashcard._id !== flashcardId));
        const tabIndex = openedFlashcards.findIndex(({ id }) => id === flashcardId);
        if (tabIndex >= 0) closeTab(tabIndex);
      }
    });
  };

  const openFlashcard = (flashcardId: string) => {
    const flashcard = flashcards.find(({ _id }) => _id === flashcardId);
    if (flashcard) {
      setOpenedFlashcards((openedFlashcards) =>
        openedFlashcards.find(({ id }) => id === flashcardId)
          ? openedFlashcards
          : [...openedFlashcards, { id: flashcardId, data: flashcard }]
      );
      navigate("/flashcards/" + flashcardId);
    }
  };

  const editFlashcard = (flashcardId: string) => {
    const flashcard = flashcards.find(({ _id }) => _id === flashcardId);
    if (flashcard) {
      setOpenedFlashcards((openedFlashcards) => {
        const openedFlashcard = openedFlashcards.find(({ id }) => id === flashcardId);
        if (openedFlashcard) {
          return openedFlashcard.unsavedData
            ? openedFlashcards
            : openedFlashcards.map((el) => (el.id === flashcardId ? { ...el, unsavedData: flashcard } : el));
        } else {
          return [...openedFlashcards, { id: flashcardId, data: flashcard, unsavedData: flashcard }];
        }
      });
      navigate("/flashcards/" + flashcardId);
    }
  };

  const editCurrentFlashcard = (flashcard: Flashcard) => {
    setOpenedFlashcards((openedFlashcards) =>
      openedFlashcards.map((openedFlashcard) =>
        openedFlashcard.id === flashcard._id ? { ...openedFlashcard, unsavedData: flashcard } : openedFlashcard
      )
    );
  };

  const subscribeToFlashcard = (flashcardToSubscribe: Flashcard) => {
    subscribeToRemoteFlashcard(flashcardToSubscribe).then((res) => {
      if (res.success) {
        setFlashcards((flashcards: Flashcard[]) =>
          flashcards.map((flashcard) => {
            return flashcard._id === flashcardToSubscribe._id
              ? { ...flashcard, nextReviewDate: flashcard.nextReviewDate instanceof Date ? undefined : new Date() }
              : flashcard;
          })
        );
      }
    });
  };

  const saveFlashcard = (infos: Partial<Flashcard>) => {
    editRemoteFlashcard(infos)
      .then(({ data: updatedFlashcard }: { data: Flashcard }) => {
        setFlashcards((flashcards: Flashcard[]) =>
          flashcards.map((flashcard) => {
            return flashcard._id === updatedFlashcard._id ? { ...flashcard, ...updatedFlashcard } : flashcard; //updatedFlashcard does not have hasBeenRead and nextReviewDate attributes, so we merge it in flashcard instead of replacing it
          })
        );
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };

  const saveAsNewFlashcard = (infos: Partial<Flashcard>): Promise<Flashcard> => {
    return saveNewFlashcard(infos)
      .then(({ data: newFlashcard }) => {
        setFlashcards((flashcards: Flashcard[]) => [...flashcards, newFlashcard]);
        setOpenedFlashcards((openedFlashcards) => [
          ...openedFlashcards,
          { id: newFlashcard._id, data: newFlashcard, unsavedData: newFlashcard },
        ]);
        navigate("/flashcards/" + newFlashcard._id);
        return newFlashcard;
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };

  const getFlashcardById = (id: string): Promise<Flashcard> => {
    const flashcard = flashcards.find(({ _id }) => _id === id);
    return flashcard
      ? Promise.resolve(flashcard)
      : getRemoteFlashcardById(id).then((flashcard) => {
          if (flashcard) {
            setFlashcards((flashcards) => updateListWithNewFlashcards(flashcards, [flashcard]));
            return flashcard;
          } else navigate("/flashcards");
        });
  };

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
        status,
        setStatus,
        tags,
        setTags,
        fetchMoreFlashcards,
        deleteFlashcard,
        closeTab,
        openFlashcard,
        editFlashcard,
        editCurrentFlashcard,
        subscribeToFlashcard,
        saveFlashcard,
        saveAsNewFlashcard,
        getFlashcardById,
        treeFilter,
        setTreeFilter,
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
