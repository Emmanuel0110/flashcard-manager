import { useContext, useEffect } from "react";
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

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [openedFlashcards, currentFlashcardId]);

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "q":
        if (e.ctrlKey) {
          e.preventDefault();
          closeTab(openedFlashcards.findIndex(({id}) => id === currentFlashcardId));
        }
        break;
    }
  };

  const closeOtherTabs = (e: React.MouseEvent<HTMLElement>, index: number) => {
    e.preventDefault();
    navigate("/flashcards/" + openedFlashcards[index].id);
    setOpenedFlashcards([openedFlashcards[index]]);
  }

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
              return (<div key={index} onContextMenu={(e) => closeOtherTabs(e, index)}>
                <Nav.Item>
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
                          {openedFlashcard.unsavedData && <div className="dot"></div>}
                        </div>
                      </>
                    }
                  </Nav.Link>
                </Nav.Item>
                </div>
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
