import { Flashcard } from "../../types";
import TabNav from "../../Layout/TabNav";

export default function OpenedFlashcards({
  openedFlashcards,
  flashcardId,
}: {
  openedFlashcards: Flashcard[];
  flashcardId: string;
}) {
  return <TabNav openedFlashcards={openedFlashcards} flashcardId={flashcardId} />;
}
