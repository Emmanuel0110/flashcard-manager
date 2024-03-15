import { Flashcard } from "../../types";
import TabNav from "../../Layout/TabNav";

export default function OpenedFlashcards({
  openedFlashcards,
  flashcardId,
}: {
  openedFlashcards: { id: string; edit: boolean }[];
  flashcardId: string;
}) {
  return <TabNav openedFlashcards={openedFlashcards} flashcardId={flashcardId} />;
}
