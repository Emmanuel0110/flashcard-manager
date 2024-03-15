import { Dispatch, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ConfigContext, fetchMoreFlashcards, url } from "../../App";
import { Flashcard, SearchFilter, Tag, User } from "../../types";
import DotOptions from "../../utils/DotOptions/DotOptions";
import { Button } from "react-bootstrap";
import {
  editUserFlashcardInfo,
  getRemoteFlashcardUsedIn,
  readRemoteFlashcard,
  subscribeToRemoteFlashcard,
} from "../flashcardActions";
import { useEditFlashcard, useSaveAsNewFlashcard } from "./FlashcardForm";
import { FlashcardLine } from "./FlashcardLine";

export default function FlashcardDetail({ flashcard }: { flashcard: Flashcard }) {
  const flashcardId = flashcard._id;

  const {
    flashcards,
    filteredFlashcards,
    setFlashcards,
    setOpenedFlashcards,
    user,
    filter,
    setFilter,
    setSearchFilter,
    tags,
  }: {
    flashcards: Flashcard[];
    filteredFlashcards: Flashcard[];
    setFlashcards: Dispatch<SetStateAction<Flashcard[]>>;
    setOpenedFlashcards: React.Dispatch<React.SetStateAction<{
      id: string;
      edit: boolean;
  }[]>>;
    user: User;
    filter: string;
    setFilter: Dispatch<SetStateAction<string>>;
    setSearchFilter: Dispatch<SetStateAction<SearchFilter>>;
    tags: Tag[];
  } = useContext(ConfigContext);
  const [answerVisible, setAnswerVisible] = useState(filter === "Draft" || filter === "To be validated");
  const usedInLoading = useRef(false);
  const navigate = useNavigate();
  const saveAsNewFlashcard = useSaveAsNewFlashcard();
  const editFlashcard = useEditFlashcard();

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown); // TODO: only one time on component mount
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [flashcardId]);

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
      fetchMoreFlashcards(url + "flashcards?filter=" + filter, setFlashcards, flashcards.length, 30);
    }

    if (flashcard && !flashcard.usedIn && !usedInLoading.current) {
      usedInLoading.current = true;
      getRemoteFlashcardUsedIn(flashcard._id).then((usedInflashcards) => {
        usedInLoading.current = false;
        setFlashcards((flashcards) =>
          flashcards.map((flashcard) =>
            flashcard._id === flashcardId
              ? {
                  ...flashcard,
                  usedIn: usedInflashcards.map((usedInflashcard) => {
                    const {
                      _id,
                      author: { _id: authorId },
                      title,
                      status,
                      hasBeenRead,
                      nextReviewDate,
                    } = usedInflashcard;
                    return { _id, authorId, title, status, hasBeenRead, nextReviewDate };
                  }),
                }
              : flashcard
          )
        );
      });
    }
  }, [flashcardId]);

  useEffect(() => {
    setAnswerVisible(filter !== "To be reviewed");
  }, [flashcardId]);

  const currentIndex = useMemo(
    () => filteredFlashcards.findIndex((flashcard: Flashcard) => flashcard._id === flashcardId),
    [filteredFlashcards, flashcardId]
  );

  const hasPreviousFlashcard = () => currentIndex > 0;

  const goToPreviousFlashcard = () => {
    if (hasPreviousFlashcard()) {
      setOpenedFlashcards((openedFlashcards) =>
        openedFlashcards.map((flashcard) =>
          flashcard.id === flashcardId ? {...flashcard, id: filteredFlashcards[currentIndex - 1]._id} : flashcard
        )
      );
      navigate("/flashcards/" + filteredFlashcards[currentIndex - 1]._id);
    }
  };

  const hasNextFlashcard = () => currentIndex !== -1 && currentIndex < filteredFlashcards.length - 1;

  const goToNextFlashcard = () => {
    if (hasNextFlashcard()) {
      setOpenedFlashcards((openedFlashcards) =>
        openedFlashcards.map((flashcard) =>
          flashcard.id === flashcardId ? {...flashcard, id: filteredFlashcards[currentIndex + 1]._id} : flashcard
        )
      );
      navigate("/flashcards/" + filteredFlashcards[currentIndex + 1]._id);
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "ArrowLeft":
        goToPreviousFlashcard();
        break;
      case "ArrowRight":
        goToNextFlashcard();
        break;
      case "Enter":
        if (!answerVisible) {
          setAnswerVisible(true);
        }
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
      editFlashcard({ _id: flashcard._id, status: "To be validated" });
      if (hasNextFlashcard()) {
        goToNextFlashcard();
      } else navigate("/flashcards/");
    }
  };

  const publish = () => {
    if (flashcard) {
      editFlashcard({ _id: flashcard._id, status: "Published" });
      if (hasNextFlashcard()) {
        goToNextFlashcard();
      } else navigate("/flashcards/");
    }
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
      setFilter("My favorites");
      navigate("/flashcards/");
    }
  };

  const searchTag = (tagId: string) => {
    setSearchFilter((searchFilter) => ({ ...searchFilter, tag: tags.find((tag) => tag._id === tagId) }));
  };

  let options = [];
  if (flashcard?.author._id === user?._id) {
    options.push({
      callback: (flashcard: Flashcard) => {
        navigate("/flashcards/" + flashcard._id + "/edit");
      },
      label: "Edit",
    });
  }
  options.push({
    callback: (flashcard: Flashcard) => {
      saveAsNewFlashcard({ title: flashcard!.title, question: flashcard!.question, answer: flashcard!.answer });
    },
    label: "Save as new",
  });

  return (
    <div id="flashCardComponent">
      <div className="buttonHeader">
        {flashcard?.status === "Draft" && <Button onClick={submitForValidation}>Submit for validation</Button>}
        {flashcard?.status === "To be validated" && <Button onClick={publish}>Publish</Button>}
        {flashcard?.status === "Published" && (
          <Button onClick={(e) => subscribeToFlashcard(e, flashcard)}>
            {flashcard.nextReviewDate instanceof Date ? "Remove from favorites" : "Add to favorites"}
          </Button>
        )}
      </div>
      <div id="flashcard">
        <div id="middle">
          <div id="question" dangerouslySetInnerHTML={{ __html: flashcard?.question || "" }} />
          {answerVisible ? (
            <>
              <div id="answer" dangerouslySetInnerHTML={{ __html: flashcard?.answer || "" }} />
              {filter !== "To be reviewed" && (
                <>
                  <div id="tags">
                    {flashcard &&
                      flashcard.tags.map((tag, index) => (
                        <div key={index} className="tag" onClick={(e) => searchTag(tag._id)}>
                          {"#" + tag.label}
                        </div>
                      ))}
                  </div>
                  {flashcard && flashcard.uses.length > 0 && (
                    <div id="uses">
                      <div className="flashcardSection">Uses</div>
                      {flashcard.uses.map((flashcardData, index) => (
                        <FlashcardLine key={index} flashcardData={flashcardData} />
                      ))}
                    </div>
                  )}
                  {flashcard?.usedIn && flashcard.usedIn.length > 0 && (
                    <div id="usedIn">
                      <div className="flashcardSection">Used in</div>

                      {flashcard?.usedIn.map((flashcardData, index) => (
                        <FlashcardLine key={index} flashcardData={flashcardData} />
                      ))}
                    </div>
                  )}
                </>
              )}
              {filter === "To be reviewed" && (
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
            <Button onClick={() => setAnswerVisible(true)}>See answer</Button>
          )}
        </div>
        <div id="previous">
          {hasPreviousFlashcard() && <div id="previousArrow" onClick={goToPreviousFlashcard}></div>}
        </div>
        <div id="next">
          {options.length > 0 && <DotOptions obj={flashcard} options={options} />}
          {hasNextFlashcard() && <div id="nextArrow" onClick={goToNextFlashcard}></div>}
        </div>
        <div id="pannelCloseContainer" onClick={(e: React.MouseEvent<HTMLSpanElement>) => navigate("/flashcards")}>
          <div className="pannelClose"></div>
        </div>
      </div>
    </div>
  );
}
