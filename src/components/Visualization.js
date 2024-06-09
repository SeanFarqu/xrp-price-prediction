import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart } from 'react-google-charts';

const Visualization = () => {
    const [data, setData] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        axios.get('/candlestick')
            .then(response => {
                const candlestickData = response.data.map(d => [
                    new Date(d.index),
                    d.open,
                    d.low,
                    d.high,
                    d.close
                ]);
                setData([
                    ['Date', 'Open', 'Low', 'High', 'Close'],
                    ...candlestickData
                ]);
            })
            .catch(error => {
                setError(error);
                console.error('There was an error fetching the candlestick data!', error);
            });
    }, []);

    return (
        <div>
            <h2>Candlestick Chart</h2>
            {error ? (
                <div>There was an error fetching the candlestick data.</div>
            ) : (
                <Chart
                    width={'100%'}
                    height={'400px'}
                    chartType="CandlestickChart"
                    loader={<div>Loading Chart...</div>}
                    data={data}
                    options={{
                        legend: 'none',
                        candlestick: {
                            fallingColor: { strokeWidth: 0, fill: '#a52714' },
                            risingColor: { strokeWidth: 0, fill: '#0f9d58' },
                        },
                    }}
                />
            )}
        </div>
    );
};

export default Visualization;
