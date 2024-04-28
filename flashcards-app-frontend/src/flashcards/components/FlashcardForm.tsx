import "../../App.css";
import { Editor } from "@tinymce/tinymce-react";
import { Dispatch, useContext, useEffect, useRef } from "react";
import { Button } from "react-bootstrap";
import { Editor as TinyMCEEditor } from "tinymce";
import { saveNewTag } from "../flashcardActions";
import { ConfigContext } from "../../App";
import { Context } from "../../types";
import { Flashcard, Tag } from "../../types";
import AutoComplete from "../../utils/Autocomplete";
import { FlashcardLine } from "./FlashcardLine";

export default function FlashcardForm({
  flashcard,
  prerequisites: prerequisiteFlashcards,
  updateUnsavedData,
}: {
  flashcard: Flashcard;
  prerequisites: Flashcard[];
  updateUnsavedData: (id: string, args: Partial<Flashcard>) => void;
}) {
  const questionRef = useRef<TinyMCEEditor | null>(null);
  const answerRef = useRef<TinyMCEEditor | null>(null);
  const { flashcards, tags, setTags, setOpenedFlashcards, saveFlashcard, getFlashcardById, saveAsNewFlashcard } =
    useContext(ConfigContext) as Context;

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [flashcard]);

  const onSave = () => {
    if (questionRef.current && answerRef.current) {
      const { _id, tags, prerequisites } = flashcard;
      saveFlashcard({
        _id,
        title: questionRef.current.getContent({ format: "text" }),
        question: questionRef.current.getContent(),
        answer: answerRef.current.getContent(),
        tags,
        prerequisites,
        lastModificationDate: new Date(),
      });
      setOpenedFlashcards((openedFlashcards) =>
        openedFlashcards.map((openedFlashcard) =>
          openedFlashcard.id === flashcard._id
            ? { ...openedFlashcard, data: openedFlashcard.unsavedData!, unsavedData: undefined }
            : openedFlashcard
        )
      );
    }
  };

  const addTag = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id && (!flashcard || !flashcard.tags.map((tag) => tag._id).includes(_id))) {
      updateUnsavedData(flashcard._id, { tags: [...flashcard.tags, tags.find((tag: Tag) => tag._id === _id)!] });
      setLocalDescription("");
    } else if (label && !tags.map((tag) => tag.label).includes(label)) {
      saveNewTag({ label }).then(({ data: tag }) => {
        setTags((tags: Tag[]) => [...tags, tag]);
        updateUnsavedData(flashcard._id, { tags: [...flashcard.tags, tag] });
        setLocalDescription("");
      });
    }
  };

  const availableTags = tags
    .filter((tag) => !flashcard.tags.map((tag) => tag._id).includes(tag._id))
    .map((tag) => ({ ...tag, label: "#" + tag.label }));
  const availableFlashcardIds = flashcards
    .map(({ _id, title }) => ({ _id, label: title }))
    .filter(({ _id }) => !flashcard.prerequisites.includes(_id));

  const onPastePrerequisiteId = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const copiedText = e.clipboardData.getData("Text");
    if (copiedText.length === 24 && !prerequisiteFlashcards.find(({ _id }) => _id === copiedText)) {
      getFlashcardById(copiedText).then((prerequisite) => {
        if (prerequisite) {
          updateUnsavedData(flashcard._id, { prerequisites: [...flashcard.prerequisites, prerequisite._id] });
        }
      });
    }
  };

  const addPrerequisite = ({
    _id,
    label,
    setLocalDescription,
  }: {
    _id?: string;
    label?: string;
    setLocalDescription: Dispatch<React.SetStateAction<string>>;
  }) => {
    if (_id) {
      updateUnsavedData(flashcard._id, { prerequisites: [...flashcard.prerequisites, _id] });
      setLocalDescription("");
    } else if (label) {
      saveAsNewFlashcard({ title: "", question: label, answer: "" }).then(({ _id }) =>
        updateUnsavedData(flashcard._id, { prerequisites: [...flashcard.prerequisites, _id] })
      );
      setLocalDescription("");
    }
  };

  const removePrerequisite = (index: number) => {
    updateUnsavedData(flashcard._id, { prerequisites: flashcard.prerequisites.filter((el, idx) => idx !== index) });
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case "s":
        if (e.ctrlKey) {
          e.preventDefault();
          onSave();
        }
        break;
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
            tinymceScriptSrc={process.env.PUBLIC_URL + "/tinymce/js/tinymce/tinymce.min.js"}
            onInit={(evt, editor) => {
              questionRef.current = editor;
              questionRef.current.setContent(flashcard.question);
              editor.focus();
            }}
            onBlur={() =>
              updateUnsavedData(flashcard._id, {
                title: questionRef.current?.getContent({ format: "text" }) || "",
                question: questionRef.current?.getContent() || "",
              })
            }
            initialValue={flashcard.question}
            init={{
              placeholder: "Question",
              height: 200,
              setup: (editor) => editor.on("keydown", handleKeyDown),
              menubar: false,
              statusbar: false,
              plugins:
                "advlist autolink lists link image charmap preview anchor searchreplace visualblocks codesample fullscreen insertdatetime media table help wordcount",
              toolbar:
                "undo redo | formatselect | " +
                "bold italic backcolor | alignleft aligncenter " +
                "alignright alignjustify | bullist numlist outdent indent | " +
                "codesample removeformat | help fullscreen",
              codesample_global_prismjs: true,
              codesample_languages: [
                { text: "JavaScript", value: "javascript" },
                { text: "Lisp", value: "lisp" },
              ],
            }}
          />
        </div>
        <div id="answer">
          <Editor
            tinymceScriptSrc={process.env.PUBLIC_URL + "/tinymce/js/tinymce/tinymce.min.js"}
            onInit={(evt, editor) => {
              answerRef.current = editor;
              answerRef.current.setContent(flashcard.answer);
            }}
            onBlur={() => updateUnsavedData(flashcard._id, { answer: answerRef.current?.getContent() || "" })}
            initialValue={flashcard.answer}
            init={{
              placeholder: "Answer",
              height: 500,
              setup: (editor) => editor.on("keydown", handleKeyDown),
              menubar: false,
              statusbar: false,
              plugins:
                "advlist autolink lists link image charmap preview anchor searchreplace visualblocks codesample fullscreen insertdatetime media table code help wordcount",
              toolbar:
                "undo redo | formatselect | " +
                "bold italic backcolor | alignleft aligncenter " +
                "alignright alignjustify | bullist numlist outdent indent | " +
                "codesample removeformat | help fullscreen",
              codesample_global_prismjs: true,
              codesample_languages: [
                { text: "JavaScript", value: "javascript" },
                { text: "Lisp", value: "lisp" },
              ],
            }}
          />
        </div>
        <div id="tags">
          {flashcard.tags.map((tag, index) => (
            <div
              key={index}
              onClick={() =>
                updateUnsavedData(flashcard._id, { tags: flashcard.tags.filter(({ _id }) => _id !== tag._id) })
              }
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
          {prerequisiteFlashcards.map((flashcardData, index) => (
            <div key={index} className="lineContainer">
              <FlashcardLine flashcardData={flashcardData} />
              <span
                className="lineClose"
                onClick={(e: React.MouseEvent<HTMLSpanElement>) => removePrerequisite(index)}
              ></span>
            </div>
          ))}
          <div className="prerequisiteInput">
            <AutoComplete
              dropdownList={availableFlashcardIds}
              callback={addPrerequisite}
              placeholder="Add a flashcard id"
              placement="top-start"
              onPaste={onPastePrerequisiteId}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
