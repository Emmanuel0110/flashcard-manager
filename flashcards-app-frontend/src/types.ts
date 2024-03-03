

export interface User {
  _id: string;
  username: string;
}

export interface Flashcard {
  _id: string;
  author: {_id: string, name: string};
  title: string;
  question: string;
  answer: string;
  tags: Tag[];
  status: "Draft" | "To be validated" | "Published" | "Obsolete";
  nextReviewDate: Date | undefined;
  hasBeenRead: boolean;
}

export interface Tag {
  _id: string;
  label: string;
}

export interface SearchFilter {
  searchString?: string;
  tag?: Tag;
}