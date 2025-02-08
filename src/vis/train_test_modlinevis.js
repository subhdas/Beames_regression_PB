class TrainTestLineVis {
    constructor(container = 'detailbar', addeddiv = 'wraplinevis') {
        this.containerclass = container;
        this.addeddivclass = addeddiv;
        this.pervis_height = null
        this.pushX = 10
        this.marginobj = {
            top: 10,
            right: 30,
            bottom: 10,
            left: 30
        }
        this.highlightedmodel_id = ''
        this.htmlcontent();
        this.update_vis();
    }

    htmlcontent() {
        let content = `
        <div class =${this.addeddivclass}_header></div>
        <div class = '${this.addeddivclass}' id = '${this.addeddivclass}_id'  ></div>
        `
        $('.' + this.containerclass).append(content);
    }


    make_data() {
        // let numrows = p5D.datast.data.length;
        let numrows = 200
        let dataArray = []
        for (let i = 0; i < numrows; i++) {
            let obj = {}
            let errval = (Math.random().toFixed(3))
            let errval2 = (Math.random().toFixed(3))
            if (errval2 < errval) errval = 0.5
            obj['data_in_id'] = i
            obj['data_inst_item'] = i
            obj['pred_err_val'] = errval
            dataArray.push(obj)
        }
        return dataArray;
    }

    // now using this one to query ddata
    getdata_fromstore(nummodels = 10) {
        let dataArr = p5D.modman.get_instancevisdata(nummodels),
            maxrows = 300,
            modelid = this.highlightedmodel_id,
            modtype = this.highlightedmodel_type
        let specmodelidarr = null
        if (modelid !== '') {
            specmodelidarr = p5D.modman.get_specific_modeldata(modelid, modtype)
            let found = false;
            dataArr.forEach(d => {
                if (d.modelid == specmodelidarr.modelid) {
                    found = true
                    return
                }
            })
            if (!found) dataArr.unshift(specmodelidarr)
        }

        let newdataArr = []
        dataArr.forEach((d, i) => {
            let prederr = d['pred_err_N'].slice(0, maxrows)
            let prederr_orig = d['pred_err'].slice(0, maxrows)
            let newdata = prederr.map((p, j) => {
                let obj = {
                    'data_in_id': j,
                    'data_inst_item': j,
                    'pred_err_val': p.toFixed(3),
                    'pred_err': +prederr_orig[j].toFixed(3),
                    'modelid': d['modelid'],
                    'modtype': d['modtype']
                }
                return obj
            })
            newdataArr.push(newdata)
        })
        return newdataArr
    }

    clear_div() {
        $('.' + this.addeddivclass).empty()
        $('.' + this.addeddivclass).hide()
    }

    update_vis() {
        this.clear_div()
        let numvis = parseInt(p5D.modman.topkmodel_num)
        if (numvis > 8) numvis = 6

        let dataArr = this.getdata_fromstore(numvis)
        this.data = dataArr[0]
        this.make_scalevis();
        new Array(dataArr.length).fill(undefined).map((val, idx) => {
            // this.data = this.make_data();
            this.data = dataArr[idx]
            this.make_linevis(idx);
        });
        $('.' + this.addeddivclass).show()

        $('.' + this.addeddivclass).attr('height', this.pervis_height * 1.4)
    }

    // makes the x axis scale on the top before other vis
    make_scalevis() {
        let margin2 = Object.assign({}, this.marginobj)
        margin2.top = 5
        let w = $('.' + this.containerclass).width()
        let h2 = 20
        let width = w - margin2.left - margin2.right,
            height2 = h2 - margin2.top - margin2.bottom;

        let x2 = d3.scaleLinear().range([0 + this.pushX, width]),
            y2 = d3.scaleLinear().range([height2, 0]);

        let xAxis2 = d3.axisBottom(x2).tickSize(0)

        let svg = d3.select("." + this.addeddivclass).append("svg")
            .attr("width", width + margin2.left + margin2.right)
            .attr("height", height2 + margin2.top + margin2.bottom)
            .attr('class', 'svg_linevis_1stvis')

        let context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

        let data = this.data

        var xMin = d3.min(data, function (d) {
            return d.data_inst_item;
        });

        var xMax = d3.max(data, function (d) {
            return +d.data_inst_item;
        });
        x2.domain([xMin, xMax]);

        context.append("g")
            .attr("class", "axis axis--x")
            .call(xAxis2);


        context.append("text")
            .attr("x", width * 0.1)
            .attr("y", 5)
            .attr("dy", "1em")
            .attr("text-anchor", "end")
            .text("Training Set")
            .style("fill", "gray")


        context.append("text")
            .attr("x", width * 0.85)
            .attr("y", 5)
            .attr("dy", "1em")
            .attr("text-anchor", "end")
            .text("Test Set")
            .style("fill", "gray")


        // adding the brushing

        let brush = d3.brushX()
            // .extent([
            //     [0, height2 * 0.85],
            //     [width, 15 + height2]
            // ])
            .extent([
                [0, 0],
                [width, height2]
            ])
            .on("brush", brushed)
            .on('end', brushended)

        context.append("g")
            .attr("class", "brush")
            .call(brush)


        let self = this

        function brushended() {
            setTimeout(() => {
                self.reset_modelhighlights()
            }, 6000);
        }
        //create brush function redraw scatterplot with selection
        function brushed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
            let xArr = d3.event.selection; // an array of x axis coord = [0,520]
            // let modelidslist = []
            d3.selectAll('.rect_traintest')
                .attr('id', function (d) {
                    if (d.x >= xArr[0] && d.x <= xArr[1]) {
                        // modelidslist.push(d.modelid)
                        return 'rect_traintest_hoverId'
                    } else {
                        return 'rect_traintestId'
                    }
                })

            d3.selectAll('#rect_traintestId')
            .style('fill', '#ff7700')

            d3.selectAll('#rect_traintest_hoverId')
                .style('fill', 'white')
            // modelidslist = p5D.datast.get_uniquevals(modelidslist)
            let numrecom = +Math.floor(Math.random() * 10 + 2)
            let modelidslist = p5D.modman.get_recomm_models(numrecom)
            console.log(' burshed nstance ', modelidslist)
            self.pick_highlightmodels(modelidslist);

        } // end of brushed 


    }

    // unitvis_ex : https://bl.ocks.org/misanuk/fc39ecc400eed9a3300d807783ef7607
    // linevis_ex : https://bl.ocks.org/gordlea/27370d1eea8464b04538e6d8ced39e89
    make_linevis(id = 0) {
        let margin2 = this.marginobj
        let w = $('.' + this.containerclass).width()
        let h2 = $('.' + this.addeddivclass).height() * 0.05
        let idval = ''
        this.pervis_height = h2
        let width = w - margin2.left - margin2.right,
            height2 = h2 - margin2.top - margin2.bottom;

        let x2 = d3.scaleLinear().range([0 + this.pushX, width]),
            y2 = d3.scaleLinear().range([height2, 0]);

        let xAxis2 = d3.axisBottom(x2).tickSize(0),
            yAxis = d3.axisLeft(y2).tickSize(0);

        let brush = d3.brushX()
            // .extent([
            //     [0, height2 * 0.85],
            //     [width, 15 + height2]
            // ])
            .extent([
                [0, 0],
                [width, height2]
            ])
            .on("brush", brushed);

        let data = this.data
        let self = this
        let idname = ''
        if (id == 0) idname = 'rect_traintest_id'
        let svg = d3.select("." + this.addeddivclass).append("svg")
            .attr("width", width + margin2.left + margin2.right)
            .attr("height", height2 + margin2.top + margin2.bottom)
            .attr('class', 'svg_linevis_tt uk-animation-slide-bottom-medium')
            .attr('id', idname)
            .on('mouseover', function (d) {
                d3.select(this).attr('id', 'rect_traintest_id')
                let modelid = data[0]['modelid']
                self.pick_highlightmodels([modelid], false)
            })
            .on('mouseout', function (d) {
                d3.select(this).attr('id', '')
                // self.pick_highlightmodels([], false)
                self.reset_modelhighlights()
            })

        // .attr('class', 'svg_linevis_tt uk-animation-scale-up')
        // .style('border-bottom', '0.5px dashed rgb(122,122,122)')


        let context = svg.append("g")
            .attr("class", "context")
            .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");


        var xMin = d3.min(data, function (d) {
            return d.data_inst_item;
        });
        var yMin = d3.min(data, function (d) {
            return d.pred_err_val;
        });
        var yMax = d3.max(data, function (d) {
            return d.pred_err_val;
        });

        var xMax = d3.max(data, function (d) {
            return +d.data_inst_item;
        });
        y2.domain([yMin, yMax]);
        x2.domain([xMin, xMax]);

        var num_models_calc = function (dataArray, domainRange) {
            return d3.sum(dataArray, function (d) {
                return d.data_inst_item >= domainRange.domain()[0] && d.data_inst_item <= domainRange.domain()[1];
            })
        }

        // context.append("g")
        //     .attr("class", "axis axis--y")
        //     .call(yAxis);

        // Summary Stats
        context.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - margin2.left)
            .attr("x", 0 - (height2 / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("fill", "gray")
            .text("Pred. error");




        // append scatter plot to brush chart area
        var messages = context.append("g");
        messages.attr("clip-path", "url(#clip)");
        // circles
        // messages.selectAll("message")
        //     .data(data)
        //     .enter().append("circle")
        //     .attr('class', 'modelContext circle_linevis_inst')
        //     .attr("r", 2)
        //     .style("opacity", .6)
        //     .attr("cx", function (d) {
        //         let val = x2(d.data_inst_item);
        //         d.cx = val;
        //         return val
        //         // return x2(d.data_inst_item);
        //     })
        //     .attr("cy", function (d) {
        //         return y2(d.pred_err_val);
        //     })



        // gradient code ++++++++++++++++++++++++++++++++++++++++
        let gradientdisplay = false
        if (gradientdisplay) {

            var svgDefsTop = context.append('defs');
            var svgDefsBottom = context.append('defs');

            var topGradient = svgDefsTop.append('linearGradient')
                .attr('id', 'topGradient')
                .style('transform', "rotate(90deg)")
            topGradient.append('stop')
                .attr('class', 'stop-left')
                .attr('offset', '0.2');

            topGradient.append('stop')
                .attr('class', 'stop-right')
                .attr('offset', '0.5');

            var botGradient = svgDefsBottom.append('linearGradient')
                .attr('id', 'botGradient')
                .style('transform', "rotate(90deg)")
            botGradient.append('stop')
                .attr('class', 'stop-left-bot')
                .attr('offset', '0');

            botGradient.append('stop')
                .attr('class', 'stop-right-bot')
                .attr('offset', '1');
        }
        // gradient code ++++++++++++++++++++++++++++++++++++++++


        // adding bars --- >
        let rectvis = context.selectAll("rect_traintest")
            .data(data)
            // .filter(function(d){
            //     return +d.pred_err_val > 0.4
            // })
            .enter().append("rect")
            // .classed('filled', true)
            .attr('class', function (d) {
                if (idval == '') idval = d['modelid'].split('_')[1]
                let val = 'rect_tt_top'
                if (d.pred_err_val < 0.5) val = 'rect_tt_bottom'

                // val ='red'
                let clval = 'rect_traintest ' + val
                d.class = clval
                return clval
            })
            .attr("x", function (d) {
                // return  50
                d.x = x2(d.data_inst_item)
                return x2(d.data_inst_item);
            })
            .attr("width", function (d) {
                return (data.length / width) + 5
                return x2.bandwidth()
            })
            .attr("y", function (d) {
                let val = d.pred_err_val
                let out = y2(val) - height2 * 0.5
                if (val < 0.5) {
                    let ht = (height2) - y2(val)
                    out = y2(val) - (height2 * 0.5) + ht
                }

                if (val > 0.55) {
                    out = y2(val) - (height2 * 0.075)
                }
                return out
            })
            .attr("height", function (d) {
                let val = d.pred_err_val
                let ht = (height2) - y2(val)
                if (val > 0.4 && val < 0.55) ht = 0.01

                if (val > 0.55) ht = ht * 0.5
                return ht
            }).on('mouseover', function (d, i) {
                let mousePos = [d3.event.offsetX, d3.event.offsetY]
                // console.log(' barslinevis circle mouseover ', d, mousePos, mousePos, d3.event)
                d3.select(this).style('stroke', 'white')
                let datago = {
                    'modelid': d.modelid,
                    'modtype': d.modtype,
                    'prediction_err_norm': d.pred_err_val,
                    'prediction_err': d.pred_err
                }
                tooltip_show(datago, i, mousePos);

            }).on('mouseout', function (d, i) {
                d3.select(this).style('stroke', '')
                tooltip_hide();
            })


        d3.selectAll('.rect_tt_bottom')
            .style('opacity', '0.5')

        // addding model name on the left
        context.append("rect")
            // .attr("transform", "rotate(-90)")
            .attr("x", 32 - margin2.left - 20)
            .attr("y", (height2 / 2))
            .attr("width", "42px")
            .attr("height", "18px")
            .attr("class", "modrect_visline")
            .style("color", "black")
            .style("fill", function (d) {
                let modtype = data[0]['modtype']
                let col = '#5A63EC'
                if (modtype == 'tf') col = '#F1948A'
                return col
            })

        // addding model name on the left
        context.append("text")
            // .attr("transform", "rotate(-90)")
            .attr("x", 32 - margin2.left)
            .attr("y", (height2 / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .style("font-size", "1.1em")
            .style('font-weight', '800')
            .style("fill", "black")
            .text("M_" + idval)

        if (gradientdisplay == false) rectvis.style("fill", "#ff7700")



        var tooltipclass = 'tooltipcontainer'
        var tooltipclassId = 'tooltipcontainerId'

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
            $('.' + tooltipclass).css('top', tp);
            $('.' + tooltipclass).css('left', lft);
        }

        function tooltip_hide() {
            $('#' + tooltipclassId).remove();
        }

        // line function ---- >
        var line_generate = d3.line()
            .x(function (d, i) {
                return x2(d.data_inst_item);
            })
            .y(function (d) {
                return y2(d.pred_err_val);
            })
            .curve(d3.curveMonotoneX)

        // // adding line vis main ---------------------------------- >
        // context.append("path")
        //     .datum(data)
        //     .attr("class", "linevis_line")
        //     .attr("d", line_generate); 
        // // adding line ---------------------------------- > 


        // middle line ---------------------------------- > 
        let val = data.map(d => d.data_inst_item)
        let fac = 0.35
        let obj_st = {
            id: 0,
            data_inst_item: 0,
            pred_err_val: fac
        }
        let obj_end = {
            id: 0,
            data_inst_item: d3.max(val),
            pred_err_val: fac
        }
        let datamid = [obj_st, obj_end];

        context.append("path")
            .datum(datamid)
            .attr("class", "linevis_mid_line")
            .attr("d", line_generate);
        // middle line ---------------------------------- > 


        // verticcal line ---------------------------------- > 
        obj_st = {
            id: 0,
            data_inst_item: d3.max(val) * 0.8,
            pred_err_val: 0
        }
        obj_end = {
            id: 0,
            data_inst_item: d3.max(val) * 0.8,
            pred_err_val: 1
        }
        let dataver = [obj_st, obj_end];

        context.append("path")
            .datum(dataver)
            .attr("class", "linevis_vert_line")
            .attr("d", line_generate);
        // middle line ---------------------------------- > 


        context.append("g")
            .attr("class", "axis x-axis")
            .attr("transform", "translate(0," + height2 + ")")
        // .call(xAxis2);

        context.append("g")
            .attr("class", "brush")
        // .call(brush)
        // .call(brush.move, x.range());


        //create brush function redraw scatterplot with selection
        function brushed() {
            if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return;
            let xArr = d3.event.selection; // an array of x axis coord = [0,520]

            d3.selectAll('.circle_linevis_inst')
                .style('fill', '#FF7700')
                // .style('fill', 'red')
                .attr("r", 4)

            let modelidslist = []
            d3.selectAll('.circle_linevis_inst')
                .filter((d, i) => {
                    let check = d.cx >= xArr[0] && d.cx <= xArr[1]
                    if (check) {
                        modelidslist.push(d.modelid)
                    }
                    return check
                })
                .style('fill', 'white')
                .attr("r", 5)
            console.log(' burshed unit bars ', modelidslist)
            self.pick_highlightmodels(modelidslist);

        } // end of brushed 



    }

    get_indices(num = 18) {
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
                let highlightcol = rect.styleobj.clickedcol
                // if (indices.indexOf(j) != -1) {
                if (modelidslist.indexOf(rect.dataobj.modelid) != -1 && !found) {
                    rect.setFillStyle(highlightcol, 1)
                    found = true
                } else {
                    let color = rect.styleobj['col'],
                        alpha = rect.styleobj['alpha']

                    // alpha = 0.05
                    color = '0x000'
                    rect.setFillStyle(color, alpha)
                }

            })

        })

    }


}