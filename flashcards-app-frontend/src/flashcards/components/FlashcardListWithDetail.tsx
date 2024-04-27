import { Flashcard, OpenFlashcardData } from "../../types";
import { useParams } from "react-router-dom";
import useSplitPane from "../../utils/useSplitPane";
import FlashcardList from "./FlashcardList";
import { Dispatch, SetStateAction, useContext, useEffect, useMemo, useRef, useState } from "react";
import { ConfigContext, updateCacheWithNewFlashcards } from "../../App";
import FlashcardForm from "./FlashcardForm";
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
    getFlashcardById,
  }: {
    flashcards: Flashcard[];
    setFlashcards: Dispatch<SetStateAction<Flashcard[]>>;
    setOpenedFlashcards: React.Dispatch<React.SetStateAction<OpenFlashcardData[]>>;
    getFlashcardById: (id: string) => Promise<Flashcard>;
  } = useContext(ConfigContext);
  const flashcardId = useParams().flashcardId!;
  const [currentOpenedFlashcard, setCurrentOpenedFlashcard] = useState<OpenFlashcardData | null>(null);
  const [prerequisites, setPrerequisites] = useState<Flashcard[]>([]);
  const [usedIn, setdUsedIn] = useState<Flashcard[]>([]);
  const loading = useRef(false);
  const prerequisitesAndusedInLoading = useRef(false);

  useSplitPane(["#left", "#right"], "horizontal", [50, 50]);

  useEffect(() => {
    if (!loading.current) {
      const currentOpenedFlashcard = openedFlashcards.find(({ id }) => id === flashcardId);
      if (currentOpenedFlashcard) {
        setCurrentOpenedFlashcard(currentOpenedFlashcard);
      } else {
        const flashcard = flashcards.find(({ _id }) => _id === flashcardId);
        if (flashcard) {
          const currentOpenedFlashcard: OpenFlashcardData = { id: flashcard._id, data: flashcard };
          setOpenedFlashcards([...openedFlashcards, currentOpenedFlashcard]); //Why is it too slow when I use function in setOpenedFlashcards ?
          setCurrentOpenedFlashcard(currentOpenedFlashcard);
        } else {
          loading.current = true;
          getFlashcardById(flashcardId).then(() => (loading.current = false));
        }
      }
    }
  }, [flashcards, flashcardId, openedFlashcards]);

  useEffect(() => {
    if (currentOpenedFlashcard && !prerequisitesAndusedInLoading.current) {
      const missingPrerequisitesAndUsedIn = getMissingPrerequisitesAndUsedIn(
        currentOpenedFlashcard.unsavedData || currentOpenedFlashcard.data,
        flashcards
      );
      if (missingPrerequisitesAndUsedIn.length === 0) {
        const [prerequisites, usedIn] = getPrerequisitesAndUsedIn(
          currentOpenedFlashcard.unsavedData || currentOpenedFlashcard.data
        );
        setPrerequisites(prerequisites);
        setdUsedIn(usedIn);
      } else {
        prerequisitesAndusedInLoading.current = true;
        getRemotePrerequisiteAndUsedIn(missingPrerequisitesAndUsedIn).then(
          (missingPrerequisitesAndUsedInFlashcards) => {
            prerequisitesAndusedInLoading.current = false;

            setFlashcards((flashcards) => {
              if (missingPrerequisitesAndUsedIn.length === missingPrerequisitesAndUsedInFlashcards.length) {
                return updateCacheWithNewFlashcards(flashcards, missingPrerequisitesAndUsedInFlashcards);
              } else {
                return updateCacheWithNewFlashcards(flashcards, missingPrerequisitesAndUsedInFlashcards).map((el) =>
                  el._id === flashcardId
                    ? {
                        ...el,
                        prerequisites: el.prerequisites.filter((id) => !missingPrerequisitesAndUsedIn.includes(id) ||
                          missingPrerequisitesAndUsedInFlashcards.some(({ _id }) => _id === id)
                        ),
                      }
                    : el
                );
              }
            });
          }
        );
      }
    }
  }, [currentOpenedFlashcard, flashcards]);

  const getPrerequisitesAndUsedIn = (flashcard: Flashcard) => {
    return [
      flashcard.prerequisites.map((prerequisiteId) => flashcards.find(({ _id }) => _id === prerequisiteId)!),
      flashcard.usedIn.map((usedInId) => flashcards.find(({ _id }) => _id === usedInId)!),
    ];
  };

  const updateUnsavedData = (id: string, args: Partial<Flashcard>) => {
    setOpenedFlashcards((openedFlashcards) =>
      openedFlashcards.map((openedFlashcard) =>
        openedFlashcard.id === id && openedFlashcard.unsavedData
          ? { ...openedFlashcard, unsavedData: { ...openedFlashcard.unsavedData, ...args } }
          : openedFlashcard
      )
    );
  };

  return (
    <div id="splitContainer">
      <div id="left">
        <FlashcardList filteredFlashcards={filteredFlashcards} />
      </div>
      <div id="right">
        {currentOpenedFlashcard && (
          <div id="openedFlashcards">
            <TabNav openedFlashcards={openedFlashcards} currentFlashcardId={flashcardId} />
            {currentOpenedFlashcard.unsavedData ? (
              <FlashcardForm
                updateUnsavedData={updateUnsavedData}
                flashcard={currentOpenedFlashcard.unsavedData}
                prerequisites={prerequisites}
              />
            ) : (
              <FlashcardDetail flashcard={currentOpenedFlashcard.data} prerequisites={prerequisites} usedIn={usedIn} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
