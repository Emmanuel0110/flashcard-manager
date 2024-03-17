import { useContext } from "react";
import { Nav } from "react-bootstrap";
import { ConfigContext } from "../App";
import { Flashcard, OpenFlashcardData } from "../types";
import { useNavigate } from "react-router-dom";
import FlashcardDetail from "../flashcards/components/FlashcardDetail";
import FlashcardForm from "../flashcards/components/FlashcardForm";

function TabNav({ openedFlashcards, flashcardId }: { openedFlashcards: OpenFlashcardData[]; flashcardId: string }) {
  const {
    flashcards,
    setOpenedFlashcards,
  }: {
    flashcards: Flashcard[];
    setOpenedFlashcards: React.Dispatch<React.SetStateAction<OpenFlashcardData[]>>;
  } = useContext(ConfigContext);
  const navigate = useNavigate();
  const currentOpenedFlashcard = openedFlashcards.find((flashcard) => flashcard.id === flashcardId)!;
  const currentFlashcard = flashcards.find((flashcard) => flashcard._id === flashcardId)!;

  return (
    <div id="tabNav">
      <Nav variant="tabs" activeKey={flashcardId} onSelect={(selectedKey) => navigate("/flashcards/" + selectedKey!)}>
        {openedFlashcards.length > 0 &&
          openedFlashcards.map((openedFlashcard, index) => {
            const flashcard = flashcards.find((flashcard: Flashcard) => flashcard._id === openedFlashcard.id)!;
            return (
              <Nav.Item>
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
                                ? "/flashcards/" + (openedFlashcards[index + 1]?.id || openedFlashcards[index - 1]?.id)
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
            );
          })}
      </Nav>
      {currentOpenedFlashcard &&
        (currentOpenedFlashcard.unsavedData ? (
          <FlashcardForm flashcard={currentOpenedFlashcard.unsavedData} />
        ) : (
          <FlashcardDetail flashcard={currentFlashcard} />
        ))}
      {/* </Tabs> */}
    </div>
  );
}

export default TabNav;
