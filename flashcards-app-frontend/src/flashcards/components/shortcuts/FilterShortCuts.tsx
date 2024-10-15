import "./shortcut.css";

function FilterShortCuts() {
  return (
    <div>
      <table id="table">
        <tbody>
          <tr>
            <td>Tab</td>
            <td>Move the focus to the search bar</td>
          </tr>
          <tr>
            <td>Escape</td>
            <td>Clear the search bar and exit it</td>
          </tr>
          <tr>
            <td>Enter</td>
            <td>Add the current filter</td>
          </tr>
        </tbody>
      </table>
      <br />
      <div>
        <p>
          <strong>Filter Examples:</strong>
        </p>
        <ul>
          <li>
            <code>attribute</code>
          </li>
          <li>
            <code>"attribute field"</code> (exact match)
          </li>
          <li>
            <code>attribute field</code> (matches either "attribute" <strong>OR</strong> "field")
          </li>
          <li>
            <code>#model</code>
          </li>
          <li>
            <code>not #model</code>
          </li>
        </ul>
        <p>
          After adding a filter, click on its name to hide it or click on the <strong>x</strong> icon to remove it.
        </p>
        <p>
          When you add additional filters, they will be combined with the existing ones using an <strong>AND</strong>{" "}
          relationship.
        </p>
      </div>
    </div>
  );
}

export default FilterShortCuts;
