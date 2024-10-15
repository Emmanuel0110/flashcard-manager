import "./shortcut.css";

function FormShortCuts() {
  return (
    <div>
      <table id="table">
        <tbody>
          <tr>
            <td>Ctrl + S</td>
            <td>Save</td>
          </tr>
          <tr>
            <td>Ctrl + Q</td>
            <td>Close tab</td>
          </tr>
          <tr>
            <td>Right click</td>
            <td>Close other tabs</td>
          </tr>
        </tbody>
      </table>
      <br/>
      <div>
        <p>
          <strong>Tags:</strong>
        </p>
        <p>Select a tag in the autocomplete list or press Enter to create a new tag</p>
        <p>Click on an inserted tag to remove it</p>
        <p>
          <strong>Prerequisites:</strong>
        </p>
        <p>Copy the flashcard id (found in the URL) to add it as a prerequisite</p>
      </div>
    </div>
  );
}

export default FormShortCuts;
