import { url } from "../App";
import { authHeaders, customFetch } from "../utils/http-helpers";
import { Flashcard } from "../types";

export const getRemoteFlashcardById = async (id: string) => {
  return customFetch(url + "flashcards/" + id, { method: "GET", headers: authHeaders() });
};

export const saveNewFlashcard = async (args: Partial<Flashcard>) => {
  const formattedArgs = { ...args, tags: args.tags?.map((tag) => tag._id) || [] };
  const body = JSON.stringify(formattedArgs);
  return customFetch(url + "flashcards", { method: "POST", headers: authHeaders(), body });
};

export const editRemoteFlashcard = async ({ _id, ...args }: Partial<Flashcard>) => {
  const formattedArgs = {
    ...args,
    ...(args.tags ? { tags: args.tags.map((tag) => tag._id) } : {}),
    ...(args.publishAuthor ? { publishAuthor: args.publishAuthor._id } : {}),
  };
  const body = JSON.stringify(formattedArgs);
  return customFetch(url + "flashcards/" + _id, { method: "PATCH", headers: authHeaders(), body });
};

export const deleteRemoteFlashcard = async (flashcardId: string) => {
  return customFetch(url + "flashcards/" + flashcardId, { method: "DELETE", headers: authHeaders() });
};

export const subscribeToRemoteFlashcard = async ({ _id, hasBeenRead, nextReviewDate }: Partial<Flashcard>) => {
  const body = JSON.stringify({
    hasBeenRead,
    nextReviewDate: nextReviewDate ? null : new Date(),
    subscriptionDate: nextReviewDate ? null : new Date(),
  });
  return customFetch(url + "userflashcardinfo/" + _id, { method: "PUT", headers: authHeaders(), body });
};

export const editUserFlashcardInfo = async ({ _id, ...body }: any) => {
  return customFetch(url + "userflashcardinfo/" + _id, {
    method: "PATCH",
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
};

export const readRemoteFlashcard = async (flashcard: Flashcard) => {
  const body = JSON.stringify({ hasBeenRead: true, nextReviewDate: flashcard.nextReviewDate });
  return customFetch(url + "userflashcardinfo/" + flashcard._id, { method: "PUT", headers: authHeaders(), body });
};

export const saveNewTag = async ({ label }: { label: string }) => {
  const body = JSON.stringify({ label });
  return customFetch(url + "tags", { method: "POST", headers: authHeaders(), body });
};

export const getRemotePrerequisiteAndUsedIn = async (ids: string[]): Promise<Flashcard[]> => {
  return customFetch(url + "search", {
    method: "POST", // we want to GET flashcards but sometimes with a complex filter (string[][])
    headers: authHeaders(),
    body: JSON.stringify({ prerequisitesAndUsedIn: ids }),
  });
};

export const fetchTags = () => {
  return customFetch(url + "tags", { headers: authHeaders() }).catch((err: Error) => {
    console.log(err);
  });
};
