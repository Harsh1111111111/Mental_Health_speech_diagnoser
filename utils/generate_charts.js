const { nanoid } = require("nanoid");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const Chart = require("chart.js");
const { createCanvas } = require("canvas");
const fs = require("fs");
const path = require("path");

function wrapText(text, maxLength) {
    let lines = [];

    if (text.length > maxLength) {
        const words = text.split(" ");
        lines.push(...words);
    } else {
        lines.push(text);
    }

    return lines;
}

// Function to draw the bar chart
exports.drawBarChart = async (file_id = nanoid(), data) => {
    const canvasRenderService = new ChartJSNodeCanvas({
        width: 600,
        height: 300,
    });

    const configuration = {
        type: "bar",
        data: {
            labels: data.map((item) => wrapText(item.label, 10)),
            datasets: [
                {
                    label: "Values",
                    data: data.map((item) => item.value),
                    backgroundColor: data.map((item) => item.color),
                    borderWidth: 0,
                    borderRadius: 10, // Rounded corners for the bars
                },
            ],
        },
        options: {
            responsive: false,
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                },
            },
            scales: {
                x: {
                    ticks: {
                        color: "black", // X-axis label color
                        maxRotation: 0,
                        minRotation: 0,
                        autoSkip: false,
                    },
                },
                y: {
                    ticks: {
                        color: "black", // Y-axis label color
                        stepSize: 25, // Interval between ticks
                        callback: function (value) {
                            if (value % 25 === 0) {
                                return value;
                            }
                        },
                    },
                    beginAtZero: true,
                    max: 150, // Set the maximum value for the Y-axis
                },
            },
        },
    };

    const image = await canvasRenderService.renderToBuffer(configuration);

    const fileName = file_id + ".png";

    // Save the chart as an image
    const filePath = path.join(__dirname, "../public/charts", fileName);
    fs.writeFileSync(filePath, image);

    return [filePath, fileName];
};

// Function to draw the horizontal bar chart
exports.drawHorizontalBarChart = async (file_id = nanoid(), data) => {
    const canvasRenderService = new ChartJSNodeCanvas({
        width: 800,
        height: 400,
    });

    const configuration = {
        type: "bar", // Use bar chart type
        data: {
            labels: data.map((item) => item.label),
            datasets: [
                {
                    label: "Values",
                    data: data.map((item) => item.value),
                    backgroundColor: data.map((item) => item.color),
                    borderWidth: 0,
                    borderRadius: 10, // Rounded corners for the bars
                },
            ],
        },
        options: {
            responsive: false,
            indexAxis: "y", // Rotate the chart to be horizontal
            plugins: {
                legend: { display: false },
                title: {
                    display: true,
                },
            },
            scales: {
                x: {
                    ticks: { color: "black" }, // X-axis label color
                    beginAtZero: true,
                    stepSize: 25, // Interval between ticks
                    callback: function (value) {
                        if (value % 25 === 0) {
                            return value;
                        }
                    },
                    max: 100,
                },
                y: {
                    ticks: {
                        color: "black", // Y-axis label color
                    },
                },
            },
        },
    };

    const image = await canvasRenderService.renderToBuffer(configuration);

    const fileName = file_id + ".png";

    // Save the chart as an image
    const filePath = path.join(__dirname, "../public/charts", fileName);

    // Save the chart as an image
    fs.writeFileSync(filePath, image);

    return [filePath, fileName];
};

exports.createDoughnutChart = async (file_id, { labels, dataset, colors }) => {
    const canvasRenderService = new ChartJSNodeCanvas({
        width: 400,
        height: 400,
    });

    const configuration = {
        type: "doughnut",
        data: {
            labels: labels,
            datasets: [
                {
                    data: dataset,
                    backgroundColor: colors,
                    borderWidth: 0, // Remove the border
                },
            ],
        },
        options: {
            title: {
                display: true,
                text: "Fruit Sales",
            },
            legend: {
                display: false, // Hide the legend
            },
            animation: {
                duration: 0, // Disable animation for simplicity
            },
            tooltips: {
                enabled: false, // Disable tooltips
            },
            layout: {
                padding: 20, // Add some padding to the chart area
            },
            plugins: {
                datalabels: {
                    color: "#fff", // Label text color
                    font: {
                        weight: "bold", // Label font weight
                    },
                    formatter: (value, ctx) => {
                        // Display label only for segments with non-zero values
                        return value > 0 ? data.labels[ctx.dataIndex] : "";
                    },
                    anchor: "end", // Position the label near the end of the segment
                    align: "end", // Align the label to the end of the segment
                    offset: 5, // Set an offset between the label and the segment
                    clip: true, // Clip the label if it exceeds the segment
                    textAlign: "right", // Align the text to the right of the label box
                    labels: {
                        title: {
                            display: true,
                        },
                    },
                },
            },
        },
    };

    const image = await canvasRenderService.renderToBuffer(configuration);

    const fileName = file_id + ".png";

    // Save the chart as an image
    const filePath = path.join(__dirname, "../public/charts", fileName);
    fs.writeFileSync(filePath, image);

    return [filePath, fileName];
};

exports.createPieChart = async (file_id, { labels, dataset, colors }) => {
    const canvasRenderService = new ChartJSNodeCanvas({
        width: 400,
        height: 400,
    });

    const configuration = {
        type: "pie",
        data: {
            labels: labels,
            datasets: [
                {
                    data: dataset,
                    backgroundColor: colors,
                    borderWidth: 0, // Remove the border
                },
            ],
        },
        options: {
            title: {
                display: true,
                text: "Fruit Sales",
            },
            legend: {
                display: false, // Hide the legend
            },
            animation: {
                duration: 0, // Disable animation for simplicity
            },
            tooltips: {
                enabled: false, // Disable tooltips
            },
            layout: {
                padding: 20, // Add some padding to the chart area
            },
            plugins: {
                datalabels: {
                    color: "#fff", // Label text color
                    font: {
                        weight: "bold", // Label font weight
                    },
                    formatter: (value, ctx) => {
                        // Display label only for segments with non-zero values
                        return value > 0 ? data.labels[ctx.dataIndex] : "";
                    },
                    anchor: "end", // Position the label near the end of the segment
                    align: "end", // Align the label to the end of the segment
                    offset: 5, // Set an offset between the label and the segment
                    clip: true, // Clip the label if it exceeds the segment
                    textAlign: "right", // Align the text to the right of the label box
                    labels: {
                        title: {
                            display: true,
                        },
                    },
                },
            },
        },
    };

    const image = await canvasRenderService.renderToBuffer(configuration);

    const fileName = file_id + ".png";

    // Save the chart as an image
    const filePath = path.join(__dirname, "../public/charts", fileName);
    fs.writeFileSync(filePath, image);

    return [filePath, fileName];
};
