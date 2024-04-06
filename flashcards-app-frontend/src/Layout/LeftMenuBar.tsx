import { useContext, useEffect } from "react";
import { Button } from "react-bootstrap";
import { ConfigContext } from "../App";
import { Flashcard, OpenFlashcardData } from "../types";

function LeftMenuBar() {
  const {
    filter,
    setFilter,
    saveAsNewFlashcard,
  }: {
    filter: string;
    setFilter: React.Dispatch<React.SetStateAction<string>>;
    saveAsNewFlashcard: (infos: Partial<Flashcard>) => Promise<Flashcard>;
  } = useContext(ConfigContext);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "m":
        if (e.ctrlKey) {
          e.preventDefault();
          openNewDraft();
        }
        break;
    }
  };
  
  const startReview = () => {
    setFilter("To be reviewed");
  };

  const openNewDraft = () => {
    saveAsNewFlashcard({ title: "", question: "", answer: "", prerequisites: [] });
  };

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
