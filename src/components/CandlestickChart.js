import React, { useEffect, useState } from 'react';
import Chart from 'react-google-charts';

const CandlestickChart = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/candlestick')
      .then((response) => response.json())
      .then((data) => {
        const chartData = [
          ['Date', 'Low', 'Open', 'Close', 'High'],
          ...data.map((d) => [new Date(d.index), d.low, d.open, d.close, d.high]),
        ];
        setData(chartData);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching candlestick data:', error);
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h2>Candlestick Chart</h2>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <Chart
          width={'100%'}
          height={400}
          chartType="CandlestickChart"
          loader={<div>Loading Chart...</div>}
          data={data}
          options={{
            legend: 'none',
            bar: { groupWidth: '100%' },
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

export default CandlestickChart;

