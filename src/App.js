import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Line } from 'react-chartjs-2';
import { Chart, registerables, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';
import { format } from 'date-fns';
import './App.css'; // Import custom CSS

Chart.register(...registerables, TimeScale);

function App() {
  const [predictions, setPredictions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [chartData, setChartData] = useState(null);

  useEffect(() => {
    axios.get('/prediction_chart')
      .then(response => {
        const data = response.data;
        console.log('Chart Data:', data); // Debug: Log chart data
        const chartData = {
          labels: data.map(d => new Date(d.index)),
          datasets: [{
            label: 'Close',
            data: data.map(d => d.close),
            fill: false,
            backgroundColor: 'blue',
            borderColor: 'blue',
            pointRadius: 1,
            pointHoverRadius: 5,
          }]
        };
        setChartData(chartData);
      })
      .catch(error => console.error('Error fetching chart data:', error));

    axios.get('/predict')
      .then(response => setPredictions(response.data.predictions))
      .catch(error => console.error('Error fetching predictions:', error));
  }, []);

  useEffect(() => {
    if (selectedDate) {
      const date = format(selectedDate, 'yyyy-MM-dd');
      const baseDate = new Date(); // Assuming predictions are made from the current date onwards
      const differenceInDays = Math.floor((new Date(date).getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
      if (differenceInDays >= 0 && differenceInDays < predictions.length) {
        setPrediction(predictions[differenceInDays]);
      } else {
        setPrediction(null);
      }
    }
  }, [selectedDate, predictions]);

  const handleDateChange = date => {
    setSelectedDate(date);
    setPrediction(null);
  };

  return (
    <div className="app">
      <h1 className="title">XRP Price Prediction App</h1>
      <div className="date-picker-container">
        <DatePicker 
          selected={selectedDate} 
          onChange={handleDateChange} 
          dateFormat="MM/dd/yyyy" 
          className="date-picker" 
        />
        <button className="all-predictions-button" onClick={() => setSelectedDate(null)}>View All Predictions</button>
      </div>
      <div className="prediction-section">
        <h2>Prediction</h2>
        {selectedDate ? (
          <div className="single-prediction">
            <p>Prediction for {format(selectedDate, 'EEE MMM dd yyyy')}</p>
            <p className="prediction-value">{prediction !== null ? prediction : 'No prediction available'}</p>
          </div>
        ) : (
          <div className="all-predictions">
            <h3>All Predictions</h3>
            <ul>
              {predictions.map((pred, idx) => (
                <li key={idx}><b>Day {idx + 1}</b>: {pred}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      {chartData ? (
        <div className="chart-container">
          <h2>Combined Historical and Predicted Data</h2>
          <Line 
            data={chartData} 
            options={{
              scales: {
                x: {
                  type: 'time',
                  time: {
                    unit: 'month',
                    displayFormats: {
                      month: 'MMM yyyy'
                    }
                  },
                  title: {
                    display: true,
                    text: 'Date',
                  },
                },
                y: {
                  title: {
                    display: true,
                    text: 'Price (USD)',
                  },
                },
              },
            }} 
          />
        </div>
      ) : (
        <p>Loading chart data...</p>
      )}
    </div>
  );
}

export default App;


