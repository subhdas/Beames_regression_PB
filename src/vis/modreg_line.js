class ModRegLine {
    constructor(dataobj) {
        this.dataobj = dataobj
        this.containerclass = 'detailbar'
        let cols = dataobj.columns
        let index = Math.floor(Math.random() * cols.length)
        let colname = cols[index]
        if (p5D.colremove.indexOf(colname) != -1 || colname == p5D.targetcol) {
            colname = cols[index + 1]
        }
        // colname = 'year'
        // console.log(' COL NAME FINDING ', new Set(p5D.datast.get_column(p5D.datast.data, colname)))
        this.make_data(dataobj, colname)
        this.make_plotchart()
    }


    make_data(dataobj, colname = 'quality_of_faculty') {
        let targetcol = p5D.targetcol,
            numitem = dataobj.data.length,
            colgiven = p5D.datast.get_column(p5D.datast.data, colname),
            coltarget = p5D.datast.get_column(p5D.datast.data, targetcol);
        numitem = p5D.datast.data.length // 300
        let dataArr = new Array(numitem).fill().map((d, i) => {
            var obj = {
                'id': i,
            }
            obj['x'] = +colgiven[i]
            obj['y'] = +coltarget[i]
            obj['yhat'] = obj['y'] + Math.ceil(Math.random(0, 1) * 3 * (i + 1))
            return obj
        })
        dataArr.columns = Object.keys(dataArr[0])
        dataArr.columnX = colname
        dataArr.columnY = targetcol
        this.data = dataArr
    }

    // not using
    make_data_dummy() {
        let numitem = 200
        let dataArr = new Array(numitem).fill().map((d, i) => {
            var obj = {
                'id': i,
            }
            obj['x'] = 0 + Math.ceil(Math.random(0, 1) * 20 * (i + 1))
            obj['y'] = 0 + Math.ceil(Math.random(0, 1) * 50 * (i + 1))
            obj['yhat'] = obj['y'] + Math.ceil(Math.random(0, 1) * 3 * (i + 1))
            // obj['yhat'] = obj['y']
            // obj['x'] = obj['y'] + Math.random()*100
            return obj
        })
        dataArr.columns = Object.keys(dataArr[0])
        this.data = dataArr
    }

    //
    // https://bl.ocks.org/ctufts/674ece47de093f6e0cd5af22d7ee9b9b
    make_plotchart(w = 500, h = 350) {
        var padding = 35,
            paddingX = 20,
            container = this.containerclass

        //create data points
        // var dataset = create_data(100);
        var dataset = this.data // later can replace with this.data
        console.log(' data in model detail is  ', dataset)
        let colX = dataset.columnX
        let colY = dataset.columnY

        // function for creation of line
        var newline = d3.line()
            .x(function (d) {
                return xScale(d.x);
            })
            .y(function (d) {
                return yScale(d.yhat);
            });

        ////// Define Scales /////////////////
        var xScale = d3.scaleLinear()
            .domain([d3.min(dataset, (d) => d.x), d3.max(dataset, (d) => d.x)])
            .range([paddingX + 20, w - paddingX * 2]);
        var yScale = d3.scaleLinear()
            .domain([
                d3.min(dataset, function (d) {
                    return (d.y);
                }),
                d3.max(dataset, function (d) {
                    return d.y;
                })
            ]) //y range is reversed because svg
            .range([h - padding, padding]);
        /////// Define Axis //////////////////////////////
        var xAxis = d3.axisBottom()
            .scale(xScale);

        var yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(5);


        let containerDiv = 'plotchartdiv'
        // create svg
        var svg = d3.select("." + container)
            .append('div')
            .attr('class', containerDiv)
            .append("svg")
            .attr("width", w)
            .attr("height", h);

        // cut off datapoints that are outside the axis
        // svg.append("clipPath")
        //     .attr("id", "chart-area")
        //     .append("rect")
        //     .attr("x", padding)
        //     .attr("y", padding)
        //     .attr("width", w - padding * 3)
        //     .attr("height", h - padding * 2)
        // .style('padding', '20px')

        var tooltipclass = 'tooltipcontainer'
        var tooltipclassId = 'tooltipcontainerId'

        // append data points
        svg.append("g")
            .attr("id", "circles")
            // .attr("clip-path", "url(#chart-area)")
            .selectAll("circle")
            .data(dataset)
            .enter()
            .append("circle")
            .attr("class", "dot scatsingle_detail_circles")
            .attr("cx", function (d) {
                return xScale(d.x);
            })
            .attr("cy", function (d) {
                return yScale(d.y);
            })
            .attr("r", 3.5)
            .on('mouseover', (d, i) => {
                // console.log('mouseover model detail ', d,i);
                let mousePos = [d3.event.offsetX, d3.event.offsetY]
                tooltip_show(d, i, mousePos)
            })
            .on('mouseout', (d, i) => {
                tooltip_hide()
            })


        function tooltip_show(data, index, mousePos) {
            let mx = mousePos[0] + 20,
                my = mousePos[1] + 10
            $('#' + tooltipclassId).remove();
            let str = `<div class = ${tooltipclass} id = ${tooltipclassId}></div>`
            $('body').append(str);

            let headerclass = 'ttip_blackheader'
            let content = `<div class = ${headerclass} id = ${headerclass}_id> </div>
                    <div class = 'ttipcontent' > <span class = 'ttipkey' > Data ID: </span> <span class = 'ttipvalue'> ${index}</span > </div>`
            Object.keys(data).forEach(d => {
                let dplace = d;
                if (d == 'x') dplace = colX
                if (d == 'y') dplace = colY
                content += `
                    <div class = 'ttipcontent'><span class = 'ttipkey'>${dplace}: </span<span class = 'ttipvalue' >${data[d]}</span></div>
                    `
            })

            $("#" + tooltipclassId).append(content);
            let pos = $('.' + containerDiv).position()
            let tp = pos.top + my,
                lft = pos.left + mx
            $('.' + tooltipclass).css('top', tp);
            $('.' + tooltipclass).css('left', lft);
        }

        function tooltip_hide() {
            $('#' + tooltipclassId).remove();
        }



        // append regression line -  COMMENTED NOW
        // svg.append("path")
        //     .datum(dataset)
        //     // .attr("clip-path", "url(#chart-area)")
        //     .attr("class", "line")
        //     .attr("d", newline);

        // append Axes ///////////////////////////
        let gx = svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + (h - padding) + ")")
            .call(xAxis.ticks(5))


        let gy = svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + padding + ",0)")
            .call(yAxis.ticks(5))

        // x axis text label
        gx.append('g')
            .append('text')
            .attr('class', 'x_label_allvars')
            .attr("x", w / 2)
            .attr("y", 20)
            .attr("dy", ".71em")
            .style('fill', 'black')
            .style('font-size', '1.1em')
            .text(colX);

        // y axis text label
        gy.append('g')
            .append('text')
            .attr('class', 'x_label_allvars')
            .attr("x", -h / 2)
            .attr("y", -35)
            .attr("dy", ".71em")
            .style('fill', 'black')
            .attr("transform", "rotate(-90)")
            .style('font-size', '1.1em')
            .text(colY);





        function create_data(nsamples) {
            var x = [];
            var y = [];
            var n = nsamples;
            var x_mean = 0;
            var y_mean = 0;
            var term1 = 0;
            var term2 = 0;
            var noise_factor = 2 + Math.random() * 100;
            var noise = 0;
            var slope = (Math.random() * 10) *
                (Math.round(Math.random()) == 1 ? 1 : -1);
            // create x and y values
            for (var i = 0; i < n; i++) {
                noise = noise_factor * Math.random();
                noise *= Math.round(Math.random()) == 1 ? 1 : -1;
                y.push(i / slope + noise);
                x.push(i + 1);
                x_mean += x[i]
                y_mean += y[i]
            }
            // calculate mean x and y
            x_mean /= n;
            y_mean /= n;

            // calculate coefficients
            var xr = 0;
            var yr = 0;
            for (i = 0; i < x.length; i++) {
                xr = x[i] - x_mean;
                yr = y[i] - y_mean;
                term1 += xr * yr;
                term2 += xr * xr;

            }
            var b1 = term1 / term2;
            var b0 = y_mean - (b1 * x_mean);
            // perform regression

            let yhat = [];
            // fit line using coeffs
            for (i = 0; i < x.length; i++) {
                yhat.push(b0 + (x[i] * b1));
            }

            var data = [];
            for (i = 0; i < y.length; i++) {
                data.push({
                    "yhat": yhat[i],
                    "y": y[i],
                    "x": x[i]
                })
            }
            return (data);
        }
    }
}