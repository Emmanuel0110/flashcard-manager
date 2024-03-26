import { useContext } from "react";
import { Nav } from "react-bootstrap";
import { ConfigContext } from "../App";
import { OpenFlashcardData } from "../types";
import { useNavigate } from "react-router-dom";

function TabNav({
  openedFlashcards,
  currentFlashcardId,
}: {
  openedFlashcards: OpenFlashcardData[];
  currentFlashcardId: string;
}) {
  const {
    setOpenedFlashcards,
    closeTab,
  }: {
    setOpenedFlashcards: React.Dispatch<React.SetStateAction<OpenFlashcardData[]>>;
    closeTab: (index: number) => void;
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
              return (
                <Nav.Item key={index}>
                  <Nav.Link eventKey={openedFlashcard.data._id}>
                    {
                      <>
                        {openedFlashcard.data.title.substring(0, 15) + "..."}
                        <div className="tabCloseContainer">
                          <div
                            className="tabCloseHover"
                            onClick={(e: React.MouseEvent<HTMLSpanElement>) => {
                              e.stopPropagation();
                              closeTab(index);
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
