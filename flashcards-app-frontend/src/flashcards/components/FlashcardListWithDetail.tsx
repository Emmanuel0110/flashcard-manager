import { Flashcard, OpenFlashcardData } from "../../types";
import { useParams } from "react-router-dom";
import useSplitPane from "../../utils/useSplitPane";
import FlashcardList from "./FlashcardList";
import OpenedFlashcards from "./OpenedFlashcards";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { ConfigContext } from "../../App";
import { useGetFlashcardById } from "./FlashcardForm";

export default function FlashcardListWithDetail({
  filteredFlashcards,
  openedFlashcards,
}: {
  filteredFlashcards: Flashcard[];
  openedFlashcards: OpenFlashcardData[];
}) {
  const {
    flashcards,
    setOpenedFlashcards,
  }: { flashcards: Flashcard[]; setOpenedFlashcards: React.Dispatch<React.SetStateAction<OpenFlashcardData[]>> } =
    useContext(ConfigContext);
  const flashcardId = useParams().flashcardId!;
  const loading = useRef(false);
  const getFlashcardById = useGetFlashcardById();
  useSplitPane(["#left", "#right"], "horizontal", [50, 50]);
  useEffect(() => {
    if (!openedFlashcards.find(({ id }) => id === flashcardId) && !loading.current) {
      loading.current = true;
      getFlashcardById(flashcardId).then((flashcard) => {
        if (flashcard) {
          setOpenedFlashcards((openedFlashcards) => [...openedFlashcards, { id: flashcard._id }]);
        }
        loading.current = false;
      });
    }
  }, [flashcardId]);
  const currentFlashcard = useMemo(
    () => flashcards.find((flashcard) => flashcard._id === flashcardId),
    [flashcards, flashcardId]
  );

  return (
    <div id="splitContainer">
      <div id="left">
        <FlashcardList filteredFlashcards={filteredFlashcards} />
      </div>
      <div id="right">
        <div id="openedFlashcard">
          {currentFlashcard && (
            <OpenedFlashcards openedFlashcards={openedFlashcards} currentFlashcard={currentFlashcard} />
          )}
        </div>
      </div>
    </div>
  );
}
