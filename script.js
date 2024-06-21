import { network } from "https://cdn.jsdelivr.net/npm/@gramex/network@2";
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

document.addEventListener("DOMContentLoaded", function () {
    // SIMILARITY BETWEEN SONGS
    fetch("data/similarity_data.csv")
        .then(response => response.text())
        .then(data => {
            const rowsString = data.split("\n");
            const similarities = rowsString.slice(1).map(row => row.split(",").map(Number));

            // normalizing values because v/xery far apart 
            const minSim = Math.min(...similarities.flat());
            const maxSim = Math.max(...similarities.flat());
            const normalizedSimilarities = similarities.map(row => row.map(value => (value - minSim) / (maxSim - minSim)));

            const labels = [];
            for (let i = 0; i < normalizedSimilarities.length; i++) {
                labels.push(`Song ${i + 1}`);
            }

            const pdata = [{
                z: normalizedSimilarities,
                x: labels,
                y: labels,
                type: 'heatmap',
                zmin: 0,
                zmax: 1,
            }];
            const layout = {
                paper_bgcolor: "#121212"
            };
            Plotly.newPlot('similarity-chart', pdata, layout); // heatmap

            const nodes = normalizedSimilarities.map((_, i) => ({ id: `Song ${i}`, degree: 0 }));
            const links = [];

            for (let i = 0; i < normalizedSimilarities.length; i++) {
                for (let j = 0; j < normalizedSimilarities[i].length; j++) {
                    if (i !== j && normalizedSimilarities[i][j] >= 0.93) {
                        links.push({
                            source: `Song ${i}`,
                            target: `Song ${j}`,
                            value: normalizedSimilarities[i][j]
                        });
                        nodes[i].degree += 1;
                        nodes[j].degree += 1;
                    }
                }
            }

            const graph = network("#network", {
                nodes, links,
                forces: {
                    charge: () => d3.forceManyBody().strength(-500),
                    collide: () => d3.forceCollide().radius(d => 32 - d.depth * 4).iterations(3),
                    center: ({ width, height }) => d3.forceCenter(width / 2, height / 2),
                },
                d3
            });

            const rScale = d3.scaleLinear()
                .domain(d3.extent(nodes, d => d.degree))
                .range([3, 20]);

            graph.nodes
                .attr("fill", "rgba(100,100,255,0.6)")
                .attr("r", d => rScale(d.degree))
                .attr("data-bs-toggle", "tooltip")
                .attr("title", (d) => d.id);

            graph.links.attr("stroke", "rgba(255,255,255,0.2)");

            new bootstrap.Tooltip("#network", {
                selector: '[data-bs-toggle="tooltip"]'

            });
        });

    // AP THROUGH GENRES
    fetch("data/genre_similarity.csv")
        .then(response => response.text())
        .then(data => {

            function splitCsv(str) {
                const result = str.split(',').reduce((accum, curr) => {
                    if (accum.isConcatting) {
                        accum.soFar[accum.soFar.length - 1] += ',' + curr;
                    } else {
                        accum.soFar.push(curr);
                    }
                    if (curr.split('"').length % 2 == 0) {
                        accum.isConcatting = !accum.isConcatting;
                    }
                    return accum;
                }, { soFar: [], isConcatting: false }).soFar;

                return result.map(item => item.replace(/"/g, '')); // removing the quotes themselves
            }


            const rows = data.split("\n").map(row =>
                splitCsv(row)
            );

            const headers = rows[0];

            const tableContainer = document.getElementById('table-container-2');
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            console.log(headers);
            const headerRow = document.createElement('tr');
            let ts = document.createElement('th');
            ts.textContent = 'Sr No.';
            headerRow.appendChild(ts);
            headers.forEach(header => {
                let th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            let num = 0;
            rows.slice(1,).forEach(row => {
                let tr = document.createElement('tr');
                let tsr = document.createElement('td');
                tsr.textContent = num;
                num += 1;
                tr.appendChild(tsr);
                let rowAbs = row.length == 7 ? row : row.slice(0, -1);
                rowAbs.forEach(value => {
                    let td = document.createElement('td');
                    let hasNumber = /\d/;
                    if (hasNumber.test(value)) {
                        let num = parseFloat(value);
                        value = num.toFixed(4);
                        if (num == Math.floor(num)) value = Math.floor(num);
                    }
                    td.textContent = value;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });

            table.appendChild(thead);
            table.appendChild(tbody);
            tableContainer.appendChild(table);
        });

    // MAP BY GENRE
    fetch("data/map_by_genre.csv")
        .then(response => response.text())
        .then(data => {
            const rows = data.split("\n").map(row =>
                row.split(",")
            );
            for (let i = 0; i < rows.length; i++) {
                if (rows[i][0].includes('"') && rows[i][1].includes('"')) {
                    rows[i][0] = rows[i][0].concat(", ", rows[i][1]).replace(/\"/g, '');
                    for (let j = 1; j < rows[i].length; j++)
                        rows[i][j] = rows[i][j + 1];
                }
            }
            const headers = rows[0];

            const tableContainer = document.getElementById('table-container-3');
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                let th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            rows.slice(1).forEach(row => {
                let tr = document.createElement('tr');
                let rowAbs = row.length == 6 ? row : row.slice(0, -1);
                rowAbs.forEach(value => {
                    let td = document.createElement('td');
                    let hasNumber = /\d/;
                    if (hasNumber.test(value)) {
                        let num = parseFloat(value);
                        value = num.toFixed(4);
                    }
                    td.textContent = value;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });

            let tr = document.createElement('tr');
            let tg = document.createElement('th');
            tg.textContent = 'Mean of all genres';
            tr.appendChild(tg);
            let avg = [0.7778, 0.7150, 0.6265, 0.6046, 0.6083];
            for (let x in avg) {
                let td = document.createElement('th');
                td.textContent = avg[x];
                tr.appendChild(td);
            }
            tbody.appendChild(tr);

            table.appendChild(thead);
            table.appendChild(tbody);
            tableContainer.appendChild(table); // table for MAP by genre

            rows.shift()
            let traces = [];
            for (let i = 0; i < rows.length; i++) {
                let trace = {
                    x: headers.slice(1), 
                    y: rows[i].slice(1).map(Number),
                    name: rows[i][0],
                    type: 'scatter'
                };
                traces.push(trace);
            }

            const layout = {
                title: 'MAP@N by Genre',
                xaxis: { title: 'N' },
                yaxis: { title: 'MAP@N' },
                paper_bgcolor: '#121212',
                plot_bgcolor: '#121212',
                font: {
                    color: '#D3D3D3'
                }
            };

            Plotly.newPlot('mean-precision-graph', traces, layout);

        });

    // DEMUCS 
    fetch("data/demucs_similarity.csv")
        .then(response => response.text())
        .then(data => {
            const rows = data.split("\n").map(row => row.split(","));
            const headers = rows[0];

            const tableContainer = document.getElementById('table-container-4');
            const table = document.createElement('table');
            const thead = document.createElement('thead');
            const tbody = document.createElement('tbody');

            const headerRow = document.createElement('tr');
            headers.forEach(header => {
                let th = document.createElement('th');
                th.textContent = header;
                headerRow.appendChild(th);
            });
            thead.appendChild(headerRow);

            rows.slice(1).forEach(row => {
                let tr = document.createElement('tr');
                row.forEach(value => {
                    let td = document.createElement('td');
                    let hasNumber = /\d/;
                    if (hasNumber.test(value)) {
                        let num = parseFloat(value);
                        value = num.toFixed(4);
                    }
                    td.textContent = value;
                    tr.appendChild(td);
                });
                tbody.appendChild(tr);
            });
            table.appendChild(thead);
            table.appendChild(tbody);
            tableContainer.appendChild(table); 
        });

    // SINGERS 
    fetch("data/similarity_data_singers_std.csv")
        .then(response => response.text())
        .then(data => {
            const rowsString = data.split("\n");
            const similarities = rowsString.slice(1).map(row => row.split(",").map(Number));

            // normalizing values because very far apart 
            const minSim = Math.min(...similarities.flat());
            const maxSim = Math.max(...similarities.flat());
            const normalizedSimilarities = similarities.map(row => row.map(value => (value - minSim) / (maxSim - minSim)));

            const labels = [];
            for (let i = 0; i < normalizedSimilarities.length; i++) {
                labels.push(`Song ${i + 1}`);
            }

            const pdata = [{
                z: normalizedSimilarities,
                x: labels,
                y: labels,
                type: 'heatmap',
                zmin: 0,
                zmax: 1,
            }];
            const layout = {
                paper_bgcolor: "#121212",
                autosize: false,
                width: 500,
                height: 500,
            };

            Plotly.newPlot('singers-similarity-chart', pdata, layout); // heatmap 2 

            const nodes = normalizedSimilarities.map((_, i) => ({ id: `Song ${i}`, degree: 0, num: i }));
            const links = [];

            for (let i = 0; i < normalizedSimilarities.length; i++) {
                for (let j = 0; j < normalizedSimilarities[i].length; j++) {
                    if (i !== j && normalizedSimilarities[i][j] >= 0.93) {
                        links.push({
                            source: `Song ${i}`,
                            target: `Song ${j}`,
                            value: normalizedSimilarities[i][j]
                        });
                        nodes[i].degree += 1;
                        nodes[j].degree += 1;
                    }
                }
            }

            const graph = network("#network2", {
                nodes, links,
                forces: {
                    charge: () => d3.forceManyBody().strength(-500),
                    collide: () => d3.forceCollide().radius(d => 32 - d.depth * 4).iterations(3),
                    centerX: () => d3.forceX(750).strength(0.1),
                    centerY: () => d3.forceY(500).strength(0.1),
                },
                d3
            });

            const rScale = d3.scaleLinear()
                .domain(d3.extent(nodes, d => d.degree))
                .range([3, 20]);

            graph.nodes
                .attr("fill", (d) => d.num / 40 >= 1 ? "rgba(100,100,255,0.6)" : "rgba(255,100,100,0.6)")
                .attr("r", d => rScale(d.degree))
                .attr("data-bs-toggle", "tooltip")
                .attr("title", (d) => d.id);

            graph.links.attr("stroke", "rgba(255,255,255,0.2)");

            new bootstrap.Tooltip("#network2", {
                selector: '[data-bs-toggle="tooltip"]'

            });
        });

    // SINGERS VOCALS ONLY
    fetch("data/similarity_data_vocals.csv")
        .then(response => response.text())
        .then(data => {
            const rowsString = data.split("\n");
            const similarities = rowsString.slice(1).map(row => row.split(",").map(Number));

            // normalizing values because very far apart 
            const minSim = Math.min(...similarities.flat());
            const maxSim = Math.max(...similarities.flat());
            const normalizedSimilarities = similarities.map(row => row.map(value => (value - minSim) / (maxSim - minSim)));

            const labels = [];
            for (let i = 0; i < normalizedSimilarities.length; i++) {
                labels.push(`Song ${i + 1}`);
            }

            const nodes = normalizedSimilarities.map((_, i) => ({ id: `Song ${i}`, degree: 0, num: i }));
            const links = [];

            for (let i = 0; i < normalizedSimilarities.length; i++) {
                for (let j = 0; j < normalizedSimilarities[i].length; j++) {
                    if (i !== j && normalizedSimilarities[i][j] >= 0.95) {
                        links.push({
                            source: `Song ${i}`,
                            target: `Song ${j}`,
                            value: normalizedSimilarities[i][j]
                        });
                        nodes[i].degree += 1;
                        nodes[j].degree += 1;
                    }
                }
            }

            const graph = network("#network3", {
                nodes, links,
                forces: {
                    charge: () => d3.forceManyBody().strength(-500),
                    collide: () => d3.forceCollide().radius(d => 32 - d.depth * 4).iterations(3),
                    centerX: () => d3.forceX(750).strength(0.1),
                    centerY: () => d3.forceY(500).strength(0.1),
                },
                d3
            });

            const rScale = d3.scaleLinear()
                .domain(d3.extent(nodes, d => d.degree))
                .range([3, 20]);

            graph.nodes
                .attr("fill", (d) => d.num / 40 >= 1 ? "rgba(100,100,255,0.6)" : "rgba(255,100,100,0.6)")
                .attr("r", d => rScale(d.degree))
                .attr("data-bs-toggle", "tooltip")
                .attr("title", (d) => d.id);

            graph.links.attr("stroke", "rgba(255,255,255,0.2)");

            new bootstrap.Tooltip("#network3", {
                selector: '[data-bs-toggle="tooltip"]'

            });
        });

    // MUSIC DIRECTORS
    fetch("data/similarity_data_mdirectors.csv")
        .then(response => response.text())
        .then(data => {
            const rowsString = data.split("\n");
            const similarities = rowsString.slice(1).map(row => row.split(",").map(Number));

            // normalizing values because very far apart 
            const minSim = Math.min(...similarities.flat());
            const maxSim = Math.max(...similarities.flat());
            const normalizedSimilarities = similarities.map(row => row.map(value => (value - minSim) / (maxSim - minSim)));

            const labels = [];
            for (let i = 0; i < normalizedSimilarities.length; i++) {
                labels.push(`Song ${i + 1}`);
            }

            const nodes = normalizedSimilarities.map((_, i) => ({ id: `Song ${i}`, degree: 0, num: i }));
            const links = [];

            for (let i = 0; i < normalizedSimilarities.length; i++) {
                for (let j = 0; j < normalizedSimilarities[i].length; j++) {
                    if (i !== j && normalizedSimilarities[i][j] >= 0.95) {
                        links.push({
                            source: `Song ${i}`,
                            target: `Song ${j}`,
                            value: normalizedSimilarities[i][j]
                        });
                        nodes[i].degree += 1;
                        nodes[j].degree += 1;
                    }
                }
            }

            const graph = network("#network4", {
                nodes, links,
                forces: {
                    charge: () => d3.forceManyBody().strength(-500),
                    collide: () => d3.forceCollide().radius(d => 32 - d.depth * 4).iterations(3),
                    centerX: () => d3.forceX(500).strength(0.1),
                    centerY: () => d3.forceY(350).strength(0.1),
                },
                d3
            });

            const rScale = d3.scaleLinear()
                .domain(d3.extent(nodes, d => d.degree))
                .range([3, 20]);

            graph.nodes
                .attr("fill", (d) => {
                    if (d.num >= 0 && d.num < 10) {
                        return "rgba(100,100,255,0.6)";  // 0-9 Mickey J Meyer
                    } else if (d.num >= 10 && d.num < 20) {
                        return "rgba(100,255,100,0.6)";  // 10-19 MM Keeravani 
                    } else if (d.num >= 20 && d.num < 30) {
                        return "rgba(255,100,100,0.6)";  // 20-29 SS Thaman 
                    } else if (d.num >= 30 && d.num < 40) {
                        return "rgba(255,255,100,0.6)";  // 30-39 Devi Sri Prasad
                    } else
                        return "rgba(100,255,255,0.6)";  // 40-49 AR Rahman
                })
                .attr("r", d => rScale(d.degree))
                .attr("data-bs-toggle", "tooltip")
                .attr("title", (d) => d.id);

            graph.links.attr("stroke", "rgba(255,255,255,0.2)");

            new bootstrap.Tooltip("#network4", {
                selector: '[data-bs-toggle="tooltip"]'

            });
        });

    // DECADES ONLY
    fetch("data/similarity_data_decades.csv")
        .then(response => response.text())
        .then(data => {
            const rowsString = data.split("\n");
            const similarities = rowsString.slice(1).map(row => row.split(",").map(Number));

            // normalizing values because very far apart 
            const minSim = Math.min(...similarities.flat());
            const maxSim = Math.max(...similarities.flat());
            const normalizedSimilarities = similarities.map(row => row.map(value => (value - minSim) / (maxSim - minSim)));

            const labels = [];
            for (let i = 0; i < normalizedSimilarities.length; i++) {
                labels.push(`Song ${i + 1}`);
            }

            const nodes = normalizedSimilarities.map((_, i) => ({ id: `Song ${i}`, degree: 0, num: i }));
            const links = [];

            for (let i = 0; i < normalizedSimilarities.length; i++) {
                for (let j = 0; j < normalizedSimilarities[i].length; j++) {
                    if (i !== j && normalizedSimilarities[i][j] >= 0.95) {
                        links.push({
                            source: `Song ${i}`,
                            target: `Song ${j}`,
                            value: normalizedSimilarities[i][j]
                        });
                        nodes[i].degree += 1;
                        nodes[j].degree += 1;
                    }
                }
            }

            const graph = network("#network5", {
                nodes, links,
                forces: {
                    charge: () => d3.forceManyBody().strength(-500),
                    collide: () => d3.forceCollide().radius(d => 32 - d.depth * 4).iterations(3),
                    centerX: () => d3.forceX(500).strength(0.1),
                    centerY: () => d3.forceY(350).strength(0.1),
                },
                d3
            });

            const rScale = d3.scaleLinear()
                .domain(d3.extent(nodes, d => d.degree))
                .range([3, 20]);

            graph.nodes
                .attr("fill", (d) => {
                    if (d.num >= 0 && d.num < 20) {
                        return "rgba(255,100,255,0.6)";
                    } else if (d.num >= 20 && d.num < 40) {
                        return "rgba(255,255,100,0.6)";
                    }
                })
                .attr("r", d => rScale(d.degree))
                .attr("data-bs-toggle", "tooltip")
                .attr("title", (d) => d.id);

            graph.links.attr("stroke", "rgba(255,255,255,0.2)");

            new bootstrap.Tooltip("#network5", {
                selector: '[data-bs-toggle="tooltip"]'
            });
        });

});