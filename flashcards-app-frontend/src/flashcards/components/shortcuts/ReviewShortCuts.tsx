import "./shortcut.css";

function ReviewShortCuts() {
  return (
    <table id="table">
      <tbody>
        <tr>
          <td>Enter</td>
          <td>Show answer</td>
        </tr>
        <tr>
          <td>1</td>
          <td>Review in 1 day</td>
        </tr>
        <tr>
          <td>2</td>
          <td>Review in 1 week</td>
        </tr>
        <tr>
          <td>3</td>
          <td>Review in 1 month</td>
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
      </tbody>
    </table>
  );
}

export default ReviewShortCuts;
