import { Flashcard, OpenFlashcardData } from "../../types";
import TabNav from "../../Layout/TabNav";

export default function OpenedFlashcards({
  openedFlashcards,
  flashcardId,
}: {
  openedFlashcards: OpenFlashcardData[];
  flashcardId: string;
}) {
  return <TabNav openedFlashcards={openedFlashcards} flashcardId={flashcardId} />;
}
