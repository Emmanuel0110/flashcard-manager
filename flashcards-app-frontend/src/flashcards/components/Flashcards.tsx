import { useContext, useRef } from "react";
import { Flashcard } from "../../types";
import { ConfigContext, fetchMoreFlashcards, url } from "../../App";
import { useNavigate } from "react-router-dom";
import { deleteRemoteFlashcard, subscribeToRemoteFlashcard } from "../flashcardActions";
import InfiniteScrollComponent from "../../utils/InfiniteScrollComponent";
import { Button } from "react-bootstrap";

export default function Flashcards({ filteredFlashcards }: { filteredFlashcards: Flashcard[] }) {
  const { user, setFlashcards, filter, setFilter } = useContext(ConfigContext);
  const navigate = useNavigate();

  const openFlashcard = (id: string) => {
    navigate("/flashcards/" + id);
  };

  const editFlashcard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigate("/flashcards/" + id + "/edit");
  };

  const deleteFlashcard = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteRemoteFlashcard(id).then((res) => {
      if (res.success) {
        setFlashcards((flashcards: Flashcard[]) => flashcards.filter((flashcard) => flashcard._id !== id));
      }
    });
  };

  const subscribeToFlashcard = (e: React.MouseEvent, flashcardToSubscribe: Flashcard) => {
    e.stopPropagation();
    subscribeToRemoteFlashcard(flashcardToSubscribe).then((res) => {
      if (res.success) {
        setFlashcards((flashcards: Flashcard[]) =>
          flashcards.map((flashcard) => {
            return flashcard._id === flashcardToSubscribe._id
              ? { ...flashcard, nextReviewDate: flashcard.nextReviewDate instanceof Date ? undefined : new Date() }
              : flashcard;
          })
        );
      }
    });
  };

  const startReview = () => {
    setFilter("To be reviewed");
  }

  return (
    <InfiniteScrollComponent
      skip={filteredFlashcards.length}
      callback={(skip: number, limit: number) =>
        fetchMoreFlashcards(url + "flashcards?filter=" + filter, setFlashcards, skip, limit)
      }
    >
      <div id="flashcardList">
        {filter === "My favorites" && <div className="buttonHeader">
           <Button onClick={startReview}>Start a review</Button>
        </div>}
        {filteredFlashcards.map((flashcard, index) => (
          <div key={index} className="line" onClick={() => openFlashcard(flashcard._id)}>
            <div className={"lineTitle" + (flashcard.hasBeenRead ? " hasBeenRead" : "")}>{flashcard.title}</div>
            <div className="lineOptions">
              {(user._id === flashcard.author._id || flashcard.status === "Published") && (
                <>
                  {flashcard.nextReviewDate instanceof Date &&
                    flashcard.nextReviewDate.getTime() <= new Date().getTime() && <div className="review"></div>}
                  <div
                    className={"subscribe" + (flashcard.nextReviewDate instanceof Date ? " subscribed" : "")}
                    onClick={(e) => subscribeToFlashcard(e, flashcard)}
                  ></div>
                </>
              )}
              {user._id === flashcard.author._id && (
                <>
                  <div className="edit" onClick={(e) => editFlashcard(e, flashcard._id)}></div>
                  <div className="delete" onClick={(e) => deleteFlashcard(e, flashcard._id)}></div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </InfiniteScrollComponent>
  );
}
