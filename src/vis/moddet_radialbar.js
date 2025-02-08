class ModDetailRadial {
    constructor(container = 'sidebar', addeddiv = 'radialbardiv_train', type = 'Training Set') {
        this.type = type
        this.containerclass = container //'detailbar'
        this.addeddivclass = addeddiv
        this.baseclassname = 'radialbardiv'
        this.highlightedmodel_id = -1
        this.highlightedmodel_type = 'reg'
        this.update_vis()
    }

    update_vis() {
        // this.makedata_radial();
        this.get_data_from_modelschema()
        this.make_radialbarchart();
    }

    // not using now
    makedata_radial() {
        let numitem = 10,
            modelnames = ['reg', 'tf'],
            numModel = modelnames.length,
            tempval = -1
        let dataArr = new Array(numitem).fill().map((d, i) => {
            var obj = {
                'id': i
            }
            new Array(numModel).fill()
                // .map((d, j) => obj[modelnames[j]] = 0 + Math.ceil(Math.random(0, 1) * 20 * (j + 1)))
                .forEach((d, j) => {
                    let score = Math.random(0, 1)
                    if (tempval == -1) tempval = score
                    else {
                        score = 1 - tempval
                        tempval = -1
                    }
                    obj[modelnames[j]] = score
                })
            return obj
        })
        dataArr.columns = Object.keys(dataArr[0])
        this.data = dataArr
        // console.log('radial data arr ', dataArr)
    }

    get_data_from_modelschema() {
        this.data = p5D.modman.get_topmodeldata(this.type)
        this.data.columns = Object.keys(this.data[0])

        let specificmod_data = null
        if (this.highlightedmodel_id != -1) {
            let modelid = this.highlightedmodel_id;
            let modtype = this.highlightedmodel_type;
            let found = false
            // check if id already there
            let modelidlist = []
            this.data.forEach(d => {
                modelidlist.push(d.tfid)
                modelidlist.push(d.regid)
            })
            if (modelidlist.indexOf(modelid) != -1) found = true
            if (!found) {
                specificmod_data = p5D.modman.get_specific_modeldata_radial(this.type, modelid, modtype)
                this.data.unshift(specificmod_data)
            }
        }
    }

    /*
    src = https: //bl.ocks.org/KoGor/9f3932d3c7154f8ab3ea2078b2aca113
    */
    make_radialbarchart() {
        let self = this
        let data = this.data

        let container = this.containerclass,
            radialbarcontainer = this.addeddivclass,
            w = 500,
            h = 350,
            innerRadius = 50,
            outerRadius = Math.min(w, h) / 2.2


        w = $('.radialbars_wrapdiv').width() * 0.5
        h = $('.radialbars_wrapdiv').height() * 0.65
        d3.select('.' + radialbarcontainer).remove();
        let svgDiv = d3.select('.' + container)
            .append('div')
            .attr('class', radialbarcontainer + ' ' + this.baseclassname + ' uk-animation-slide-top-medium')
        let svg = svgDiv.append('svg')
            .attr('width', w)
            .attr('height', h)
        // .style('border', '1px solid lightgray')
        let g = svg.append("g")

        g.attr("transform", "translate(" + w / 2 + "," + h / 2 + ")");

        // sizes the radial bar
        let scaleSize = 1.9
        var xScaleOffset = Math.PI * 75 / 180;
        var x = d3.scaleBand()
            .range([xScaleOffset, 2 * Math.PI + xScaleOffset])
            .align(0);

        var y = d3.scaleLinear()
            .range([innerRadius, outerRadius]);

        // var colors = ["#5A63EC", "#A9D7E1", "#bb98db", "#aa18", "#ff08"]
        // var colors = ["#5A63EC", "#239B56", "#bb98db", "#aa18", "#ff08"]
        var colors = ["#5A63EC", "#F1948A", "#bb98db", "#aa18", "#ff08"]


        var z = d3.scaleOrdinal()
            .range(colors);

        // var zClasses = data.columns.filter(f => f != 'id')

        // var meanAccidents = d3.mean(data, function (d) {
        //     return d3.sum(zClasses, k => +d[k]);
        // })


        x.domain(data.map(function (d) {
            return d.id;
        }));
        y.domain([0, d3.max(data, (d, i) => {
            let keys = Object.keys(d).filter(f => f != 'id')
            return d3.sum(keys, k => +d[k] * scaleSize)
        })]);
        z.domain(data.columns.slice(1));

        var tooltipclass = 'tooltipcontainer'
        var tooltipclassId = 'tooltipcontainerId'
        g.append('g')
            .selectAll("g")
            .data(d3.stack().keys(data.columns.slice(1))(data))
            .enter().append("g")
            .attr("fill", function (d) {
                return z(d.key);
            })
            .attr('id', function (d, i) {
                return 'test_path_radial_' + d.key
            })
            .selectAll("path")
            .data(function (d) {
                return d;
            })
            .enter().append("path")
            .attr("d", d3.arc()
                .innerRadius(function (d) {
                    return y(d[0]);
                })
                .outerRadius(function (d) {
                    return y(d[1]);
                })
                .startAngle(function (d) {
                    return x(d.data.id);
                })
                .endAngle(function (d) {
                    return x(d.data.id) + x.bandwidth();
                })
                .padAngle(0.01)
                .padRadius(innerRadius))
            .attr('class', 'path_radialbars')
            .on('mouseover', function (d, i) {
                let mousePos = [d3.event.offsetX, d3.event.offsetY]
                let dt = d['data']

                let reg_rmse = p5D.modman.modschemalist['reg'][dt['regid']]['modobj']['model_metrics_test']['rmse']
                let tf_rmse = p5D.modman.modschemalist['tf'][dt['tfid']]['modobj']['model_metrics_test']['rmse']

                if (self.type == 'Training Set') {
                    reg_rmse = p5D.modman.modschemalist['reg'][dt['regid']]['modobj']['model_metrics_train']['rmse']
                    tf_rmse = p5D.modman.modschemalist['tf'][dt['tfid']]['modobj']['model_metrics_train']['rmse']
                }
                let newdata = {
                    regid: dt['regid'],
                    tfid: dt['tfid'],
                    reg_rmse: reg_rmse.toFixed(3),
                    tf_rmse: tf_rmse.toFixed(3)
                }
                tooltip_show(newdata, i, mousePos);
                d3.select(this).style('stroke', 'white')


                console.log('radial data ', d)

                let modelidlist = [d.data.regid, d.data.tfid]
                pick_highlightmodels(modelidlist);
            })
            .on('mouseout', function (d, i) {
                d3.select(this).style('stroke', '')
                tooltip_hide();
                reset_modelhighlights();


            })

        function reset_modelhighlights() {
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

        function pick_highlightmodels(modelidslist = [], found_override = true) {
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

        function tooltip_show(data, index, mousePos) {
            let mx = mousePos[0] + 10,
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

        let modelhighlightdone = false

        let idsel = 'test_path_radial_' + this.highlightedmodel_type
        d3.selectAll('#' + idsel)
            .selectAll('path')
            .attr('stroke', function (k, i) {
                let d = k['data']
                // if (i == self.highlightedmodel_id) {
                if (!modelhighlightdone) {
                    if (d.tfid == self.highlightedmodel_id || d.regid == self.highlightedmodel_id) {
                        // modelhighlightdone = true
                        return 'white'
                    } else return 'none'
                } else {
                    return 'none'
                }

            })
            .attr('stroke-width', function (k, i) {
                let d = k['data']
                // if (i == self.highlightedmodel_id) {
                if (d.tfid == self.highlightedmodel_id || d.regid == self.highlightedmodel_id) {
                    return 3
                } else return 1
            })


        //yAxis and Mean
        // var yAxis = g.append("g")
        //     .attr("text-anchor", "middle");

        let max = d3.max(data, (d, i) => {
            let keys = Object.keys(d).filter(f => f != 'id')
            return d3.sum(keys, k => +d[k])
        })
        var yTicksValues = d3.ticks(0, max * 1.1, 5);

        // Mean value line
        // var yMeanTick = yAxis
        //     .append("g")
        //     .datum([meanAccidents]);

        //mean y axis arc
        // yMeanTick.append("circle")
        //     .attr("fill", "none")
        //     .attr("stroke", "#C0625E")
        //     .attr("stroke-width", 2)
        //     .attr("stroke-dasharray", "5 3")
        //     .attr("r", y);

        // var yTick = yAxis
        //     .selectAll("g")
        //     .data(yTicksValues)
        //     .enter().append("g");

        // y arcs 
        // yTick.append("circle")
        //     .attr("fill", "none")
        //     .attr("stroke", "#ccdcea")
        //     .attr("r", y);

        // y text background white
        // yTick.append("text")
        //     .attr("y", function (d) {
        //         return -y(d);
        //     })
        //     .attr("dy", "0.35em")
        //     .attr("fill", "none")
        //     .attr("stroke", "#fff")
        //     .attr("stroke-width", 5)
        //     .text(y.tickFormat(5, "s"));

        // COMMENTED
        // yTick.append("text")
        //     .attr("y", function (d) {
        //         return -y(d);
        //     })
        //     .attr("dy", "0.35em")
        //     .style('font-size', '0.6em')
        //     .text(y.tickFormat(5, "s"));


        // heading 
        g.append('text')
            .attr('y', -125)
            .attr('x', -1 * innerRadius + 25)
            .attr('dy', '1em')
            .style('font-size', '1.6em')
            .text(this.type)
            .attr('class', 'g_txt_heading')

        // center text 
        // let acc = (+Math.random().toFixed(3) + 0.2).toFixed(3)
        // if (acc > 1.0) acc = +Math.random().toFixed(3) * 0.5
        // acc = parseFloat(acc).toFixed(3)
        let acc = 0

        if (this.highlightedmodel_id == -1) {
            let count = 0
            data.forEach(d => {
                console.log(' check radial data ', d)
                // let dt = d;
                let regid = d.regid,
                    tfid = d.tfid

                let regdata = p5D.modman.modschemalist['reg'][regid]['modobj']
                let tfdata = p5D.modman.modschemalist['tf'][tfid]['modobj']
                let accmod = 0
                if (this.type == 'Training Set') {
                    accmod = regdata['model_metrics_train']['R2']
                    accmod += tfdata['model_metrics_train']['R2']
                } else {
                    accmod = regdata['model_metrics_test']['R2']
                    accmod += tfdata['model_metrics_test']['R2']
                }
                acc += accmod
                count += 2
            })

            acc = +(acc / count).toFixed(3)
        } else {
            let modtype = this.highlightedmodel_type,
                modelid = this.highlightedmodel_id
            let modobj = p5D.modman.modschemalist[modtype][modelid]['modobj']
            if (this.type == 'Training Set') {
                acc = modobj['model_metrics_train']['R2']
            } else {
                acc = modobj['model_metrics_test']['R2']
            }
            acc = +(acc).toFixed(3)
        }




        g.append('text')
            .attr('y', 10)
            .attr('x', -1 * innerRadius + 30)
            .attr('dy', '0.9em')
            .style('font-size', '1.2em')
            .text('Avg. R2')
            .attr('class', 'g_txt_center')

        g.append('text')
            .attr('y', -15)
            .attr('x', -1 * innerRadius + 25)
            .attr('dy', '0.9em')
            .style('font-size', '2.3em')
            .text(acc)
            .attr('class', 'g_txt_center')
            .attr('id', 'g_txt_center_' + this.type.split(' ')[0])

        // y axis title text
        // yAxis.append("text")
        //     .attr("y", d => -y(yTicksValues.pop()) + 20)
        //     .attr("dy", "-2em")
        //     .text("Model Detail");

        // Labels for xAxis
        var label = g.append("g")
            .selectAll("g")
            .data(data)
            .enter().append("g")
            .attr("text-anchor", "middle")
            .attr("transform", function (d) {
                return "rotate(" + ((x(d.id) + x.bandwidth() / 2) * 180 / Math.PI - 90) + ")translate(" + innerRadius + ",0)";
            });

        label.append("line")
            .attr("x2", function (d) {
                return (((d.km % 5) == 0) | (d.id == '1')) ? -7 : -4
            })
            .attr("stroke", "#000");

        label.append("text")
            .attr("transform", function (d) {
                return (x(d.km) + x.bandwidth() / 2 + Math.PI / 2) % (2 * Math.PI) < Math.PI ? "rotate(90)translate(0,16)" : "rotate(-90)translate(0,-9)";
            })
            .text(function (d) {
                var xlabel = (((d.id % 5) == 0) | (d.id == '1')) ? d.id : '';
                return xlabel;
            })
            .style('font-size', '0.6em')

        // Legend
        // var legend = g.append("g")
        //     .selectAll("g")
        //     .data(zClasses)
        //     .enter().append("g")
        //     .attr("transform", function (d, i) {
        //         return "translate(-20," + (i - (zClasses.length - 1) / 2) * 25 + ")";
        //     });

        // legend.append("circle")
        //     .attr("r", 8)
        //     .attr("fill", z);

        // legend.append("text")
        //     .attr("x", 15)
        //     .attr("y", 0)
        //     .attr("dy", "0.35em")
        //     .style('font-size', '0.65em')
        //     .text(function (d) {
        //         return d;
        //     });

    }


}

/**
 * class to generate model detail text overlays
 */
class RadialBarTextOverlay {
    constructor(container = '', addeddiv = '') {
        this.containerclass = container;
        this.addeddivclass = addeddiv;
        this.topoffset = 400
        this.htmlcontent();
        this.txt_additions();

    }

    htmlcontent() {
        let content = `<div class ='${this.addeddivclass} uk-animation-slide-top-medium'></div>`;
        $('.' + this.containerclass).append(content);

        this.topoffset = $('.' + this.containerclass).height() * 0.7

        //style the position abs item
        let pos = $('.' + this.containerclass).position();
        let tp_pos = pos.top + this.topoffset,
            lf_pos = pos.left + 10

        let selector = $('.' + this.addeddivclass)
        selector.css('top', tp_pos)
        selector.css('left', lf_pos)
    }


    clicked_txt_additions() {
        $('.txt_radial_hover').empty()
        $('.txt_radial_hover').hide()
        let modelid = p5D.moddet_test.highlightedmodel_id
        let modtype = p5D.moddet_test.highlightedmodel_type
        let modobj = p5D.modman.modschemalist[modtype][modelid]['modobj']

        let rmse = modobj['model_metrics_test']['rmse'].toFixed(3)
        let rscore = modobj['model_metrics_test']['R2'].toFixed(3)
        let resid = modobj['model_metrics_test']['residual_score'].toFixed(3)
        let hyperparams = modobj['hyperparams']


        let content = `
        <div class = txt_modelHeader> Selected Model ID: <span id = 'modelidspan_radialtxt'> ${modelid} </span> </div>
        <div class = txt_content > RMSE: ${rmse} | R2: ${rscore} | Residual: ${resid}</div>
        `;
        let hype_keys = Object.keys(hyperparams)
        for (let i = 0; i < hype_keys.length - 1; i += 2) {
            content += `
            <div class = txt_content > ${hype_keys[i]}: ${hyperparams[hype_keys[i]]} | 
            ${hype_keys[i+1]}: ${hyperparams[hype_keys[i+1]]}</div>
            `;
        }
        setTimeout(() => {
            $('.txt_radial_hover').show()
        }, 100);

        $('.txt_radial_hover').append(content);
        $('.txt_radial_hover').css('padding-left', '15px')
        $('.txt_content').css('color', 'lightgray')
    }

    txt_additions() {
        $('.' + this.addeddivclass).empty()
        let numbestmods = p5D.modman.topkmodel_num
        let tfmodlen = Object.keys(p5D.modman.modschemalist['tf']).length
        let regmodlen = Object.keys(p5D.modman.modschemalist['reg']).length
        let nummodels = tfmodlen + regmodlen

        let content = `
        <div class = txt_radial_persist>
        <div class = txt_modelSubHeader > Top ${numbestmods} Best Models</div>
        <div class = txt_content >Total Models: ${nummodels}</div>
        <div class = txt_content >Tensorflow Models: ${tfmodlen}</div>
        <div class = txt_content >Regular Models: ${regmodlen}</div>
        </div>
        <div class = txt_radial_hover></div>
        `;
        $('.' + this.addeddivclass).append(content);

        //styling 
        $('.' + this.addeddivclass).css('font-size', '1.3em')
        $('.txt_modelHeader').css('font-size', '1.2em')
        $('.txt_modelHeader').css('font-weight', 800)
        $('.txt_modelHeader').css('padding-bottom', '5px')
        $('.txt_content').css('color', 'lightgray')

        $('.txt_modelSubHeader').css('font-weight', 800)
    }
}