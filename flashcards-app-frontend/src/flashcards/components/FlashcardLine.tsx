import { useParams } from "react-router-dom";
import { Flashcard, User } from "../../types";
import { useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../../App";

export const FlashcardLine = ({
  flashcardData,
}: {
  flashcardData: Flashcard;
}) => {
  const { flashcardId } = useParams();
  const {
    user,
    deleteFlashcard,
    openFlashcard,
    editFlashcard,
    subscribeToFlashcard,
  }: {
    user: User;
    deleteFlashcard: (id: string) => void;
    openFlashcard: (id: string) => void;
    editFlashcard: (id: string) => void;
    subscribeToFlashcard: ({ _id, hasBeenRead, nextReviewDate }: Partial<Flashcard>) => void;
  } = useContext(ConfigContext);

  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const { current } = lineRef;
    if (current !== null && _id === flashcardId) {
      current.scrollIntoView({ behavior: "smooth", block:'nearest' });
    }
  }, [flashcardId]);

  const { _id, author, title, status, nextReviewDate, hasBeenRead } = flashcardData;

  const onEdit = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    editFlashcard(id);
  };

  const onDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteFlashcard(id);
  };

  const onSubscribe = (e: React.MouseEvent, { _id, hasBeenRead, nextReviewDate }: Partial<Flashcard>) => {
    e.stopPropagation();
    subscribeToFlashcard({ _id, hasBeenRead, nextReviewDate });
  };

  return (
    <div ref={lineRef} className={"line" + (_id === flashcardId ? " selectedFlashcard" : "")} onClick={() => openFlashcard(_id)}>
      <div className={"lineTitle" + (hasBeenRead ? " hasBeenRead" : "")}>{title}</div>
      <div className="lineOptions">
        {(user._id === author._id || status === "Published") && (
          <>
            {nextReviewDate instanceof Date && nextReviewDate.getTime() <= new Date().getTime() && (
              <div className="review"></div>
            )}
            <div
              className={"subscribe" + (nextReviewDate instanceof Date ? " subscribed" : "")}
              onClick={(e) => onSubscribe(e, { _id, hasBeenRead, nextReviewDate })}
            ></div>
          </>
        )}
        {user._id === author._id && (
          <>
            <div className="edit" onClick={(e) => onEdit(e, _id)}></div>
            <div className="delete" onClick={(e) => onDelete(e, _id)}></div>
          </>
        )}
      </div>
    </div>
  );
};
