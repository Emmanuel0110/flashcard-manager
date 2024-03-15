import { Flashcard } from "../../types";
import { useParams } from "react-router-dom";
import useSplitPane from "../../utils/useSplitPane";
import FlashcardList from "./FlashcardList";
import OpenedFlashcards from "./OpenedFlashcards";
import { useContext, useEffect } from "react";
import { ConfigContext } from "../../App";
import { useGetFlashcardById } from "./FlashcardForm";

export default function FlashcardListWithDetail({
  filteredFlashcards,
  openedFlashcards,
}: {
  filteredFlashcards: Flashcard[];
  openedFlashcards: { id: string; edit: boolean }[];
}) {
  const {
    setFlashcards,
    setOpenedFlashcards,
  }: {
    setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>>;
    setOpenedFlashcards: React.Dispatch<
      React.SetStateAction<
        {
          id: string;
          edit: boolean;
        }[]
      >
    >;
  } = useContext(ConfigContext);
  const flashcardId = useParams().flashcardId!;
  const getFlashcardById = useGetFlashcardById();
  useSplitPane(["#left", "#right"], "horizontal", [50, 50]);
  useEffect(() => {
    if (openedFlashcards.length == 0) {
      getFlashcardById(flashcardId).then((flashcard) => {
        if (flashcard) {
          setFlashcards((flashcards) => [...flashcards, flashcard]);
          setOpenedFlashcards([{ id: flashcard._id, edit: false }]);
        }
      });
    }
  }, [flashcardId]);

  return (
    <div id="splitContainer">
      <div id="left">
        <FlashcardList filteredFlashcards={filteredFlashcards} />
      </div>
      <div id="right">
        <div id="openedFlashcard">
          <OpenedFlashcards openedFlashcards={openedFlashcards} flashcardId={flashcardId} />
        </div>
      </div>
    </div>
  );
}
