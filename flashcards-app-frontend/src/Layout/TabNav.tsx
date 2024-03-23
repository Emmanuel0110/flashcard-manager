import { useContext } from "react";
import { Nav } from "react-bootstrap";
import { ConfigContext } from "../App";
import { Flashcard, OpenFlashcardData } from "../types";
import { useNavigate } from "react-router-dom";

function TabNav({
  openedFlashcards,
  currentFlashcardId,
}: {
  openedFlashcards: OpenFlashcardData[];
  currentFlashcardId: string;
}) {
  const {
    flashcards,
    setOpenedFlashcards,
  }: {
    flashcards: Flashcard[];
    setOpenedFlashcards: React.Dispatch<React.SetStateAction<OpenFlashcardData[]>>;
  } = useContext(ConfigContext);
  const navigate = useNavigate();

  return (
    <div id="tabNav">
      <div className="pannelHeader">
        <Nav
          variant="tabs"
          activeKey={currentFlashcardId}
          onSelect={(selectedKey) => navigate("/flashcards/" + selectedKey!)}
        >
          {openedFlashcards.length > 0 &&
            openedFlashcards.map((openedFlashcard, index) => {
              const flashcard = flashcards.find((flashcard: Flashcard) => flashcard._id === openedFlashcard.id);
              return flashcard ? (
                <Nav.Item key={index}>
                  <Nav.Link eventKey={flashcard._id}>
                    {
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
                                  ? "/flashcards/" +
                                      (openedFlashcards[index + 1]?.id || openedFlashcards[index - 1]?.id)
                                  : "/flashcards"
                              );
                            }}
                          >
                            <div className="tabClose"></div>
                          </div>
                        </div>
                      </>
                    }
                  </Nav.Link>
                </Nav.Item>
              ) : null;
            })}
        </Nav>
        {openedFlashcards.length > 1 && (
          <div
            id="pannelCloseContainer"
            onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
              navigate("/flashcards");
              setOpenedFlashcards([]);
            }}
          >
            <div className="pannelClose"></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default TabNav;
