import { useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ConfigContext } from "../../App";
import { Context } from "../../types";
import { Flashcard } from "../../types";
import DotOptions from "../../utils/DotOptions/DotOptions";
import { Button } from "react-bootstrap";
import { editUserFlashcardInfo, readRemoteFlashcard } from "../flashcardActions";
import { FlashcardLine } from "./FlashcardLine";
import { Editor } from "@tinymce/tinymce-react";
import Shortcuts from "./shortcuts/Shortcuts";
import DetailShortCuts from "./shortcuts/DetailShortCuts";
import ReviewShortCuts from "./shortcuts/ReviewShortCuts";

export default function FlashcardDetail({
  flashcard,
  prerequisites,
  usedIn,
}: {
  flashcard: Flashcard;
  prerequisites: Flashcard[];
  usedIn: Flashcard[];
}) {
  const flashcardId = flashcard._id;

  const {
    flashcards,
    filteredFlashcards,
    setFlashcards,
    openedFlashcards,
    setOpenedFlashcards,
    user,
    status,
    setStatus,
    fetchMoreFlashcards,
    setSearchFilter,
    saveFlashcard,
    saveAsNewFlashcard,
    editCurrentFlashcard,
    subscribeToFlashcard,
    setTreeFilter,
  } = useContext(ConfigContext) as Context;
  const [answerVisible, setAnswerVisible] = useState(status !== "To be reviewed");
  const [showHistory, setShowHistory] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown); // TODO: only one time on component mount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [flashcardId, filteredFlashcards, usedIn, prerequisites]);

  useEffect(() => {
    if (flashcard && !flashcard.hasBeenRead) {
      readRemoteFlashcard(flashcard).then((res) => {
        if (res.success) {
          setFlashcards((flashcards) =>
            flashcards.map((flashcard) => {
              return flashcard._id === flashcardId ? { ...flashcard, hasBeenRead: true } : flashcard;
            })
          );
        }
      });
    }
    if (!hasNextFlashcard()) {
      fetchMoreFlashcards(flashcards.length, 30);
    }
  }, [flashcardId]);

  useEffect(() => {
    setAnswerVisible(status !== "To be reviewed");
  }, [flashcardId, status]);

  const currentIndex = useMemo(
    () => filteredFlashcards.findIndex((flashcard: Flashcard) => flashcard._id === flashcardId),
    [filteredFlashcards, flashcardId]
  );

  const hasPreviousFlashcard = () => currentIndex > 0;

  const goToPreviousFlashcard = () => {
    if (hasPreviousFlashcard()) {
      if (!openedFlashcards.find(({ id }) => id === filteredFlashcards[currentIndex - 1]._id)) {
        setOpenedFlashcards((openedFlashcards) =>
          openedFlashcards.map((openFlashcardData) =>
            openFlashcardData.id === flashcardId
              ? { id: filteredFlashcards[currentIndex - 1]._id, data: filteredFlashcards[currentIndex - 1] }
              : openFlashcardData
          )
        );
      }
      navigate("/flashcards/" + filteredFlashcards[currentIndex - 1]._id);
    }
  };

  const hasNextFlashcard = () => currentIndex !== -1 && currentIndex < filteredFlashcards.length - 1;

  const goToNextFlashcard = () => {
    if (hasNextFlashcard()) {
      if (!openedFlashcards.find(({ id }) => id === filteredFlashcards[currentIndex + 1]._id)) {
        setOpenedFlashcards((openedFlashcards) =>
          openedFlashcards.map((openFlashcardData) =>
            openFlashcardData.id === flashcardId
              ? { id: filteredFlashcards[currentIndex + 1]._id, data: filteredFlashcards[currentIndex + 1] }
              : openFlashcardData
          )
        );
      }
      navigate("/flashcards/" + filteredFlashcards[currentIndex + 1]._id);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "e":
        if (e.ctrlKey) {
          e.preventDefault();
          editCurrentFlashcard(flashcard);
        }
        break;
      case "l":
        if (e.ctrlKey) {
          e.preventDefault();
          saveAsNewFlashcard({
            title: flashcard!.title,
            question: flashcard!.question,
            answer: flashcard!.answer,
            tags: flashcard!.tags,
            prerequisites: flashcard!.prerequisites,
          });
        }
        break;
      case "ArrowLeft":
        if (!e.altKey) {
          goToPreviousFlashcard();
        }
        break;
      case "ArrowRight":
        if (!e.altKey) {
          goToNextFlashcard();
        }
        break;
      case "ArrowUp":
        e.preventDefault();
        if (usedIn?.length !== 0) {
          setTreeFilter(usedIn.map(({ _id }) => _id));
          navigate("/flashcards/" + usedIn[0]._id);
        }
        break;
      case "ArrowDown":
        e.preventDefault();
        if (prerequisites?.length !== 0) {
          setTreeFilter(prerequisites.map(({ _id }) => _id));
          navigate("/flashcards/" + prerequisites[0]._id);
        }
        break;
      case "Enter":
        setAnswerVisible(true);
        break;
      case "1":
        reviewIn(1, "day");
        break;
      case "2":
        reviewIn(1, "week");
        break;
      case "3":
        reviewIn(1, "month");
        break;
      default:
    }
  };

  const submitForValidation = () => {
    if (flashcard) {
      saveFlashcard({
        _id: flashcard._id,
        status: "To be validated",
        submitDate: new Date(),
        lastModificationDate: new Date(),
      });
      if (hasNextFlashcard()) {
        goToNextFlashcard();
      } else navigate("/flashcards/");
    }
  };

  const publish = () => {
    if (flashcard) {
      saveFlashcard({
        _id: flashcard._id,
        status: "Published",
        publishDate: new Date(),
        lastModificationDate: new Date(),
        publishAuthor: user!,
      });
      if (hasNextFlashcard()) {
        goToNextFlashcard();
      } else navigate("/flashcards/");
    }
  };

  const reviewIn = (n: number, period: "day" | "week" | "month") => {
    var date = new Date();
    date.setDate(date.getDate() + n * (period === "day" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 0));
    if (flashcard) {
      editUserFlashcardInfo({ _id: flashcard._id, nextReviewDate: date }).then((res) => {
        if (res.success) {
          setFlashcards((flashcards) =>
            flashcards.map((flashcard) => {
              return flashcard._id === flashcardId ? { ...flashcard, nextReviewDate: date } : flashcard;
            })
          );
        }
      });
    }
    if (hasNextFlashcard()) {
      goToNextFlashcard();
    } else {
      setStatus("My favorites");
      navigate("/flashcards/");
    }
  };

  const searchTag = (tagLabel: string) => {
    setSearchFilter([{ isActive: true, data: ["#" + tagLabel] }]);
  };

  let options = [];
  if (flashcard?.author._id === user?._id) {
    options.push({
      callback: editCurrentFlashcard,
      label: "Edit",
    });
  }
  options.push({
    callback: (flashcard: Flashcard) => {
      saveAsNewFlashcard({
        title: flashcard!.title,
        question: flashcard!.question,
        answer: flashcard!.answer,
        tags: flashcard!.tags,
        prerequisites: flashcard!.prerequisites,
      });
    },
    label: "Save as new",
  });
  options.push({
    callback: (flashcard: Flashcard) => {
      if (flashcard) {
        editUserFlashcardInfo({ _id: flashcard._id, learntDate: new Date() }).then((res) => {
          if (res.success) {
            setFlashcards((flashcards) =>
              flashcards.map((flashcard) => {
                return flashcard._id === flashcardId ? { ...flashcard, learntDate: new Date() } : flashcard;
              })
            );
          }
        });
      }
    },
    label: "Mark as known",
  });
  options.push({
    callback: (flashcard: Flashcard) => {
      setShowHistory(true);
    },
    label: "History",
  });

  const onSubscribe = (e: React.MouseEvent, flashcard: Flashcard) => {
    e.stopPropagation();
    subscribeToFlashcard(flashcard);
  };

  return (
    <div id="flashCardComponent">
      <div className="buttonHeader">
        {flashcard?.status === "Draft" && <Button onClick={submitForValidation}>Submit for validation</Button>}
        {flashcard?.status === "To be validated" && <Button onClick={publish}>Publish</Button>}
      </div>
      <div id="flashcard">
        <div id="previous">
          <div
            className={"subscribe" + (flashcard.nextReviewDate instanceof Date ? " subscribed" : "")}
            onClick={(e) => onSubscribe(e, flashcard)}
          ></div>
          {hasPreviousFlashcard() && <div id="previousArrow" onClick={goToPreviousFlashcard}></div>}
        </div>
        <div id="middle">
          <Editor
            tinymceScriptSrc={process.env.PUBLIC_URL + "/tinymce/js/tinymce/tinymce.min.js"}
            initialValue={flashcard.question}
            init={{
              height: "25vh",
              setup: (editor) => editor.on("keydown", handleKeyDown),
              editable_root: false,
              menubar: false,
              statusbar: false,
              toolbar: "fullscreen",
              plugins: "fullscreen codesample link",
              codesample_global_prismjs: true,
            }}
          />
          {answerVisible ? (
            <>
              <Editor
                tinymceScriptSrc={process.env.PUBLIC_URL + "/tinymce/js/tinymce/tinymce.min.js"}
                initialValue={flashcard.answer}
                init={{
                  height: "40vh",
                  setup: (editor) => editor.on("keydown", handleKeyDown),
                  editable_root: false,
                  menubar: false,
                  statusbar: false,
                  toolbar: "fullscreen",
                  plugins: "fullscreen codesample link",
                  codesample_global_prismjs: true,
                }}
              />
              {status !== "To be reviewed" && (
                <>
                  <div id="tags">
                    {flashcard &&
                      flashcard.tags.map((tag, index) => (
                        <div key={index} className="tag" onClick={(e) => searchTag(tag.label)}>
                          {"#" + tag.label}
                        </div>
                      ))}
                  </div>
                  {prerequisites.length > 0 && (
                    <div id="prerequisites">
                      <div className="flashcardSection">Prerequisites</div>
                      {prerequisites.map((flashcardData, index) => (
                        <FlashcardLine key={index} flashcardData={flashcardData} />
                      ))}
                    </div>
                  )}
                  {usedIn.length > 0 && (
                    <div id="usedIn">
                      <div className="flashcardSection">Used in</div>

                      {usedIn.map((flashcardData, index) => (
                        <FlashcardLine key={index} flashcardData={flashcardData} />
                      ))}
                    </div>
                  )}
                </>
              )}
              {status === "To be reviewed" && (
                <div id="answerButtons">
                  <Button onClick={() => reviewIn(1, "day")} style={{ backgroundColor: "#75beff", border: "none" }}>
                    I forgot <br /> +1day
                  </Button>
                  <Button onClick={() => reviewIn(1, "week")} style={{ backgroundColor: "#2a83e1", border: "none" }}>
                    Not sure <br /> +1week
                  </Button>
                  <Button onClick={() => reviewIn(1, "month")} style={{ backgroundColor: "#024ec4", border: "none" }}>
                    I know <br /> +1month
                  </Button>
                </div>
              )}
            </>
          ) : (
            <Button onClick={() => setAnswerVisible(true)}>Show answer</Button>
          )}
        </div>
        <div id="next">
          {options.length > 0 && status !== "To be reviewed" && <DotOptions obj={flashcard} options={options} />}
          {hasNextFlashcard() && <div id="nextArrow" onClick={goToNextFlashcard}></div>}
        </div>
      </div>
      {showHistory && (
        <div className="blockerDarkBackground" onClick={(e) => setShowHistory(false)}>
          <div id="above" onClick={(e) => e.stopPropagation()}>
          <div>{flashcard.creationDate ? "Created on " + flashcard.creationDate.toLocaleString() + " by " + flashcard.author.username : ""}</div>
          <div>{flashcard.submitDate ? "Submitted on " + flashcard.submitDate.toLocaleString() + " by " + flashcard.author.username : ""}</div>
          <div>{flashcard.publishDate ? "Published on " + flashcard.publishDate.toLocaleString() + " by " + flashcard.publishAuthor.username : ""}</div>
          <div>{flashcard.lastModificationDate ? "Last modified on " + flashcard.lastModificationDate.toLocaleString() + " by " + flashcard.author.username : ""}</div>
          </div>
        </div>
      )}
      <div id="detailShortcuts">
        <Shortcuts position="top-left" color="#e3e3e3" backgroundColor="#565656">
          {status === "To be reviewed" ? <ReviewShortCuts /> : <DetailShortCuts /> }
        </Shortcuts>
      </div>
    </div>
  );
}
