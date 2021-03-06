import React, { useState } from "react";

const SCORES = [0, 50, 100];

function ScoreSelector({
  fieldName,
  onChange = () => {},
  selectedItem = null,
  readOnly = false
}) {
  const [score, setScore] = useState(selectedItem);

  function onClick(value) {
    setScore(value);
    onChange(fieldName, value);
  }

  return (
    <div className="menu">
      {SCORES.map(scoreItem => (
        <button
          key={scoreItem}
          type="button"
          name={fieldName}
          value={scoreItem}
          disabled={readOnly}
          className={`menu__link${
            score === scoreItem ? " menu__link__active" : ""
          }`}
          onClick={() => onClick(scoreItem)}
        >
          {scoreItem}
          <svg
            version="1.1"
            xmlns="http://www.w3.org/2000/svg"
            xmlnsXlink="http://www.w3.org/1999/xlink"
            x="0px"
            y="0px"
            viewBox="0 0 152.9 43.4"
            style={{ enableBackground: "new 0 0 152.9 43.4" }}
            xmlSpace="preserve"
          >
            <path d="M151.9,13.6c0,0,3.3-9.5-85-8.3c-97,1.3-58.3,29-58.3,29s9.7,8.1,69.7,8.1c68.3,0,69.3-23.1,69.3-23.1 s1.7-10.5-14.7-18.4" />
          </svg>
        </button>
      ))}
    </div>
  );
}
export default ScoreSelector;
