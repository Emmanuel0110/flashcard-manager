import "../../App.css";
import { Editor } from "@tinymce/tinymce-react";
import { useContext, useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { Editor as TinyMCEEditor } from "tinymce";
import { edit, getRemoteFlashcardById, saveNewTag } from "../flashcardActions";
import { ConfigContext, updateListWithNewFlashcards } from "../../App";
import { FlashCardLineData, Flashcard, OpenFlashcardData, Tag } from "../../types";
import AutoComplete from "../../utils/Autocomplete";
import { FlashcardLine } from "./FlashcardLine";

export const useEditFlashcard = () => {
  const { setFlashcards } = useContext(ConfigContext);
  return (infos: Partial<Flashcard>) => {
    edit(infos)
      .then(({ data: updatedFlashcard }: { data: Flashcard }) => {
        setFlashcards((flashcards: Flashcard[]) =>
          flashcards.map((flashcard) => {
            return flashcard._id === updatedFlashcard._id ? {...flashcard, ...updatedFlashcard} : flashcard; //updatedFlashcard does not have hasBeenRead and nextReviewDate attributes, so we merge it in flashacard instead of replacing it
          })
        );
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };
};

export const useGetFlashcardById = () => {
  const {
    flashcards,
    setFlashcards,
  }: { flashcards: Flashcard[]; setFlashcards: React.Dispatch<React.SetStateAction<Flashcard[]>> } =
    useContext(ConfigContext);
  return (id: string): Promise<Flashcard> => {
    const flashcard = flashcards.find((flashcard) => flashcard._id === id);
    return flashcard
      ? Promise.resolve(flashcard)
      : getRemoteFlashcardById(id).then((flashcard) => {
        updateListWithNewFlashcards(flashcards, [flashcard]);
          return flashcard;
        });
  };
};

export default function FlashcardForm({ flashcard }: { flashcard: Flashcard }) {
  const questionRef = useRef<TinyMCEEditor | null>(null);
  const answerRef = useRef<TinyMCEEditor | null>(null);
  const [localTags, setLocalTags] = useState([] as Tag[]);
  const [localUses, setLocalUses] = useState([] as FlashCardLineData[]);
  const [localUseId, setLocalUseId] = useState("");
  const {
    tags,
    setTags,
    setOpenedFlashcards,
  }: {
    tags: Tag[];
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
    setOpenedFlashcards: React.Dispatch<React.SetStateAction<OpenFlashcardData[]>>;
  } = useContext(ConfigContext);
  const editFlashcard = useEditFlashcard();
  const getFlashcardById = useGetFlashcardById();

  useEffect(() => {
    setLocalTags(flashcard.tags);
    setLocalUses(flashcard.uses);
  }, [flashcard]);

  const saveOrEditFlashcard = () => {
    if (questionRef.current && answerRef.current) {
      const title = questionRef.current.getContent({ format: "text" });
      const question = questionRef.current.getContent();
      const answer = answerRef.current.getContent();
      const tags = localTags;
      const uses = localUses;
      editFlashcard({ _id: flashcard._id, title, question, answer, tags, uses });
      setOpenedFlashcards((openedFlashcards) =>
        openedFlashcards.map((openedFlashcard) =>
          openedFlashcard.id === flashcard._id ? { ...openedFlashcard, unsavedData: undefined } : openedFlashcard
        )
      );
    }
  };

  const addTag = ({ _id, label }: { _id?: string; label?: string }) => {
    if (_id && (!flashcard || !flashcard.tags.map((tag) => tag._id).includes(_id))) {
      setLocalTags((localTags) => [...localTags, tags.find((tag: Tag) => tag._id === _id)!]);
    } else if (label && !tags.map((tag) => tag.label).includes(label)) {
      saveNewTag({ label }).then(({ data: tag }) => {
        setTags((tags: Tag[]) => [...tags, tag]);
        setLocalTags((localTags) => [...localTags, tag]);
      });
    }
  };

  const availableTags = tags.filter((tag) => !localTags.map((tag) => tag._id).includes(tag._id));

  const onKeyUpUses = (e: React.KeyboardEvent<HTMLInputElement>) => {
    console.log(localUses.find((el) => el._id === localUseId));
    if (e.key === "Enter" && !localUses.find((el) => el._id === localUseId) && localUseId.length === 24) {
      getFlashcardById(localUseId).then((flashcard) => {
        if (flashcard) {
          const {
            _id,
            author: { _id: authorId },
            title,
            status,
            hasBeenRead,
            nextReviewDate,
          } = flashcard;
          setLocalUses((localUses) => [...localUses, { _id, authorId, title, status, hasBeenRead, nextReviewDate }]);
          setLocalUseId("");
        }
      });
    }
  };

  return (
    <div id="flashcardForm">
      <div className="buttonHeader">
        <Button onClick={saveOrEditFlashcard}>Save</Button>
      </div>
      <div id="form">
        <div id="question">
          <Editor
            tinymceScriptSrc="/public/to/tinymce.min.js"
            onInit={(evt, editor) => {
              questionRef.current = editor;
              questionRef.current.setContent(flashcard.question);
            }}
            initialValue={flashcard.question}
            init={{
              placeholder: "Question",
              height: 200,
              menubar: false,
              statusbar: false,
              plugins:
                "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount",
              toolbar:
                "undo redo | formatselect | " +
                "bold italic backcolor | alignleft aligncenter " +
                "alignright alignjustify | bullist numlist outdent indent | " +
                "removeformat | help",
              content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
            }}
          />
        </div>
        <div id="answer">
          <Editor
            onInit={(evt, editor) => {
              answerRef.current = editor;
              answerRef.current.setContent(flashcard.answer);
            }}
            initialValue={flashcard.answer}
            init={{
              placeholder: "Answer",
              height: 500,
              menubar: false,
              statusbar: false,
              plugins:
                "advlist autolink lists link image charmap preview anchor searchreplace visualblocks code fullscreen insertdatetime media table code help wordcount",
              toolbar:
                "undo redo | formatselect | " +
                "bold italic backcolor | alignleft aligncenter " +
                "alignright alignjustify | bullist numlist outdent indent | " +
                "removeformat | help",
              content_style: "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
            }}
          />
        </div>
        <div id="tags">
          {localTags.map((tag, index) => (
            <div
              key={index}
              onClick={() => setLocalTags((localTags) => localTags.filter((localTag) => localTag._id !== tag._id))}
              className="tag"
            >
              {"#" + tag.label}
            </div>
          ))}
          <div className="tagInput">
            <AutoComplete
              dropdownList={availableTags}
              callback={addTag}
              placeholder="Add a tag..."
              placement="top-start"
            />
          </div>
        </div>
        <div id="uses">
          <div className="flashcardSection">Uses</div>
          {localUses.map((flashcardData, index) => (
            <FlashcardLine key={index} flashcardData={flashcardData} />
          ))}
          <div className="tagInput">
            <input
              type="text"
              placeholder="Add a flashcard id"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setLocalUseId(e.target.value);
              }}
              onKeyUp={onKeyUpUses}
              value={localUseId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
