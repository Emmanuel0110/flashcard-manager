import { useContext } from "react";
import { Flashcard } from "../../types";
import { ConfigContext, fetchMoreFlashcards, url } from "../../App";
import InfiniteScrollComponent from "../../utils/InfiniteScrollComponent";
import FilterBar from "./FilterBar";
import { FlashcardLine } from "./FlashcardLine";

export default function FlashcardList({ filteredFlashcards }: { filteredFlashcards: Flashcard[] }) {
  const { setFlashcards, status } = useContext(ConfigContext);

  return (
    <InfiniteScrollComponent
      skip={filteredFlashcards.length}
      callback={(skip: number, limit: number) =>
        fetchMoreFlashcards(url + "flashcards?status=" + status, setFlashcards, skip, limit)
      }
    >
      <FilterBar />
      <div id="flashcardList">
        {filteredFlashcards.map((flashcard, index) => (
          <FlashcardLine key={index} flashcardData={flashcard} />
        ))}
      </div>
    </InfiniteScrollComponent>
  );
}
