class CorrTarget {
    constructor(container = '', addeddiv = 'cortargetdiv') {
        this.data = null
        this.containerclass = container
        this.addeddivclass = addeddiv
        this.htmlcontent();
        // this.update_vis();
    }

    htmlcontent() {
        let content = `<div class = '${this.addeddivclass} uk-animation-slide-bottom-medium'></div>`
        $('.' + this.containerclass).append(content);
    }

    make_data(dataobj, colname) {
        let numitem = 300 //dataobj.data.length
        let targetcol = p5D.targetcol,
            colgiven = p5D.datast.get_column(dataobj.data, colname, numitem), //dataobj.dataframe.getColumn(colname),
            coltarget = p5D.datast.get_column(dataobj.data, p5D.targetcol, numitem) //dataobj.dataframe.getColumn(targetcol)
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

        console.log('making data ', this.data)

    }

    /*
    sets multiple variable and target correlation charts
    */
    update_vis() {
        let dataobj = p5D.datast
        let numVars = 4
        let cols = p5D.datast.get_topcolumns(numVars * 6, 'corr_target')
        // let cols = ["avgAnnCount", "avgDeathsPerYear", "incidenceRate", "medIncome"]
        cols = p5D.datast.shuffleArr(cols).slice(0, numVars)
        let container = this.addeddivclass;
        // let wid = d3.select('.' + container).style('width').replace('px', '')
        let ht = d3.select('.' + container).style('height').replace('px', '')

        let wid = $('.' + this.containerclass).width()
        let w = Math.floor(+wid / (numVars)),
            h = +ht * 0.95
        w = +wid*0.9
        // console.log(' w and h in cor target ', w, h)
        d3.select('.' + container).html('')
        new Array(numVars).fill().map((d, i) => {
            this.make_data(dataobj, cols[i])
            this.make_plotchart(container, w, h, i)
        })

    }

    // https://bl.ocks.org/ctufts/674ece47de093f6e0cd5af22d7ee9b9b
    make_plotchart(container = '', w = 100, h = 100, id = 0) {
        var padding = 80,
            paddingX = 50,
            pushX = 20

        //create data points
        // var dataset = create_data(100);
        var dataset = this.data // later can replace with this.data
        // console.log(' data in corr and target is  ', dataset)
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
            .domain([0, d3.max(dataset, function (d) {
                return d.x;
            })])
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
            // .range([h - padding - 20, padding - 20]);
            .range([h - padding, padding]);
        /////// Define Axis //////////////////////////////
        var xAxis = d3.axisBottom()
            .scale(xScale);

        var yAxis = d3.axisLeft()
            .scale(yScale)
            .ticks(5);


        let containerDiv = 'cortargetsvgdiv uk-animation-slide-bottom-medium'
        // create svg
        var svg = d3.select("." + container)
            .append('div')
            .attr('class', containerDiv)
            .attr('id', containerDiv + '_' + id)
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
            .attr("id", "circles_singlescatplot")
            // .attr("clip-path", "url(#chart-area)")
            .selectAll(".singlescatplot_circles")
            .data(dataset)
            .enter()
            .append("circle")
            .attr("class", "dot singlescatplot_circles")
            .attr("cx", function (d) {
                // console.log(' checking d , ', d)
                return xScale(d.x) + pushX;
            })
            .attr("cy", function (d) {
                return yScale(d.y);
            })
            .attr("r", 3.5)

        d3.selectAll('.singlescatplot_circles')
            .on('mouseover', (d, i) => {
                let mousePos = [d3.event.offsetX, d3.event.offsetY]
                d3.selectAll(this).style('stroke', 'white')
                tooltip_show(d, i, mousePos)
            })
            .on('mouseout', (d, i) => {
                d3.selectAll(this).style('stroke', '')
                tooltip_hide()
            })

        let self = this

        function tooltip_show(data, index, mousePos) {
            let mx = mousePos[0] + 60,
                my = mousePos[1] + 10
            // mx = my = 0
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
            // let pos = $('#' + containerDiv + '_' + id).position()
            let pos = $('.' + self.addeddivclass).offset()
            // let pos = $('.cortargetsvgdiv').position()
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
            .call(xAxis.ticks(2))


        let gy = svg.append("g")
            .attr("class", "y axis")
            .attr("transform", "translate(" + padding + ",0)")
            .call(yAxis.ticks(3))

        // x axis text label
        gx.append('g')
            .append('text')
            .attr('class', 'x_label_allvars')
            .attr("x", w / 2)
            .attr("y", -h * 0.7)
            .attr("dy", ".71em")
            .style('fill', 'white')
            .style('font-size', '1.2em')
            .text(colX);

        // y axis text label
        gy.append('g')
            .append('text')
            .attr('class', 'x_label_allvars')
            .attr("x", -h / 2)
            .attr("y", -35)
            .attr("dy", ".71em")
            .style('fill', 'white')
            .attr("transform", "rotate(-90)")
            .style('font-size', '1.2em')
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