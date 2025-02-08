class CorrVars {
    constructor(container = '', addeddiv = 'cormatrixdiv') {
        this.containerclass = container
        this.addeddivclass = addeddiv
        this.data = null
        this.numvars = 4
        this.numdatapt = 100
        this.htmlcontent()
        // this.makedata_scatterplot()
        // this.make_scatterplotvars()
        // this.update_vis();

        p5D.featwtVis = new FeatureWeightVis('cormatrixdiv', 'featwtvisdiv')
    }

    htmlcontent() {
        let content = `<div class = '${this.addeddivclass} uk-animation-slide-bottom-medium'></div>`;
        $('.' + this.containerclass).append(content);
    }


    update_vis() {
        let cols = p5D.datast.get_topcolumns(this.numvars * 2, 'variance', false)
        cols = p5D.datast.shuffleArr(cols);

        this.set_data(p5D.datast.data.slice(0), cols.slice(0, this.numvars))
        p5D.featwtVis.update_vis()

        // setTimeout(() => {
        // }, 300);
    }

    set_data(dataIn, cols) {
        dataIn = dataIn.slice(0, this.numdatapt)
        let dataOut = []
        if (dataIn) {
            dataIn.forEach(row => {
                let obj = {}
                cols.forEach(c => obj[c] = row[c])
                dataOut.push(obj);
            });
            this.data = dataOut;
            this.make_scatterplotvars()
        }
    }

    // not using
    makedata_scatterplot() {
        let numitem = 100,
            numModel = 4
        let dataArr = new Array(numitem).fill().map((d, i) => {
            var obj = {
                'id': i
            }
            new Array(numModel).fill()
                .map((d, j) => obj['model_' + j] = 0 + Math.ceil(Math.random(0, 1) * 20 * (j + 1)))
            return obj
        })
        dataArr.columns = Object.keys(dataArr[0])
        this.data = dataArr
        console.log('data arr ', dataArr)

    }

    //https://bl.ocks.org/Fil/6d9de24b31cb870fed2e6178a120b17d
    make_scatterplotvars() {
        let container = this.addeddivclass
        // there is a bug here in the slice, causes broad_impact to be null
        var data = this.data
        var domainByTrait = {},
            traits = d3.keys(data[0]).filter(function (d) {
                return d !== "id";
            }),
            n = traits.length;


        let ht = $('.' + container).height() * 0.75
        let wid = $('.' + container).width() * 0.90
        var size = Math.floor(ht / n), //130,
            sizewid = Math.floor(wid / n)
        let padding = 20

        var x = d3.scaleLinear()
            .range([padding / 2, size - padding / 2]);

        var y = d3.scaleLinear()
            .range([size - padding / 2, padding / 2]);

        var xAxis = d3.axisBottom()
            .scale(x)
            .ticks(3);

        var yAxis = d3.axisLeft()
            .scale(y)
            .ticks(3);

        var color = d3.scaleOrdinal(d3.schemeCategory10);



        traits.forEach(function (trait) {
            domainByTrait[trait] = d3.extent(data, function (d) {
                return d[trait];
            });
        });

        xAxis.tickSize(size * n);
        yAxis.tickSize(-size * n);

        var brush = d3.brush()
            .on("start", brushstart)
            .on("brush", brushmove)
            .on("end", brushend)
            .extent([
                [0, 0],
                [size, size]
            ]);

        // empty the div container
        // d3.select('.' + container).html('')
        d3.select('.' + 'svg_scatterplot').remove()

        var svg = d3.select("." + container)
            // .append("svg")
            .insert("svg", ":first-child")
            // .attr("width", size * n + padding)
            .attr('width', '100%')
            .attr("height", size * n + padding)
            .attr('class', 'svg_scatterplot uk-animation-slide-bottom-medium')
            .append("g")
            .attr("transform", "translate(" + padding + "," + padding / 2 + ")");

        let xaxis_obj = svg.selectAll(".x.axis")
            .data(traits)
            .enter().append("g")
            .attr("class", "x axis x_ax_scatter")
            .attr("transform", function (d, i) {
                return "translate(" + (n - i - 1) * size + ",0)";
            })

        // xaxis_obj
        //  .selectAll('text')
        //  .style('font-size', '2em')
        //  .attr("dy", "1em")
        //  .style("text-anchor", "middle")
        //  .style('transform', 'rotate(-45deg)')

        xaxis_obj
            .each(function (d) {
                x.domain(domainByTrait[d]);
                d3.select(this).call(xAxis);
            })
            .style('stroke-width', 0.1)
            .selectAll('text')
            .attr('class', 'scatmat_xaxistext')
            .style('font-size', '1em')
            // .attr("dy", "1em")
            .style("text-anchor", "middle")
            .attr('transform', function (d) {
                let y = $(this).attr('y')
                return 'rotate(-45,' + 0 + ',' + y + ')';
            })

        svg.selectAll(".y.axis")
            .data(traits)
            .enter().append("g")
            .attr("class", "y axis y_ax_scatter")
            .attr("transform", function (d, i) {
                return "translate(0," + i * size + ")";
            })
            .each(function (d) {
                y.domain(domainByTrait[d]);
                d3.select(this).call(yAxis);
            })
            .style('stroke-width', 0.1)


        var cell = svg.selectAll(".cell")
            .data(cross(traits, traits))
            .enter().append("g")
            .attr("class", "cell")
            .attr("transform", function (d) {
                return "translate(" + (n - d.i - 1) * size + "," + d.j * size + ")";
            })
            .each(plot);

        // Titles for the diagonal.
        cell.filter(function (d) {
                return d.i === d.j;
            }).append("text")
            .attr("x", padding)
            .attr("y", padding)
            .attr("dy", ".71em")
            .text(function (d) {
                return d.x;
            });

        // brush commented for tooltip
        // cell.call(brush);

        var tooltipclass = 'tooltipcontainer'
        var tooltipclassId = 'tooltipcontainerId'

        function plot(p) {
            var cell = d3.select(this);

            x.domain(domainByTrait[p.x]);
            y.domain(domainByTrait[p.y]);

            cell.append("rect")
                .attr("class", "frame")
                .attr("x", padding / 2)
                .attr("y", padding / 2)
                .attr("width", size - padding)
                .attr("height", size - padding);

            cell.selectAll(".scatplot_circles")
                .data(data)
                .enter().append("circle")
                .attr("cx", function (d) {
                    return x(d[p.x]);
                })
                .attr("cy", function (d) {
                    return y(d[p.y]);
                })
                .attr("r", 4)
                .attr('class', 'scatplot_circles')
                .style("fill", function (d) {
                    return color(d.id);
                })
                .on('mouseover', (d, i) => {
                    let mousePos = [d3.event.offsetX, d3.event.offsetY]
                    d3.select(this).style('stroke', 'white')
                    tooltip_show(d, i, mousePos);
                })
                .on('mouseout', (d, i) => {
                    d3.select(this).style('stroke', '')
                    tooltip_hide();
                })
        }

        function tooltip_show(data, index, mousePos) {
            let mx = mousePos[0] + 50,
                my = mousePos[1] + 10
            $('#' + tooltipclassId).remove();
            let str = `<div class = ${tooltipclass} id = ${tooltipclassId}></div>`
            $('body').append(str);

            let headerclass = 'ttip_blackheader'
            let content = `<div class = ${headerclass} id = ${headerclass}_id> </div>
                    <div class = 'ttipcontent' > <span class = 'ttipkey' > Data ID: </span> <span class = 'ttipvalue'> ${index}</span > </div>`
            Object.keys(data).forEach(d => {
                content += `
                    <div class = 'ttipcontent'><span class = 'ttipkey'>${d}: </span<span class = 'ttipvalue' >${data[d]}</span></div>
                    `
            })

            $("#" + tooltipclassId).append(content);
            let pos = $('.' + container).position()
            let tp = pos.top + my,
                lft = pos.left + mx
            $('.' + tooltipclass).css('top', tp);
            $('.' + tooltipclass).css('left', lft);
        }

        function tooltip_hide() {
            $('#' + tooltipclassId).remove();
        }

        var brushCell;

        // Clear the previously-active brush, if any.
        function brushstart(p) {
            if (brushCell !== this) {
                d3.select(brushCell).call(brush.move, null);
                brushCell = this;
                x.domain(domainByTrait[p.x]);
                y.domain(domainByTrait[p.y]);
            }
        }

        // Highlight the selected circles.
        function brushmove(p) {
            var e = d3.brushSelection(this);
            svg.selectAll("circle").classed("hidden", function (d) {
                return !e ?
                    false :
                    (
                        e[0][0] > x(+d[p.x]) || x(+d[p.x]) > e[1][0] ||
                        e[0][1] > y(+d[p.y]) || y(+d[p.y]) > e[1][1]
                    );
            });
        }

        // If the brush is empty, select all circles.
        function brushend() {
            var e = d3.brushSelection(this);
            if (e === null) svg.selectAll(".hidden").classed("hidden", false);
        }
        // });

        function cross(a, b) {
            var c = [],
                n = a.length,
                m = b.length,
                i, j;
            for (i = -1; ++i < n;)
                for (j = -1; ++j < m;) c.push({
                    x: a[i],
                    i: i,
                    y: b[j],
                    j: j
                });
            return c;
        }
    }
}

/**
 * class that adds horizontal feature weight vis
 */
class FeatureWeightVis {
    constructor(container = '', addeddiv = '') {
        this.containerclass = container
        this.addeddivclass = addeddiv
        this.htmlcontent();
        this.update_vis();
        console.log('ADDED FEATURE VIS WT ADDS')

        this.highlightedmodel_id = -1
        this.highlighted_modtype = ''
    }

    htmlcontent() {
        let content = `<div class = '${this.addeddivclass} uk-animation-slide-bottom-medium'></div>`;
        $('.' + this.containerclass).append(content);
    }

    update_vis() {
        // this.make_data();
        setTimeout(() => {
            this.highlightedmodel_id = p5D.modman.highlightedmodel_id
            this.highlighted_modtype = p5D.modman.highlighted_modtype
            this.get_datafromstore();
            this.make_horiz_barview();
        }, 30);

    }

    // not using
    make_data() {
        let numbars = 30
        let data = new Array(numbars).fill(null).map((m, i) => {
            let obj = {
                feat_name: 'feat_' + i,
                feat_weight: Math.random()
            }
            return obj
        })

        this.data = data
    }

    get_datafromstore() {
        let id = +Math.floor(Math.random() * 5)
        let modelid = 'model_' + id,
            modtype = 'tf',
            numbars = 15

        if (this.highlightedmodel_id != -1) {
            modelid = this.highlightedmodel_id
            modtype = this.highlighted_modtype
        }

        let modobj = p5D.modman.modschemalist[modtype][modelid]['modobj']
        let featwts = modobj['feature_wts']
        let numfeats = modobj['hyperparams']['num_features']
        if (numbars > numfeats) numbars = numfeats
        let newdata = []
        Object.keys(featwts).forEach((f, i) => {
            if (f == p5D.datast.targetcol) return
            let obj = {
                feat_name: f,
                feat_weight: featwts[f]
            }

            // if (i > numfeats) {
            //     obj = {
            //         feat_name: '',
            //         feat_weight: 0.1
            //     }
            // }

            newdata.push(obj)
        })
        newdata.sort(function (a, b) {
            return +a.feat_weight - +b.feat_weight
        })
        console.log(' feat vis found ', newdata.slice(0, numbars), numfeats, numbars)

        this.data = newdata.slice(0, numbars)
    }


    make_horiz_barview() {
        // set the dimensions and margins of the graph
        $("." + this.addeddivclass).empty()
        var tooltipclass = 'tooltipcontainer'
        var tooltipclassId = 'tooltipcontainerId'
        let self = this
        let data = this.data
        var margin = {
                top: 20,
                right: 5,
                bottom: 10,
                left: 80
            },
            pushWid = 10,
            w = $('.' + this.addeddivclass).width() * 0.99,
            h = $('.' + this.addeddivclass).height() * 0.85,
            width = w - margin.left - margin.right,
            height = h - margin.top - margin.bottom;


        if (width < 0 || height < 0) {
            console.log('returning from feat wt vis ', width, w, this.data)
            return
        }
        // set the ranges
        var y = d3.scaleBand()
            .range([height, 0])
            .padding(0.1)


        var x = d3.scaleLinear()
            .range([0, width])


        var svg = d3.select("." + this.addeddivclass).append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform",
                "translate(" + margin.left + "," + margin.top + ")");

        // format the data
        data.forEach(function (d) {
            d.feat_weight = +d.feat_weight;
        });

        // Scale the range of the data in the domains
        x.domain([0, d3.max(data, function (d) {
            return d.feat_weight;
        })])
        y.domain(data.map(function (d) {
            return d.feat_name;
        }));
        //y.domain([0, d3.max(data, function(d) { return d.feat_weight; })]);

        // append the rectangles for the bar chart
        svg.selectAll(".rect_featwt")
            .data(data)
            .enter().append("rect")
            .attr("class", "rect_featwt")
            //.attr("x", function(d) { return x(d.feat_weight); })
            .attr("width", function (d) {
                return Math.abs(x(d.feat_weight));
            })
            .attr("y", function (d) {
                return y(d.feat_name);
            })
            .attr("x", function (d) {
                return pushWid
            })
            .attr("height", y.bandwidth())
            .on('mouseover', function (d, i) {
                d3.select(this).style('stroke', 'white')
                // console.log('mouseover bar featwt ', d, i)
                let mousePos = [d3.event.offsetX, d3.event.offsetY]
                tooltip_show(d, i, mousePos);
            }).on('mouseout', function () {
                d3.select(this).style('stroke', '')
                tooltip_hide();
            })

        // add the x Axis
        svg.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x).ticks(5))



        // add the y Axis
        svg.append("g")
            .call(d3.axisLeft(y))
            .selectAll('text')
            .attr('class', 'featwt_yaxis_text')
            .style('transform', 'rotate(45deg)')
            .attr('x', 10)
            .attr('y', 10)
            .text(function (d, i) {
                // console.log('feat vis text ', d, i, this, $(this).text())
                return d.substring(0,11)
            })


        function tooltip_show(data, index, mousePos) {
            let pushY = 75,
                pushX = -120
            if (index < 10) pushY = -75
            let mx = mousePos[0] + pushX,
                my = mousePos[1] + pushY
            $('#' + tooltipclassId).remove();
            let str = `<div class = ${tooltipclass} id = ${tooltipclassId}></div>`
            $('body').append(str);

            let headerclass = 'ttip_blackheader'
            let content = `<div class = ${headerclass} id = ${headerclass}_id> </div>
                    <div class = 'ttipcontent' > <span class = 'ttipkey' > Data ID: </span> <span class = 'ttipvalue'> ${index}</span > </div>`
            Object.keys(data).forEach(d => {
                content += `
                    <div class = 'ttipcontent'><span class = 'ttipkey'>${d}: </span<span class = 'ttipvalue' >${data[d]}</span></div>
                    `
            })

            $("#" + tooltipclassId).append(content);
            let pos = $('.' + self.containerclass).position()
            let wid = $('.' + self.containerclass).width() * 0.5
            let tp = pos.top + my,
                lft = pos.left + mx + wid
            $('.' + tooltipclass).css('top', tp);
            $('.' + tooltipclass).css('left', lft);
        }

        function tooltip_hide() {
            $('#' + tooltipclassId).remove();
        }


    }
}