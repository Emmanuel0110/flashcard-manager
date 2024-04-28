import { Dispatch, SetStateAction } from "react";

export interface User {
  _id: string;
  username: string;
}

export type Status = "Draft" | "To be validated" | "Published" | "Obsolete";

export interface Flashcard {
  _id: string;
  author: { _id: string; name: string };
  title: string;
  question: string;
  answer: string;
  tags: Tag[];
  status: Status;
  nextReviewDate: Date | undefined;
  hasBeenRead: boolean;
  submitDate: Date | undefined;
  publishDate: Date | undefined;
  publishAuthor: { _id: string; name: string };
  lastModificationDate: Date | undefined;
  learntDate: Date | undefined;
  prerequisites: string[];
  usedIn: string[];
}

export interface Tag {
  _id: string;
  label: string;
}

export type SearchFilter = { isActive: boolean; data: string[] }[];

export interface OpenFlashcardData {
  id: string;
  data: Flashcard;
  unsavedData?: Flashcard;
}

export interface View {
  openedFlashcards: OpenFlashcardData[];
  status: string;
  searchFilter: SearchFilter;
  treeFilter: string[];
  location: string;
}

export interface Context {
  flashcards: Flashcard[];
  filteredFlashcards: Flashcard[];
  setFlashcards: Dispatch<SetStateAction<Flashcard[]>>;
  openedFlashcards: OpenFlashcardData[];
  setOpenedFlashcards: Dispatch<SetStateAction<OpenFlashcardData[]>>;
  isAuthenticated: boolean | null;
  setIsAuthenticated: Dispatch<SetStateAction<boolean | null>>;
  searchFilter: SearchFilter;
  setSearchFilter: Dispatch<SetStateAction<SearchFilter>>;
  user: User | null;
  setUser: Dispatch<SetStateAction<User | null>>;
  status: string;
  setStatus: Dispatch<SetStateAction<string>>;
  tags: Tag[];
  setTags: Dispatch<SetStateAction<Tag[]>>;
  fetchMoreFlashcards: (skip: number, limit: number) => Promise<any>;
  deleteFlashcard: (id: string) => void;
  closeTab: (index: number) => void;
  openFlashcard: (id: string) => void;
  editFlashcard: (id: string) => void;
  editCurrentFlashcard: (flashcard: Flashcard) => void;
  subscribeToFlashcard: ({ _id, hasBeenRead, nextReviewDate }: Partial<Flashcard>) => void;
  saveFlashcard: (infos: Partial<Flashcard>) => void;
  saveAsNewFlashcard: (infos: Partial<Flashcard>) => Promise<Flashcard>;
  getFlashcardById: (id: string) => Promise<Flashcard>;
  treeFilter: string[];
  setTreeFilter: Dispatch<SetStateAction<string[]>>;
  searchInput: string;
  setSearchInput: Dispatch<SetStateAction<string>>;
}