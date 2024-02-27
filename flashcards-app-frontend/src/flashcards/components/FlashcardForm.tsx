import "../../App.css";
import { Editor } from "@tinymce/tinymce-react";
import { useContext, useMemo, useRef } from "react";
import { Button } from "react-bootstrap";
import { Editor as TinyMCEEditor } from "tinymce";
import { edit, save } from "../flashcardActions";
import { ConfigContext } from "../../App";
import { Flashcard } from "../../types";
import { useNavigate, useParams } from "react-router-dom";

export const useSaveAsNewFlashcard = () => {
  const navigate = useNavigate();
  const { setFlashcards } = useContext(ConfigContext);
  return (infos: { title: string; question: string; answer: string }) => {
    save(infos)
      .then(({ data: newFlashcard }) => {
        setFlashcards((flashcards: Flashcard[]) => [...flashcards, newFlashcard]);
        navigate("/flashcards/" + newFlashcard._id + "/edit");
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };
};

export const useEditFlashcard = () => {
  const { setFlashcards } = useContext(ConfigContext);
  return (infos: Partial<Flashcard>) => {
    edit(infos)
      .then(({ data: updatedFlashcard }: { data: Flashcard }) => {
        setFlashcards((flashcards: Flashcard[]) =>
          flashcards.map((flashcard) => {
            return flashcard._id === updatedFlashcard._id ? updatedFlashcard : flashcard;
          })
        );
      })
      .catch((err: Error) => {
        console.log(err);
      });
  };
};

export default function FlashcardForm() {
  const questionRef = useRef<TinyMCEEditor | null>(null);
  const answerRef = useRef<TinyMCEEditor | null>(null);
  const { flashcardId } = useParams();
  const { filteredFlashcards: flashcards } = useContext(ConfigContext);
  const saveAsNewFlashcard = useSaveAsNewFlashcard();
  const editFlashcard = useEditFlashcard();

  const flashcard: Flashcard | undefined = useMemo(() => {
    return flashcards.find((flashcard: Flashcard) => flashcard._id === flashcardId);
  }, [flashcards]);

  const saveOrEditFlashcard = () => {
    if (questionRef.current && answerRef.current) {
      const title = questionRef.current.getContent({ format: "text" });
      const question = questionRef.current.getContent();
      const answer = answerRef.current.getContent();
      if (flashcard) {
        editFlashcard({ _id: flashcard._id, title, question, answer });
      } else {
        saveAsNewFlashcard({ title, question, answer });
      }
    }
  };

  return (
    <div id="flashcardForm">
      <div className="buttonHeader">
        <Button onClick={saveOrEditFlashcard}>Save</Button>
        <Button
          onClick={() =>
            saveAsNewFlashcard({ title: flashcard!.title, question: flashcard!.question, answer: flashcard!.answer })
          }
          disabled={flashcardId === undefined}
        >
          Save as new
        </Button>
      </div>
      <div id="form">
        <div id="question">
          <Editor
            tinymceScriptSrc="/public/to/tinymce.min.js"
            onInit={(evt, editor) => {
              questionRef.current = editor;
              questionRef.current.setContent(flashcard?.question || "");
            }}
            initialValue={flashcard?.question || ""}
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
              answerRef.current.setContent(flashcard?.answer || "");
            }}
            initialValue={flashcard?.answer || ""}
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
        <div id="tags"></div>
      </div>
    </div>
  );
}
