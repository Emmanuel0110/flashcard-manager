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
  prerequisites: prerequisiteFlashcards,
  updateUnsavedData,
}: {
  flashcard: Flashcard;
  prerequisites: Flashcard[];
  updateUnsavedData: (id: string, args: Partial<Flashcard>) => void;
}) {
  const questionRef = useRef<TinyMCEEditor | null>(null);
  const answerRef = useRef<TinyMCEEditor | null>(null);
  const prerequisiteInputRef = useRef<HTMLInputElement>(null);
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
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [flashcard]);

  const onSave = () => {
    if (questionRef.current && answerRef.current) {
      const { _id, title, question, answer, tags, prerequisites } = flashcard;
      saveFlashcard({ _id, title, question, answer, tags, prerequisites });
      setOpenedFlashcards((openedFlashcards) =>
        openedFlashcards.map((openedFlashcard) =>
          openedFlashcard.id === flashcard._id
            ? { ...openedFlashcard, data: openedFlashcard.unsavedData!, unsavedData: undefined }
            : openedFlashcard
        )
      );
    }
  };

  const addTag = ({ _id, label }: { _id?: string; label?: string }) => {
    if (_id && (!flashcard || !flashcard.tags.map((tag) => tag._id).includes(_id))) {
      updateUnsavedData(flashcard._id, { tags: [...flashcard.tags, tags.find((tag: Tag) => tag._id === _id)!] });
    } else if (label && !tags.map((tag) => tag.label).includes(label)) {
      saveNewTag({ label }).then(({ data: tag }) => {
        setTags((tags: Tag[]) => [...tags, tag]);
        updateUnsavedData(flashcard._id, { tags: [...flashcard.tags, tag] });
      });
    }
  };

  const availableTags = tags.filter((tag) => !flashcard.tags.map((tag) => tag._id).includes(tag._id));

  const onPaste = (e: React.ClipboardEvent) => {
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
            tinymceScriptSrc="/public/to/tinymce.min.js"
            onInit={(evt, editor) => {
              questionRef.current = editor;
              questionRef.current.setContent(flashcard.question);
              editor.focus();
            }}
            onChange={() =>
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
            onChange={() => updateUnsavedData(flashcard._id, { answer: answerRef.current?.getContent() || "" })}
            initialValue={flashcard.answer}
            init={{
              placeholder: "Answer",
              height: 500,
              setup: (editor) => editor.on("keydown", handleKeyDown),
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
            <FlashcardLine key={index} flashcardData={flashcardData} />
          ))}
          <div className="tagInput">
            <input ref={prerequisiteInputRef} type="text" placeholder="Add a flashcard id" onPaste={onPaste} />
          </div>
        </div>
      </div>
    </div>
  );
}
