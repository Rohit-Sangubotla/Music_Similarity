document.addEventListener("DOMContentLoaded", function() {
    fetch("data/similarity_data.csv")
        .then(response => response.text())
        .then(data => {
            const rows = data.split("\n").slice(1);
            const rowsArr = data.split("\n").map(row => row.split(","));
            const similarities = rows.map(row => row.split(",").map(Number));
            const labels = Array.from({ length: similarities.length }, (_, i) => `Song ${i + 1}`);

            const tableContainer = document.getElementById('table-container');

            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            const headerRow = document.createElement('tr');
            rowsArr[0].forEach(header => {
                const th = document.createElement('th');
                th.textContent = parseInt(header.trim()) + 1;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            rowsArr.slice(1).forEach(row => {
                const tr = document.createElement('tr');
                row.forEach(cell => {
                    const td = document.createElement('td');
                    td.textContent = parseFloat(cell.trim()).toFixed(4);
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            tableContainer.appendChild(table); //table till here

            const pdata = [{
                z: similarities,
                x: labels,
                y: labels,
                type: 'heatmap',
                zmin: 0.6,
                zmax: 1
            }];

            Plotly.newPlot('similarityChart', pdata); // heatmap

            const histograms = document.getElementById('histograms');
            N_range = [2, 3, 5, 10];
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

            const headers = rowsArr[0];
            const numericColumns = headers.slice(1);

            const df = rows.slice(1).map(row => {
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = i === 0 ? row[i] : parseFloat(row[i]);
                });
                return obj;
            });


            // Group by genre and calculate mean for each genre
            const genres = [...new Set(df.map(row => row.genre))];
            const mAP_by_genre = {};
            genres.forEach(genre => {
                mAP_by_genre[genre] = numericColumns.map(col => {
                    const filtered = df.filter(row => row.genre === genre);
                    return filtered.reduce((acc, row) => acc + row[col], 0) / filtered.length;
                });
            });

            // Calculate mean for entire dataset
            const mAP_dataset = numericColumns.map(col => {
                return df.reduce((acc, row) => acc + row[col], 0) / df.length;
            });
             // Plot data
             const traces = genres.map(genre => ({
                x: numericColumns.map(col => parseInt(col.slice(1))),
                y: mAP_by_genre[genre],
                mode: 'lines+markers',
                name: genre
            }));

            // Add mean line
            traces.push({
                x: numericColumns.map(col => parseInt(col.slice(1))),
                y: mAP_dataset,
                mode: 'lines+markers',
                name: 'mean',
                line: { width: 4, dash: 'dash' }
            });

            Plotly.newPlot('map', traces, {
                title: 'MAP@N by Genre',
                xaxis: { title: 'N' },
                yaxis: { title: 'MAP@N' }
            });
        });
});
