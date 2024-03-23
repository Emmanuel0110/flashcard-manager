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
  prerequisites: string[];
  usedIn: string[];
}

export interface Tag {
  _id: string;
  label: string;
}

export interface SearchFilter {
  searchString?: string;
  tag?: Tag;
}

export interface OpenFlashcardData {
  id: string;
  unsavedData?: Flashcard;
}
