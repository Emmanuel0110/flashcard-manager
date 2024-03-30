import React, { Dispatch, SetStateAction, createContext, useEffect, useMemo, useState } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import "./App.css";
import Register from "./auth/components/Register";
import Layout from "./Layout/Layout";
import ProtectedRoute from "./ProtectedRoute";
import Profile from "./Profile";
import Login from "./auth/components/Login";
import { Flashcard, OpenFlashcardData, SearchFilter, Tag, User } from "./types";
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

export const fetchMoreFlashcards = (
  url: string,
  setFlashcards: Dispatch<SetStateAction<Flashcard[]>>,
  skip: number,
  limit: number
) => {
  return customFetch(url + `&skip=${skip}&limit=${limit}`, { headers: authHeaders() })
    .then((newFlashcards: any) => {
      setFlashcards((flashcards) => updateListWithNewFlashcards(flashcards, newFlashcards));
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
  const [openedFlashcards, setOpenedFlashcards] = useState([] as OpenFlashcardData[]);
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
      if (filter === "To be reviewed" && filteredFlashcards.length > 0) {
        setOpenedFlashcards([]);
        navigate("/flashcards/" + filteredFlashcards[0]._id);
      }
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

  const subscribeToFlashcard = ({ _id, hasBeenRead, nextReviewDate }: Partial<Flashcard>) => {
    subscribeToRemoteFlashcard({ _id, hasBeenRead, nextReviewDate }).then((res) => {
      if (res.success) {
        setFlashcards((flashcards: Flashcard[]) =>
          flashcards.map((flashcard) => {
            return flashcard._id === _id
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

  const saveAsNewFlashcard = (infos: Partial<Flashcard>) => {
    saveNewFlashcard(infos)
      .then(({ data: newFlashcard }) => {
        setFlashcards((flashcards: Flashcard[]) => [...flashcards, newFlashcard]);
        setOpenedFlashcards((openedFlashcards) => [
          ...openedFlashcards,
          { id: newFlashcard._id, data: newFlashcard, unsavedData: newFlashcard },
        ]);
        navigate("/flashcards/" + newFlashcard._id);
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
        filter,
        setFilter,
        tags,
        setTags,
        deleteFlashcard,
        closeTab,
        openFlashcard,
        editFlashcard,
        editCurrentFlashcard,
        subscribeToFlashcard,
        saveFlashcard,
        saveAsNewFlashcard,
        getFlashcardById,
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
