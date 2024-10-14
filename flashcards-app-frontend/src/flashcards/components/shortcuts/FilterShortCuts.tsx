import "./shortcut.css";

function FilterShortCuts() {
  return (
    <div>
      <table id="table">
        <tbody>
          <tr>
            <td>Tab</td>
            <td>Focus the search bar</td>
          </tr>
          <tr>
            <td>Escape</td>
            <td>Empty and leave the search bar</td>
          </tr>
          <tr>
            <td>Enter</td>
            <td>Add the filter</td>
          </tr>
        </tbody>
      </table>
      <br/>
      <div>
        <p>Exemples of filter: attribute, "attribute field", attribute field <span style={{fontStyle: "italic"}}>(which means it contains "attribute" OR "field")</span>, #model, not #model</p>
        <p>Once a filter is added, click on its name to hide it or on the cross to remove it</p>
      </div>
    </div>
  );
}

export default FilterShortCuts;
