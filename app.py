import logging
import requests
import pandas as pd
from flask import Flask, jsonify, send_from_directory
from sklearn.preprocessing import MinMaxScaler
import tensorflow as tf
import numpy as np

app = Flask(__name__, static_folder='xrp-prediction-app/build', static_url_path='')

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load the model
model = tf.keras.models.load_model('lstm_model.keras')

# Function to get the latest XRP data
def get_recent_data(days=365):
    api_key = '4DC6EKC7F7AD5P1L'
    symbol = 'XRPUSD'
    url = f'https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol={symbol}&apikey={api_key}'
    response = requests.get(url)
    data = response.json()

    if 'Time Series (Daily)' in data:
        df = pd.DataFrame.from_dict(data['Time Series (Daily)'], orient='index')
        df.columns = ['open', 'high', 'low', 'close', 'volume']
        df.index = pd.to_datetime(df.index)
        df = df.astype(float)
        df = df.sort_index()
        return df.tail(days)  # Get the last `days` days
    elif 'Error Message' in data:
        raise ValueError(f"Error fetching data: {data['Error Message']}")
    else:
        raise ValueError(f"Unexpected response structure: {data}")

# Function to create dataset
def create_dataset(data, time_step=1):
    X = []
    for i in range(len(data) - time_step - 1):
        X.append(data[i:(i + time_step), 0])
    return np.array(X)

# Route for serving the React app
@app.route('/')
def serve():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/predict', methods=['GET'])
def predict():
    try:
        # Retrieve and process data
        df = get_recent_data()
        
        # Ensure the data has a regular frequency (daily frequency)
        df = df.asfreq('D')

        # Handle missing values by forward filling
        df = df.ffill()

        # Calculate moving averages
        df['SMA_20'] = df['close'].rolling(window=20).mean()
        df['SMA_50'] = df['close'].rolling(window=50).mean()
        df['EMA_20'] = df['close'].ewm(span=20, adjust=False).mean()

        # Calculate RSI
        df['RSI'] = calculate_rsi(df)

        # Calculate MACD
        df['MACD'], df['MACD_Signal'] = calculate_macd(df)

        # Calculate Bollinger Bands
        df['BB_upper'] = df['SMA_20'] + (df['close'].rolling(window=20).std() * 2)
        df['BB_lower'] = df['SMA_20'] - (df['close'].rolling(window=20).std() * 2)

        # Calculate ADX
        df['ADX'] = calculate_adx(df)

        # Lag features
        for lag in range(1, 8):  # Example: 7 lag features
            df[f'lag_{lag}'] = df['close'].shift(lag)

        # Rolling statistics
        df['Rolling_Mean'] = df['close'].rolling(window=20).mean()
        df['Rolling_Std'] = df['close'].rolling(window=20).std()

        # Datetime features
        df['day_of_week'] = df.index.dayofweek
        df['month'] = df.index.month

        # Drop rows with NaN values
        df = df.dropna()

        logger.info(f"Processed DataFrame: \n{df}")

        # Prepare input data for the model
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(df['close'].values.reshape(-1, 1))
        time_step = 10
        dataX = create_dataset(scaled_data, time_step)

        # Debugging info
        logger.info(f"dataX shape: {dataX.shape}")
        if dataX.size == 0:
            raise ValueError("The dataset 'dataX' is empty. Ensure there is enough data for the specified time_step.")

        input_data = np.array(dataX[-1]).reshape(1, time_step, 1)

        # Make prediction for the next 60 days
        predictions = []
        for _ in range(60):
            pred = model.predict(input_data)
            predictions.append(pred[0][0])
            new_data = np.append(dataX[-1][1:], pred).reshape((1, time_step, 1))
            input_data = new_data

        predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))

        logger.info(f"Predictions for the next 60 days: {predictions.flatten().tolist()}")

        # Return predictions
        return jsonify({'predictions': predictions.flatten().tolist()})
    except Exception as e:
        logger.error("An error occurred during prediction", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/data', methods=['GET'])
def get_data():
    try:
        df = get_recent_data()
        data = df.tail(10).to_dict(orient='records')
        return jsonify(data)
    except Exception as e:
        logger.error("An error occurred during data retrieval", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/candlestick', methods=['GET'])
def candlestick():
    try:
        df = get_recent_data()
        data = df.to_dict(orient='records')
        return jsonify(data)
    except Exception as e:
        logger.error("An error occurred during data retrieval for candlestick chart", exc_info=True)
        return jsonify({'error': str(e)}), 500

@app.route('/prediction_chart', methods=['GET'])
def prediction_chart():
    try:
        # Retrieve and process data
        df = get_recent_data(days=365)
        
        # Ensure the data has a regular frequency (daily frequency)
        df = df.asfreq('D')

        # Handle missing values by forward filling
        df = df.ffill()

        # Prepare input data for the model
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(df['close'].values.reshape(-1, 1))
        time_step = 10
        dataX = create_dataset(scaled_data, time_step)

        if dataX.size == 0:
            raise ValueError("The dataset 'dataX' is empty. Ensure there is enough data for the specified time_step.")

        input_data = np.array(dataX[-1]).reshape(1, time_step, 1)

        # Make prediction for the next 60 days
        predictions = []
        for _ in range(60):
            pred = model.predict(input_data)
            predictions.append(pred[0][0])
            new_data = np.append(dataX[-1][1:], pred).reshape((1, time_step, 1))
            input_data = new_data

        predictions = scaler.inverse_transform(np.array(predictions).reshape(-1, 1))

        # Combine historical and predicted data
        historical_data = df['close'].tolist()
        prediction_dates = pd.date_range(start=df.index[-1] + pd.Timedelta(days=1), periods=60, freq='D')
        prediction_df = pd.DataFrame(predictions, index=prediction_dates, columns=['close'])
        combined_data = pd.concat([df['close'], prediction_df['close']])

        logger.info(f"Combined Data: \n{combined_data}")

        # Return combined data
        combined_data_json = combined_data.reset_index().to_dict(orient='records')
        return jsonify(combined_data_json)
    except Exception as e:
        logger.error("An error occurred during prediction chart data generation", exc_info=True)
        return jsonify({'error': str(e)}), 500

# Function to calculate RSI
def calculate_rsi(df, window=14):
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=window).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=window).mean()
    rs = gain / loss
    return 100 - (100 / (1 + rs))

# Function to calculate MACD
def calculate_macd(df, short_window=12, long_window=26, signal_window=9):
    short_ema = df['close'].ewm(span=short_window, adjust=False).mean()
    long_ema = df['close'].ewm(span=long_window, adjust=False).mean()
    macd = short_ema - long_ema
    signal = macd.ewm(span=signal_window, adjust=False).mean()
    return macd, signal

# Function to calculate ADX
def calculate_adx(df, window=14):
    high = df['high']
    low = df['low']
    close = df['close']

    plus_dm = high.diff()
    minus_dm = low.diff()

    plus_dm[plus_dm < 0] = 0
    minus_dm[minus_dm > 0] = 0

    tr1 = pd.DataFrame(high - low)
    tr2 = pd.DataFrame(abs(high - close.shift(1)))
    tr3 = pd.DataFrame(abs(low - close.shift(1)))
    tr = pd.concat([tr1, tr2, tr3], axis=1, join='inner').max(axis=1)

    atr = tr.rolling(window=window).mean()
    plus_di = 100 * (plus_dm.rolling(window=window).mean() / atr)
    minus_di = abs(100 * (minus_dm.rolling(window=window).mean() / atr))
    adx = 100 * (abs(plus_di - minus_di) / (plus_di + minus_di)).rolling(window=window).mean()

    return adx

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)

