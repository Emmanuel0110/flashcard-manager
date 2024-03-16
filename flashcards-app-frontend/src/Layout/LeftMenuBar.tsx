import { Dispatch, SetStateAction, useContext } from "react";
import { Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "../App";
import { saveNewFlashcard } from "../flashcards/flashcardActions";
import { Flashcard, OpenFlashcardData } from "../types";

export const useSaveAsNewFlashcard = () => {
  const navigate = useNavigate();
  const { setFlashcards, setOpenedFlashcards } : {setFlashcards: Dispatch<SetStateAction<Flashcard[]>>; setOpenedFlashcards: Dispatch<SetStateAction<OpenFlashcardData[]>>;} = useContext(ConfigContext);
  return (infos: Partial<Flashcard>) => {
    saveNewFlashcard(infos)
      .then(({ data: newFlashcard }) => {
        setFlashcards((flashcards: Flashcard[]) => [...flashcards, newFlashcard]);
        setOpenedFlashcards((openedFlashcards) => [...openedFlashcards, { id: newFlashcard._id, unsavedData: newFlashcard }]);
        navigate("/flashcards/" + newFlashcard._id);
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };
};

function LeftMenuBar() {
  const { filter, setFilter } = useContext(ConfigContext);
  const saveAsNewFlashcard = useSaveAsNewFlashcard();

  const startReview = () => {
    setFilter("To be reviewed");
  };

  const openNewDraft = () => {
    saveAsNewFlashcard({ title: "", question: "", answer: "" });
  }

  return (
    <div id="leftSideMenu">
      <div id="leftSideMenuItems">
        <div>
          <Button style={{ margin: "0px 10px 6px" }} onClick={openNewDraft}>
            New flashcard
          </Button>
        </div>
        <div id="filterSection">
          <div onClick={() => setFilter("Published")}>
            <div className={filter === "Published" ? "selected" : "unselected"}></div>
            <div>All flashcards</div>
          </div>
          <div onClick={() => setFilter("Draft")}>
            <div className={filter === "Draft" ? "selected" : "unselected"}></div>
            <div>Drafts</div>
          </div>
          <div onClick={() => setFilter("To be validated")}>
            <div className={filter === "To be validated" ? "selected" : "unselected"}></div>
            <div>To be validated</div>
          </div>
          <div onClick={() => setFilter("My favorites")}>
            <div className={filter === "My favorites" ? "selected" : "unselected"}></div>
            <div>My favorites</div>
          </div>
        </div>
      </div>
      <div>
        <Button id="startAReviewButton" variant="outline-primary" onClick={startReview}>
          Start a review
        </Button>
      </div>
    </div>
  );
}

export default LeftMenuBar;
