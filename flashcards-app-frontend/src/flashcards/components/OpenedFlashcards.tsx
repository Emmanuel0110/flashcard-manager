import { Flashcard, OpenFlashcardData } from "../../types";
import TabNav from "../../Layout/TabNav";

export default function OpenedFlashcards({
  openedFlashcards,
  currentFlashcard,
}: {
  openedFlashcards: OpenFlashcardData[];
  currentFlashcard: Flashcard;
}) {
  return <TabNav openedFlashcards={openedFlashcards} currentFlashcard={currentFlashcard} />;
}
