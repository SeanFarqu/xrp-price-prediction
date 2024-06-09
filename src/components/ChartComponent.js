import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart, registerables, TimeScale } from 'chart.js';
import 'chartjs-adapter-date-fns';

Chart.register(...registerables, TimeScale);

const ChartComponent = ({ data }) => {
    const chartData = {
        labels: data.map(entry => new Date(entry.index)),
        datasets: [
            {
                label: 'Close',
                data: data.map(entry => entry.close),
                borderColor: 'blue',
                fill: false,
            },
        ],
    };

    const options = {
        scales: {
            x: {
                type: 'time',
                time: {
                    unit: 'month',
                    displayFormats: {
                        month: 'MMM yyyy',
                    },
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
    };

    return <Line data={chartData} options={options} />;
};

export default ChartComponent;
