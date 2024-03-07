import { useContext } from "react";
import { Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { ConfigContext } from "../App";

function LeftMenuBar() {
  const navigate = useNavigate();
  const { filter, setFilter } = useContext(ConfigContext);

  const startReview = () => {
    setFilter("To be reviewed");
  };
  return (
    <div id="leftSideMenu">
      <div id="leftSideMenuItems">
        <div>
          <Button style={{ margin: "0px 10px 6px" }} onClick={() => navigate("/flashcards/new")}>
            New flashcard
          </Button>
        </div>
        <div id="filterSection">
          <div onClick={() => setFilter("Published")}>
            <div className={filter === "Published" ? "selected" : "unselected"}></div>
            <div>All flashcards</div>
          </div>
          <div onClick={() => setFilter("Draft")}>
            <div className={filter === "Draft" ? "selected" : "unselected"}></div>
            <div>Drafts</div>
          </div>
          <div onClick={() => setFilter("To be validated")}>
            <div className={filter === "To be validated" ? "selected" : "unselected"}></div>
            <div>To be validated</div>
          </div>
          <div onClick={() => setFilter("My favorites")}>
            <div className={filter === "My favorites" ? "selected" : "unselected"}></div>
            <div>My favorites</div>
          </div>
        </div>
      </div>
      <div>
        <Button id="startAReviewButton" variant="outline-primary" onClick={startReview}>
          Start a review
        </Button>
      </div>
    </div>
  );
}

export default LeftMenuBar;
