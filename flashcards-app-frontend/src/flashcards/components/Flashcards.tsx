import { useContext } from "react";
import { Flashcard } from "../../types";
import { ConfigContext, fetchMoreFlashcards, url } from "../../App";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import { deleteRemoteFlashcard, subscribeToRemoteFlashcard } from "../flashcardActions";
import InfiniteScrollComponent from "../../utils/InfiniteScrollComponent";
import FilterBar from "./FilterBar";
import useSplitPane from "../../utils/useSplitPane";

export default function Flashcards({ filteredFlashcards }: { filteredFlashcards: Flashcard[] }) {
  const { flashcardId } = useParams();
  const { user, flashcards, setFlashcards, setOpenedFlashcards, filter } = useContext(ConfigContext);
  const navigate = useNavigate();

  const openFlashcard = (id: string) => {
    setOpenedFlashcards((openedFlashcards: Flashcard[]) =>
      openedFlashcards.find((flashcard) => flashcard._id === id)
        ? openedFlashcards
        : [...openedFlashcards, flashcards.find((el: Flashcard) => el._id === id)]
    );
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

  useSplitPane(["#left", "#right"], "horizontal", [50, 50], !!flashcardId);

  return (
    <div id="splitContainer">
      <div id="left">
        <InfiniteScrollComponent
          skip={filteredFlashcards.length}
          callback={(skip: number, limit: number) =>
            fetchMoreFlashcards(url + "flashcards?filter=" + filter, setFlashcards, skip, limit)
          }
        >
          <FilterBar />
          <div id="flashcardList">
            {filteredFlashcards.map((flashcard, index) => (
              <div
                key={index}
                className={"line" + (flashcard._id === flashcardId ? " selectedFlashcard" : "")}
                onClick={() => openFlashcard(flashcard._id)}
              >
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
      </div>
      <div id="right">
        <div id="openedFlashcard">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
