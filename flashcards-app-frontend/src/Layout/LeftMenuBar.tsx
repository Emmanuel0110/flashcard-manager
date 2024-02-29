import { useContext } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { ConfigContext } from "../App";

function LeftMenuBar() {
  const navigate = useNavigate();
  const { filter, setFilter } = useContext(ConfigContext);
  return (
    <div id="leftSideMenu">
      <Button style={{ marginBottom: "6px" }} onClick={() => navigate("/flashcards/new")}>
        New flashcard
      </Button>

      <div
        onClick={() => {
          setFilter("Published");
          navigate("/flashcards");
        }}
      >
        <div className={filter === "Published" ? "selected" : "unselected"}></div>
        <div>All flashcards</div>
      </div>
      <div
        onClick={() => {
          setFilter("Draft");
          navigate("/flashcards");
        }}
      >
        <div className={filter === "Draft" ? "selected" : "unselected"}></div>
        <div>Drafts</div>
      </div>
      <div
        onClick={() => {
          setFilter("To be validated");
          navigate("/flashcards");
        }}
      >
        <div className={filter === "To be validated" ? "selected" : "unselected"}></div>
        <div>To be validated</div>
      </div>
      <div
        onClick={() => {
          setFilter("My favorites");
          navigate("/flashcards");
        }}
      >
        <div className={filter === "My favorites" ? "selected" : "unselected"}></div>
        <div>My favorites</div>
      </div>
      <div id="githubIconArea">
        <a href="https://github.com/Emmanuel0110/flashcard-manager">
          <div className="githubIcon"></div>
        </a>
      </div>
    </div>
  );
}

export default LeftMenuBar;
