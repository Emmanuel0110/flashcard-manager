import { useContext } from "react";
import { Tab, Tabs } from "react-bootstrap";
import { ConfigContext } from "../App";
import { Flashcard } from "../types";
import { useNavigate } from "react-router-dom";
import FlashcardDetail from "../flashcards/components/FlashcardDetail";

function TabNav({
  openedFlashcards,
  flashcardId,
}: {
  openedFlashcards: { id: string; edit: boolean }[];
  flashcardId: string;
}) {
  const {
    flashcards,
    setOpenedFlashcards,
  }: {
    flashcards: Flashcard[];
    setOpenedFlashcards: React.Dispatch<
      React.SetStateAction<
        {
          id: string;
          edit: boolean;
        }[]
      >
    >;
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
        {openedFlashcards.map((openedFlashcard, index) => {
          const flashcard = flashcards.find((flashcard: Flashcard) => flashcard._id === openedFlashcard.id)!;

          return (
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
            >
              <FlashcardDetail flashcard={flashcard} />
            </Tab>
          );
        })}
      </Tabs>
    </div>
  );
}

export default TabNav;
