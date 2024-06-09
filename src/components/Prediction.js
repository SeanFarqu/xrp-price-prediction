import React, { useState, useEffect } from 'react';

const Prediction = ({ selectedDate }) => {
  const [prediction, setPrediction] = useState(null);
  const [allPredictions, setAllPredictions] = useState([]);

  useEffect(() => {
    fetch(`/predict`)
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error('Error fetching prediction:', data.error);
        } else {
          setAllPredictions(data.predictions);
        }
      })
      .catch((error) => {
        console.error('Error fetching prediction:', error);
      });
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const dateIndex = Math.floor((new Date(selectedDate) - new Date()) / (1000 * 60 * 60 * 24));
      if (dateIndex >= 0 && dateIndex < allPredictions.length) {
        setPrediction(allPredictions[dateIndex]);
      } else {
        setPrediction(null);
      }
    }
  }, [selectedDate, allPredictions]);

  return (
    <div>
      <h2>Prediction</h2>
      {selectedDate ? (
        <div>
          <h3>Prediction for {new Date(selectedDate).toDateString()}</h3>
          {prediction !== null ? <p>{prediction}</p> : <p>No prediction available for this date.</p>}
        </div>
      ) : (
        <div>
          <h3>All Predictions</h3>
          <ul>
            {allPredictions.map((pred, index) => (
              <li key={index}>
                <b>Day {index + 1}:</b> {pred}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Prediction;


