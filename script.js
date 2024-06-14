document.addEventListener("DOMContentLoaded", function() {
    fetch("data/similarity_data.csv")
        .then(response => response.text())
        .then(data => {
            const rows = data.trim().split("\n").map(row => row.split(","));
            const headers = rows[0];
            const numericColumns = headers.slice(1);
            const N_range = numericColumns.map(col => parseInt(col.slice(1)));
            const genresList = [
                ['Romantic', 'Melody'], ['Romantic', 'Melody'], ['Romantic', 'Sad'],
                ['Romantic', 'Upbeat'], ['Romantic', 'Folk'], ['Romantic', 'Melody'],
                ['Mass', 'Inspirational'], ['Melody'], ['Romantic', 'Melody'],
                ['Folk', 'Dance'], ['Folk', 'Dance'], ['Romantic', 'Upbeat'],
                ['Inspirational', 'Mass'], ['Romantic', 'Melody'], ['Romantic', 'Melody'],
                ['Romantic', 'Melody'], ['Romantic', 'Melody'], ['Melody'],
                ['Romantic', 'Sad'], ['Romantic', 'Melody']
            ];

            const df = rows.slice(1).map((row, index) => {
                const obj = {};
                headers.forEach((header, i) => {
                    obj[header] = i === 0 ? row[i] : parseFloat(row[i]);
                });
                obj.genre = genresList[index].join(',');
                return obj;
            });

            const uniqueGenres = [...new Set(df.map(row => row.genre))];

            const mAP_by_genre = {};
            uniqueGenres.forEach(genre => {
                mAP_by_genre[genre] = numericColumns.map(col => {
                    const filtered = df.filter(row => row.genre === genre);
                    const mean = filtered.reduce((acc, row) => acc + row[col], 0) / filtered.length;
                    return isNaN(mean) ? 0 : mean;
                });
            });

            const mAP_dataset = numericColumns.map(col => {
                const mean = df.reduce((acc, row) => acc + row[col], 0) / df.length;
                return isNaN(mean) ? 0 : mean;
            });

            const tableContainer = document.getElementById('table-container');
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                const th = document.createElement('th');
                th.textContent = header.trim();
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            df.forEach(row => {
                const tr = document.createElement('tr');
                headers.forEach(header => {
                    const td = document.createElement('td');
                    td.textContent = row[header];
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            tableContainer.appendChild(table);

            const traces = uniqueGenres.map(genre => ({
                x: N_range,
                y: mAP_by_genre[genre],
                mode: 'lines+markers',
                name: genre
            }));

            traces.push({
                x: N_range,
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

            const rowsArr = data.split("\n").slice(1);
            const similarities = rowsArr.map(row => row.split(",").map(Number));
            const labels = Array.from({ length: similarities.length }, (_, i) => `Song ${i + 1}`);
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
            const range = [3, 5, 8, 10];
            range.forEach((N, i) => {
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
        });
});
