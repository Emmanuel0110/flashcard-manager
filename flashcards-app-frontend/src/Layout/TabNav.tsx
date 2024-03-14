import { Children, useContext } from "react";
import { Button, Tab, Tabs } from "react-bootstrap";
import { Outlet } from "react-router";
import { ConfigContext } from "../App";
import { Flashcard } from "../types";
import { useNavigate, useParams } from "react-router-dom";
import FlashcardDetail from "../flashcards/components/FlashcardDetail";

function TabNav({ openedFlashcards, flashcardId }: { openedFlashcards: Flashcard[], flashcardId: string }) {
  const {
    setOpenedFlashcards,
  }: {
    setOpenedFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
  } = useContext(ConfigContext);
  const navigate = useNavigate();

  return (
    <div id="tabNav">
      <Tabs
        id="controlled-tab-example"
        activeKey={flashcardId}
        onSelect={(k) => navigate("/flashcards/" + k)}
        className="mb-3"
      >
        {openedFlashcards.map((flashcard, index) => (
          <Tab
            key={index}
            eventKey={flashcard._id}
            title={
              <>
                {flashcard.title.substring(0, 15) + "..."}
                <div className="tabCloseContainer">
                  <div
                    className="tabCloseHover"
                    onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                      e.stopPropagation();
                      setOpenedFlashcards((openedFlashcards) =>
                        openedFlashcards.filter((flashcard, indexOpenFlashcard) => indexOpenFlashcard !== index)
                      );
                      navigate(
                        openedFlashcards.length > 1
                          ? "/flashcards/" + (openedFlashcards[index + 1]?._id || openedFlashcards[index - 1]?._id)
                          : "/flashcards"
                      );
                    }}
                  >
                    <div className="tabClose"></div>
                  </div>
                </div>
              </>
            }
          >
            <FlashcardDetail flashcardId={flashcard._id} />
          </Tab>
        ))}
      </Tabs>
    </div>
  );
}

export default TabNav;
