import { Flashcard } from "../../types";
import { useParams } from "react-router-dom";
import useSplitPane from "../../utils/useSplitPane";
import FlashcardList from "./FlashcardList";
import OpenedFlashcards from "./OpenedFlashcards";

export default function FlashcardListWithDetail({
  filteredFlashcards,
  openedFlashcards,
}: {
  filteredFlashcards: Flashcard[];
  openedFlashcards: Flashcard[];
}) {
  const flashcardId = useParams().flashcardId!;

  useSplitPane(["#left", "#right"], "horizontal", [50, 50]);

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
