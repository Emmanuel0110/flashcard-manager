import { useNavigate, useParams } from "react-router-dom";
import { deleteRemoteFlashcard, subscribeToRemoteFlashcard } from "../flashcardActions";
import { Flashcard, OpenFlashcardData, User } from "../../types";
import { useContext } from "react";
import { ConfigContext } from "../../App";

export const FlashcardLine = ({
  flashcardData,
}: {
  flashcardData: {
    _id: string;
    authorId: string;
    title: string;
    status: string;
    nextReviewDate: Date | undefined;
    hasBeenRead: boolean;
  };
}) => {
  const { flashcardId } = useParams();
  const {
    user,
    flashcards,
    setFlashcards,
    setOpenedFlashcards,
  }: {
    user: User;
    flashcards: Flashcard[];
    setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
    setOpenedFlashcards: React.Dispatch<React.SetStateAction<OpenFlashcardData[]>>;
  } = useContext(ConfigContext);
  const navigate = useNavigate();

  const { _id, authorId, title, status, nextReviewDate, hasBeenRead } = flashcardData;

  const openFlashcard = (id: string) => {
    setOpenedFlashcards((openedFlashcards) =>
      openedFlashcards.find((flashcard) => flashcard.id === id)
        ? openedFlashcards
        : [...openedFlashcards, { id: flashcards.find((el: Flashcard) => el._id === id)!._id }]
    );
    navigate("/flashcards/" + id);
  };

  const editFlashcard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setOpenedFlashcards((openedFlashcards) => {
      const flashcard = flashcards.find((el) => el._id === id)!;
      const openedFlashcard = openedFlashcards.find((el) => el.id === id);
      if (openedFlashcard) {
        return openedFlashcard.unsavedData
          ? openedFlashcards
          : openedFlashcards.map((el) => (el.id === id ? { ...el, unsavedData: flashcard } : el));
      } else {
        return [...openedFlashcards, { id: flashcard._id, unsavedData: flashcard }];
      }
    });
    navigate("/flashcards/" + id);
  };

  const deleteFlashcard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteRemoteFlashcard(id).then((res) => {
      if (res.success) {
        setFlashcards((flashcards: Flashcard[]) => flashcards.filter((flashcard) => flashcard._id !== id));
      }
    });
  };

  const subscribeToFlashcard = (e: React.MouseEvent, { _id, hasBeenRead, nextReviewDate }: Partial<Flashcard>) => {
    e.stopPropagation();
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

  return (
    <div className={"line" + (_id === flashcardId ? " selectedFlashcard" : "")} onClick={() => openFlashcard(_id)}>
      <div className={"lineTitle" + (hasBeenRead ? " hasBeenRead" : "")}>{title}</div>
      <div className="lineOptions">
        {(user._id === authorId || status === "Published") && (
          <>
            {nextReviewDate instanceof Date && nextReviewDate.getTime() <= new Date().getTime() && (
              <div className="review"></div>
            )}
            <div
              className={"subscribe" + (nextReviewDate instanceof Date ? " subscribed" : "")}
              onClick={(e) => subscribeToFlashcard(e, { _id, hasBeenRead })}
            ></div>
          </>
        )}
        {user._id === authorId && (
          <>
            <div className="edit" onClick={(e) => editFlashcard(e, _id)}></div>
            <div className="delete" onClick={(e) => deleteFlashcard(e, _id)}></div>
          </>
        )}
      </div>
    </div>
  );
};
