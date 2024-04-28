import { useParams } from "react-router-dom";
import { Flashcard } from "../../types";
import { useContext, useEffect, useRef } from "react";
import { ConfigContext } from "../../App";
import { Context } from "../../types";

export const FlashcardLine = ({ flashcardData }: { flashcardData: Flashcard }) => {
  const { flashcardId } = useParams();
  const { user, deleteFlashcard, openFlashcard, editFlashcard, subscribeToFlashcard } = useContext(
    ConfigContext
  ) as Context;

  const lineRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const { current } = lineRef;
    if (current !== null && _id === flashcardId) {
      current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [flashcardId]);

  const { _id, author, title, status, nextReviewDate, hasBeenRead, learntDate } = flashcardData;

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
    <div
      ref={lineRef}
      className={"line" + (_id === flashcardId ? " selectedFlashcard" : "")}
      onClick={() => openFlashcard(_id)}
    >
      <div className={"lineTitle" + (hasBeenRead ? " hasBeenRead" : "")}>{title}</div>
      <div className="lineOptions">
        {(user!._id === author._id || status === "Published") && (
          <>
            {learntDate instanceof Date ? (
              <div className="learnt"></div>
            ) : nextReviewDate instanceof Date && nextReviewDate.getTime() <= new Date().getTime() ? (
              <div className="review"></div>
            ) : null}
            <div
              className={"subscribe" + (nextReviewDate instanceof Date ? " subscribed" : "")}
              onClick={(e) => onSubscribe(e, { _id, hasBeenRead, nextReviewDate })}
            ></div>
          </>
        )}
        {user!._id === author._id && (
          <>
            <div className="edit" onClick={(e) => onEdit(e, _id)}></div>
            <div className="delete" onClick={(e) => onDelete(e, _id)}></div>
          </>
        )}
      </div>
    </div>
  );
};
