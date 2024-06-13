document.addEventListener("DOMContentLoaded", function() {
    fetch("data/similarity_data.csv")
        .then(response => response.text())
        .then(data => {
            const rows = data.split("\n").slice(1);
            const similarities = rows.map(row => row.split(",").map(Number));
            const labels = Array.from({ length: similarities.length }, (_, i) => `Song ${i + 1}`);

            const pdata = [{
                z: similarities,
                x: labels,
                y: labels,
                type: 'heatmap',
                zmin: 0.6,
                zmax: 1
            }];

            Plotly.newPlot('similarityChart', pdata);

            const histograms = document.getElementById('histograms');
            N_range = [2, 3, 5, 10, 15];
            N_range.forEach((N, i) => {
                const histDiv = document.createElement('div');
                histDiv.id = `hist${N}`;
                histograms.appendChild(histDiv);
                Plotly.newPlot(`hist${N}`, [{
                    x: similarities.map(sim => sim[N]),
                    type: 'histogram'
                }], {
                    title: `AP@${N}`
                });
            });

            const mapDiv = document.getElementById('map');
            Plotly.newPlot(mapDiv, [{
                x: N_range,
                y: similarities.map(sim => sim.reduce((a, b) => a + b, 0) / sim.length),
                mode: 'lines+markers'
            }], {
                title: 'MAP@N by Genre'
            });
        });
});
