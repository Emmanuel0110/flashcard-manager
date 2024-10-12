import { relative } from "path";
import "./shortcut.css";

type Position = "bottom" | "left" | "right" | "top";

function Shortcuts({ children, position, color, backgroundColor }: { children: JSX.Element; position: string, color: string, backgroundColor: string }) {
  const [position1, position2] = position.split("-");

  const opposite = {
    bottom: "top",
    left: "right",
    right: "left",
    top: "bottom",
  };

  const startOrEnd = {
    bottom: "start",
    left: "end",
    right: "start",
    top: "end",
  };

  return (
    <div style={{ position: "relative" }}>
      <div
        style={{ position: "absolute", [opposite[position1 as Position]]: "0", [opposite[position2 as Position]]: "0" }}
      >
        <div
          id="shortcuts"
          style={{
            alignItems: "flex-" + startOrEnd[position1 as Position],
            justifyContent: "flex-" + startOrEnd[position2 as Position],
            color,
            backgroundColor
          }}
        >
          <div id="questionMark" style={{[opposite[position1 as Position]]: position1 === "top" ?"-3px" : "-4px", [opposite[position2 as Position]]: "9px"}}>?</div>
          <div
            style={{
              marginTop: position1 === "bottom" ? "30px" : "13px",
              marginRight: position2 === "left" ? "30px" : "13px",
              marginBottom: position1 === "top" ? "30px" : "13px",
              marginLeft: position2 === "right" ? "30px" : "13px",
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Shortcuts;
