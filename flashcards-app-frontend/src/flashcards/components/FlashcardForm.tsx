import "../../App.css";
import { Editor } from "@tinymce/tinymce-react";
import { useContext, useEffect, useRef, useState } from "react";
import { Button } from "react-bootstrap";
import { Editor as TinyMCEEditor } from "tinymce";
import { saveNewTag } from "../flashcardActions";
import { ConfigContext } from "../../App";
import { Flashcard, OpenFlashcardData, Tag } from "../../types";
import AutoComplete from "../../utils/Autocomplete";
import { FlashcardLine } from "./FlashcardLine";

export default function FlashcardForm({
  flashcard,
  prerequisites,
}: {
  flashcard: Flashcard;
  prerequisites: Flashcard[];
}) {
  const questionRef = useRef<TinyMCEEditor | null>(null);
  const answerRef = useRef<TinyMCEEditor | null>(null);
  const [localTags, setLocalTags] = useState([] as Tag[]);
  const [localPrerequisites, setLocalPrerequisites] = useState([] as Flashcard[]);
  const [localPrerequisiteId, setLocalPrerequisiteId] = useState("");
  const {
    tags,
    setTags,
    setOpenedFlashcards,
    saveFlashcard,
    getFlashcardById,
  }: {
    tags: Tag[];
    setTags: React.Dispatch<React.SetStateAction<Tag[]>>;
    setOpenedFlashcards: React.Dispatch<React.SetStateAction<OpenFlashcardData[]>>;
    saveFlashcard: (infos: Partial<Flashcard>) => void;
    getFlashcardById: (id: string) => Promise<Flashcard>;
  } = useContext(ConfigContext);

  useEffect(() => {
    setLocalTags(flashcard.tags);
    setLocalPrerequisites(prerequisites);
  }, [flashcard]);

  const onSave = () => {
    if (questionRef.current && answerRef.current) {
      const title = questionRef.current.getContent({ format: "text" });
      const question = questionRef.current.getContent();
      const answer = answerRef.current.getContent();
      const tags = localTags;
      const prerequisites = localPrerequisites.map((_) => _._id);
      saveFlashcard({ _id: flashcard._id, title, question, answer, tags, prerequisites });
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

  const onPaste = (e: React.ClipboardEvent) => {
    const copiedText = e.clipboardData.getData("Text");
    if (copiedText.length === 24 && !localPrerequisites.find((el) => el._id === copiedText)) {
      getFlashcardById(copiedText).then((flashcard) => {
        if (flashcard) {
          setLocalPrerequisites((localPrerequisites) => [...localPrerequisites, flashcard]);
          setLocalPrerequisiteId("");
        }
      });
    }
  };

  return (
    <div id="flashcardForm">
      <div className="buttonHeader">
        <Button onClick={onSave}>Save</Button>
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
        <div id="prerequisites">
          <div className="flashcardSection">Prerequisites</div>
          {localPrerequisites.map((flashcardData, index) => (
            <FlashcardLine key={index} flashcardData={flashcardData} />
          ))}
          <div className="tagInput">
            <input
              type="text"
              placeholder="Add a flashcard id"
              onPaste={onPaste}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setLocalPrerequisiteId(e.target.value);
              }}
              value={localPrerequisiteId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
