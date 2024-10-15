import "./shortcut.css";

function DetailShortCuts() {
  return (
    <table id="table">
      <tbody>
        <tr>
          <td>Ctrl + E</td>
          <td>Edit (only author)</td>
        </tr>
        <tr>
          <td>Ctrl + L</td>
          <td>Save as new</td>
        </tr>
        <tr>
          <td>Ctrl + Q</td>
          <td>Close tab</td>
        </tr>
        <tr>
          <td>Right click</td>
          <td>Close other tabs</td>
        </tr>
        <tr>
          <td>4</td>
          <td>Mark as known</td>
        </tr>
        <tr>
          <td>Arrow left</td>
          <td>Previous card</td>
        </tr>
        <tr>
          <td>Arrow right</td>
          <td>Next card</td>
        </tr>
        <tr>
          <td>Arrow up</td>
          <td style={{whiteSpace: "pre-line"}}>{"Show the list of cards using \n this card as prerequisite"}</td>
        </tr>
        <tr>
          <td>Arrow down</td>
          <td>Show the list of prerequisites</td>
        </tr>
        <tr>
          <td>Alt + Arrow left/right</td>
          <td>Go back/forward</td>
        </tr>
      </tbody>
    </table>
  );
}

export default DetailShortCuts;
