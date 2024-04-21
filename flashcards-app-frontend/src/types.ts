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
