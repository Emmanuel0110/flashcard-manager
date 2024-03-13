import { useContext } from "react";
import { Flashcard } from "../../types";
import { ConfigContext, fetchMoreFlashcards, url } from "../../App";
import { Outlet, useParams } from "react-router-dom";
import InfiniteScrollComponent from "../../utils/InfiniteScrollComponent";
import FilterBar from "./FilterBar";
import useSplitPane from "../../utils/useSplitPane";
import { FlashcardLine } from "./FlashcardLine";

export default function Flashcards({ filteredFlashcards }: { filteredFlashcards: Flashcard[] }) {
  const { flashcardId } = useParams();
  const { setFlashcards, filter } = useContext(ConfigContext);

  useSplitPane(["#left", "#right"], "horizontal", [50, 50], !!flashcardId);

  return (
    <div id="splitContainer">
      <div id="left">
        <InfiniteScrollComponent
          skip={filteredFlashcards.length}
          callback={(skip: number, limit: number) =>
            fetchMoreFlashcards(url + "flashcards?filter=" + filter, setFlashcards, skip, limit)
          }
        >
          <FilterBar />
          <div id="flashcardList">
            {filteredFlashcards.map((flashcard, index) => <FlashcardLine key={index} flashcardData={{...flashcard, authorId: flashcard.author._id}}/>)}
          </div>
        </InfiniteScrollComponent>
      </div>
      <div id="right">
        <div id="openedFlashcard">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
