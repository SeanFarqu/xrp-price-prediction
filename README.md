# XRP Price Prediction App

This project is a web application for predicting XRP (Ripple) prices using an LSTM model. The application consists of a Flask backend for serving the model predictions and a React frontend for displaying the predictions and historical data.

## Features

- Predicts XRP prices for the next 60 days.
- Displays historical and predicted data on a line chart.
- Allows users to select a date to view a specific prediction.
- Interactive date picker for selecting prediction dates.

## Tech Stack

- **Backend**: Flask, TensorFlow, Pandas, NumPy, Scikit-learn
- **Frontend**: React, Chart.js, React DatePicker
- **Deployment**: Docker

## Installation

### Prerequisites

- Docker
- Python 3.11

### Steps

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/xrp-prediction-app.git
cd xrp-prediction-app
```
2. **Set up the backend**

```bash
# Install Python dependencies
pip install -r requirements.txt
```
3. **Set up the frontend**

```bash
cd xrp-prediction-app
# Install Node.js dependencies
npm install
# Build the React app
npm run build
cd ..
```
4. **Run the application with Docker**

```bash
# Build the Docker image
docker build -t xrp-prediction-app .
# Run the Docker container
docker run -p 5000:5000 xrp-prediction-app
```
The application will be available at http://localhost:5000.

## Usage
- Open the web application in your browser.
- Use the date picker to select a date and view the prediction for that date.
- Click "View All Predictions" to see predictions for the next 60 days.
- The chart displays historical and predicted data.

## API Endpoints
- GET /: Serves the React app.
- GET /predict: Returns predictions for the next 60 days.
- GET /data: Returns the most recent 10 days of data.
- GET /prediction_chart: Returns historical data and predictions for the next 60 days.

## Acknowledgements
- This project uses data from the Alpha Vantage API.
- Special thanks to all contributors and supporters.
