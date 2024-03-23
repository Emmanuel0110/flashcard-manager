import { Flashcard, OpenFlashcardData } from "../../types";
import { useParams } from "react-router-dom";
import useSplitPane from "../../utils/useSplitPane";
import FlashcardList from "./FlashcardList";
import { Dispatch, SetStateAction, useContext, useEffect, useMemo, useRef } from "react";
import { ConfigContext, updateListWithNewFlashcards } from "../../App";
import FlashcardForm, { useGetFlashcardById } from "./FlashcardForm";
import { getRemotePrerequisiteAndUsedIn } from "../flashcardActions";
import TabNav from "../../Layout/TabNav";
import FlashcardDetail from "./FlashcardDetail";

const getMissingPrerequisitesAndUsedIn = (flashcard: Flashcard, flashcards: Flashcard[]) => {
  const missingPrerequisites = flashcard.prerequisites.filter((id) => !flashcards.find((_) => _._id === id));
  const missingUsedIn = flashcard.usedIn.filter((id) => !flashcards.find((_) => _._id === id));
  return [...missingPrerequisites, ...missingUsedIn];
};

export default function FlashcardListWithDetail({
  filteredFlashcards,
  openedFlashcards,
}: {
  filteredFlashcards: Flashcard[];
  openedFlashcards: OpenFlashcardData[];
}) {
  const {
    flashcards,
    setFlashcards,
    setOpenedFlashcards,
  }: {
    flashcards: Flashcard[];
    setFlashcards: Dispatch<SetStateAction<Flashcard[]>>;
    setOpenedFlashcards: React.Dispatch<React.SetStateAction<OpenFlashcardData[]>>;
  } = useContext(ConfigContext);
  const flashcardId = useParams().flashcardId!;
  const loading = useRef(false);
  const prerequisitesAndusedInLoading = useRef(false);
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
  const [currentFlashcard, prerequisites, usedIn] = useMemo(() => {
    const curflash = flashcards.find((flashcard) => flashcard._id === flashcardId);
    if (curflash) {
      const missingPrerequisitesAndUsedIn = getMissingPrerequisitesAndUsedIn(curflash, flashcards);
      if (missingPrerequisitesAndUsedIn.length > 0) {
        if (!prerequisitesAndusedInLoading.current) {
          prerequisitesAndusedInLoading.current = true;
          getRemotePrerequisiteAndUsedIn(missingPrerequisitesAndUsedIn).then(
            (missingPrerequisitesAndUsedInFlashcards) => {
              prerequisitesAndusedInLoading.current = false;
              setFlashcards((flashcards) =>
                updateListWithNewFlashcards(flashcards, missingPrerequisitesAndUsedInFlashcards)
              );
            }
          );
        }
      }
      return [
        curflash,
        missingPrerequisitesAndUsedIn.length > 0
          ? []
          : curflash.prerequisites.map((prerequisite) => flashcards.find((_) => _._id === prerequisite)!),
        missingPrerequisitesAndUsedIn.length > 0
          ? []
          : curflash.usedIn.map((usedIn) => flashcards.find((_) => _._id === usedIn)!),
      ];
    } else return [undefined, undefined, undefined];
  }, [flashcards, flashcardId]);
  const currentOpenedFlashcard = openedFlashcards.find((flashcard) => flashcard.id === flashcardId);

  return (
    <div id="splitContainer">
      <div id="left">
        <FlashcardList filteredFlashcards={filteredFlashcards} />
      </div>
      <div id="right">
        <div id="openedFlashcards">
          {currentFlashcard && (
            <>
              <TabNav openedFlashcards={openedFlashcards} currentFlashcardId={flashcardId} />
              {currentOpenedFlashcard &&
                (currentOpenedFlashcard.unsavedData ? (
                  <FlashcardForm flashcard={currentOpenedFlashcard.unsavedData} prerequisites={prerequisites} />
                ) : (
                  <FlashcardDetail flashcard={currentFlashcard} prerequisites={prerequisites} usedIn={usedIn} />
                ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
