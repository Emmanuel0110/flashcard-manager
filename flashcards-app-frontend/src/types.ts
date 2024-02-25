

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
  tags: string[];
  status: "Draft" | "To be validated" | "Published" | "Obsolete";
  nextReviewDate: Date | undefined;
  hasBeenRead: boolean;
}