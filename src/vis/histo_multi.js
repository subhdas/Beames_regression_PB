class HistoMulti {
    constructor(container = '', addeddiv = '') {
        this.containerclass = container;
        this.addeddivclass = addeddiv;
        this.pervis_height = null
        this.htmlcontent()
        this.data = this.make_data();
        // this.make_unitvis()
    }

    htmlcontent() {
        let content = `<div class = '${this.addeddivclass}' ></div>`
        $('.' + this.containerclass).append(content);
    }

    get_data_topmodels(parname = '') {
        let datafromstore = p5D.modman.get_histomodeldata(parname)
        return datafromstore
    }

    make_data() {
        let numrows = 50; // Math.floor(Math.random() * 200) + 50;
        let dataArray = []
        let xMax = Math.random() * 15 + 2
        for (let i = 0; i < numrows; i++) {
            let obj = {}
            let binval = Math.floor(Math.random() * xMax + 2) * 0.1
            // let binval = Math.floor(Math.random() * xMax + 2);
            obj['model_id'] = i
            obj['bin_model_in'] = binval
            // obj['mod_acc_bin'] = (Math.random() * 10 + 2);
            obj['mod_acc_bin'] = (Math.random().toFixed(3))
            dataArray.push(obj)
        }
        return dataArray;
    }

    update_vis() {
        this.clear_div();
        // let parname = ['learning_rate', 'max_depth', 'dropout_rate', 'num_features']
        let modtype = 'tf',
            modelid = Object.keys(p5D.modman.modschemalist[modtype])[0]
        let modobj_tf = p5D.modman.modschemalist[modtype][modelid]['modobj']

        modtype = 'reg'
        modelid = Object.keys(p5D.modman.modschemalist[modtype])[0]
        let modobj_reg = p5D.modman.modschemalist[modtype][modelid]['modobj']

        let parname = Object.keys(modobj_tf['hyperparams'])
        let parname_reg = Object.keys(modobj_reg['hyperparams'])
        // parname = parname.concat(parname_reg)
        // parname.push('num_features')

        parname = p5D.datast.get_uniquevals(parname)


        new Array(parname.length).fill(undefined).map((val, idx) => {
            if (parname[idx] == 'algorithm') return
            // this.data = this.make_data();
            this.data = this.get_data_topmodels(parname[idx])
            // console.log(' histo data fr ', this.data, parname, parname[idx], idx)
            this.make_unitvis(parname[idx]);
        });
        $('.' + this.addeddivclass).show();
        $('.' + this.addeddivclass).attr('height', this.pervis_height * 1.4)
    }


    clear_div() {
        $('.' + this.addeddivclass).empty()
        $('.' + this.addeddivclass).hide()
        // $('.' + this.addeddivclass).show()
    }

    // https://bl.ocks.org/misanuk/fc39ecc400eed9a3300d807783ef7607
    make_unitvis(x_axis_txt) {
        let self = this
        let margin2 = {
                top: 10,
                right: 60,
                bottom: 25,
                left: 20
            },
            pushX = 30,
            pushY = -5
        let w = $('.' + this.containerclass).width()
        let h2 = $('.' + this.addeddivclass).height() * 0.1
        this.pervis_height = h2
        let width = w - margin2.left - margin2.right,
            height2 = h2 - margin2.top - margin2.bottom;

        let x2 = d3.scaleLinear().range([0 + pushX, width]),
            y2 = d3.scaleLinear().range([height2, 0]);

        let xAxis2 = d3.axisBottom(x2).tickSize(0),
            yAxis = d3.axisLeft(y2).tickSize(0).ticks(6);
        var colors = ["#5A63EC", "#F1948A"]


        var z = d3.scaleOrdinal()
            .range(colors);

        let brush = d3.brushX()
            .extent([
                [0, height2 * 0.95],
                [width, 15 + height2]
            ])
            .on("brush", brushed)
            .on("end", brushended);


        let svg = d3.select("." + this.addeddivclass).append("svg")
            .attr("width", width + margin2.left + margin2.right)
            .attr("height", height2 + margin2.top + margin2.bottom)
            .attr('class', 'svg_histodistr uk-animation-slide-bottom-medium')
            .style('border-top', '1px dashed gray')
            .style('padding', '5px')


        let context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

        let data = this.data

        try {
            data = data.filter((d) => {
                // console.log(' whats in data ', d)
                return !isNaN(d.bin_model_in)
            })
        } catch (e) {
            console.log('ERRORED ON PAR FILTER ', data)
        }


        // console.log('par after filter data ', data)

        var xMin = d3.min(data, function (d) {
            return d.bin_model_in;
        });
        var yMin = d3.min(data, function (d) {
            return d.mod_acc_bin;
        });
        var yMax = d3.max(data, function (d) {
            return d.mod_acc_bin;
        });

        var xMax = d3.max(data, function (d) {
            return +d.bin_model_in;
        });
        y2.domain([yMin, yMax]);
        x2.domain([xMin, xMax]);

        var num_models_calc = function (dataArray, domainRange) {
            return d3.sum(dataArray, function (d) {
                return d.bin_model_in >= domainRange.domain()[0] && d.bin_model_in <= domainRange.domain()[1];
            })
        }

        context.append("g")
            .attr("class", "axis axis--y")
            .call(yAxis);

        // Summary Stats
        context.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin2.left + pushX)
            .attr("x", 0 - (height2 / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style('font-size', '1.1.em')
            // .text("Pred-Acc");
            .text("r2 Score");

        context.append("text")
            .attr("x", width - margin2.right)
            .attr("y", -12)
            .attr("dy", "1em")
            .attr("text-anchor", "end")
            // .text("Models: " + num_models_calc(data, x2));
            .text(x_axis_txt)
            .style('font-size', '1.1em')

        // svg.append("text")
        //     .attr("transform",
        //         "translate(" + ((width + margin2.right + margin2.left) / 2) + " ," +
        //         (height2 + margin2.top + margin2.bottom) + ")")
        //     .style("text-anchor", "middle")
        //     .text("Bin");
        var tooltipclass = 'tooltipcontainer'
        var tooltipclassId = 'tooltipcontainerId'

        // append scatter plot to brush chart area
        var messages = context.append("g");
        messages.attr("clip-path", "url(#clip)");
        messages.selectAll("message")
            .data(data)
            .enter().append("circle")
            .attr('class', function (d, i) {
                let classunique = 'cir_unitvis_' + x_axis_txt
                let classname = 'modelContext circle_unitvis ' + classunique
                return classname
            })
            .attr("r", 4)
            .attr('fill', function (d, i) {
                let id = 0
                if (d.modtype == 'reg') id = 1
                return p5D.modman.modelcolors[d.modtype]
                return z(id);
            })
            .style("opacity", .6)
            .attr("cx", function (d) {
                let val = x2(d.bin_model_in);
                d.cx = val;
                return val
            })
            .attr("cy", function (d) {
                return y2(d.mod_acc_bin) + pushY;
            })
            .on('mouseover', function (d, i) {
                // console.log('mouseover par ', d, i)
                d3.select(this).style('stroke', 'white')
                let mousePos = [d3.event.offsetX, d3.event.offsetY]

                let datago = {
                    model_id: d.model_id,
                    param_val: d.bin_model_in_orig,
                    r2score: d.mod_acc_bin,
                    modtype: d.modtype
                }
                tooltip_show(datago, i, mousePos);
            })
            .on('mouseout', function (d, i) {
                d3.select(this).style('stroke', '')
                tooltip_hide();
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
                content += `
                    <div class = 'ttipcontent'><span class = 'ttipkey'>${d}: </span<span class = 'ttipvalue' >${data[d]}</span></div>
                    `
            })

            $("#" + tooltipclassId).append(content);
            let pos = $('.' + self.addeddivclass).position()
            let tp = pos.top + my,
                lft = pos.left + mx

            let eln = document.querySelector('.featurevisdiv'); 
            tp += eln.scrollTop + 50
            $('.' + tooltipclass).css('top', tp);
            $('.' + tooltipclass).css('left', lft);
        }

        function tooltip_hide() {
            $('#' + tooltipclassId).remove();
        }

        context.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + height2 + ")")
            .call(xAxis2);

        context.append("g")
            .attr("class", "brush")
            .call(brush)
        // .call(brush.move, x.range());


        //create brush function redraw scatterplot with selection
        function brushed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
            let xArr = d3.event.selection; // an array of x axis coord = [0,520]
            // console.log('brushed event ', d3.event)

            let classunique = 'cir_unitvis_' + x_axis_txt

            d3.selectAll('.' + classunique)
                .style('fill', function (d, i) {
                    let id = 0
                    if (d.modtype == 'reg') id = 1
                    return p5D.modman.modelcolors[d.modtype]
                    return z(id);
                })
            let modelidslist = []
            d3.selectAll('.' + classunique)
                .filter((d, i) => {
                    let check = d.cx >= xArr[0] && d.cx <= xArr[1]
                    if (check) {
                        modelidslist.push(d.model_id)
                    }
                    return check
                })
                .style('fill', 'white')

            console.log(' brushed modelid list ', modelidslist)
            self.pick_highlightmodels(modelidslist);
        }

        function brushended() {
            setTimeout(() => {
                self.reset_modelhighlights()
            }, 6000);
        }

    }

    get_indices(num = 10) {
        let arr = new Array(num).fill(null).map((f, i) => {
            return +Math.floor(Math.random() * num + 1)
        })
        return arr
    }

    reset_modelhighlights() {
        let modeltypes = ['tf', 'reg']
        modeltypes.forEach((m, i) => {
            let cont = p5D.bodcontainerlist[m].get_modelrects()[0]
            cont.forEach((rect, j) => {
                let color = rect.styleobj['col'],
                    alpha = rect.styleobj['alpha']
                rect.setFillStyle(color, alpha)
            })
        })
    }


    pick_highlightmodels(modelidslist = [], found_override = true) {
        // if (indices == []) 
        let indices = this.get_indices() //[3,7,9,15,21]
        let modeltypes = ['tf', 'reg']
        let found = false;
        modeltypes.forEach((m, i) => {
            let cont = p5D.bodcontainerlist[m].get_modelrects()[0]
            // console.log('cont is ', cont)
            cont.forEach((rect, j) => {
                if (found_override) found = false
                // console.log('rect is ', rect, indices, j)
                // if (indices.indexOf(j) != -1) {
                if (modelidslist.indexOf(rect.dataobj.modelid) != -1 && !found) {
                    // let highlightcol = '0x1F7DC6F'
                    let highlightcol = rect.styleobj.clickedcol
                    rect.setFillStyle(highlightcol, 1) // highlightcolor
                    found = true
                } else {
                    let color = rect.styleobj['col'],
                        alpha = rect.styleobj['alpha']

                    // alpha = 0.05;
                    color = '0x000'
                    rect.setFillStyle(color, alpha)
                }
            })
        })
    }
}