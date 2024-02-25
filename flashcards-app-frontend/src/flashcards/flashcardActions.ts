import { url } from "../App";
import { authHeaders, customFetch } from "../utils/http-helpers";
import { Flashcard } from "../types";

export const save = async ({ title, question, answer }: { title: string; question: string; answer: string }) => {
  const body = JSON.stringify({ title, question, answer });
  return customFetch(url + "flashcards", { method: "POST", headers: authHeaders(), body });
};

export const edit = async ({ _id, ...args }: Partial<Flashcard>) => {
  const body = JSON.stringify(args);
  return customFetch(url + "flashcards/" + _id, { method: "PUT", headers: authHeaders(), body });
};

export const deleteRemoteFlashcard = async (flashcardId: string) => {
  return customFetch(url + "flashcards/" + flashcardId, { method: "DELETE", headers: authHeaders() });
};

export const subscribeToRemoteFlashcard = async (flashcard: Flashcard) => {
  const body = JSON.stringify({
    hasBeenRead: flashcard.hasBeenRead,
    nextReviewDate: flashcard.nextReviewDate == null ? new Date() : null,
  });
  return customFetch(url + "userflashcardinfo/" + flashcard._id, { method: "PUT", headers: authHeaders(), body });
};

export const editUserFlashcardInfo = async({_id, ...body}: any) => {
  return customFetch(url + "userflashcardinfo/" + _id, { method: "PATCH", headers: authHeaders(), body: JSON.stringify(body) });
};

export const readRemoteFlashcard = async (flashcard: Flashcard) => {
  const body = JSON.stringify({ hasBeenRead: true, nextReviewDate: flashcard.nextReviewDate });
  return customFetch(url + "userflashcardinfo/" + flashcard._id, { method: "PUT", headers: authHeaders(), body });
};
