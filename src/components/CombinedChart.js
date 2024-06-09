import React, { useEffect, useState } from 'react';
import Chart from 'react-google-charts';
import axios from 'axios';

const CombinedChart = () => {
    const [data, setData] = useState([]);
    const [error, setError] = useState('');

    useEffect(() => {
        axios.get('/prediction_chart')
            .then(response => {
                const chartData = [['Date', 'Price']];
                response.data.forEach(item => {
                    chartData.push([new Date(item.index), item.close]);
                });
                setData(chartData);
            })
            .catch(error => {
                console.error('There was an error fetching the combined data!', error);
                setError('There was an error fetching the combined data.');
            });
    }, []);

    if (error) {
        return <div>{error}</div>;
    }

    return (
        <div>
            <h2>Combined Historical and Predicted Data</h2>
            <Chart
                width={'100%'}
                height={'400px'}
                chartType="LineChart"
                loader={<div>Loading Chart...</div>}
                data={data}
                options={{
                    legend: 'none',
                }}
                rootProps={{ 'data-testid': '1' }}
            />
        </div>
    );
};

export default CombinedChart;
