/**
class that places a container of grid cells
and then populates ML models as horiz rounded rects
*/
class ContainterGrid {
  constructor(config) {
    let {
      scene,
      x,
      y,
      modtype,
      wid,
      ht

    } = config
    this.scene = scene
    this.position = createVector(x, y)
    this.modtype = modtype
    this.wid = wid
    this.ht = ht

    this.sizeX = 0
    this.sizeY = 0
    this.numptx = this.numpty = 200 // number of cells | drives size of the cell
    this.numpty = 20
    this.flip = true

    if (this.wid == null || this.ht == null) {
      console.log(' WID HT NULL FOUND ', config)
      this.wid = p5D.scene.game.canvas.width * 0.49 // 500
      this.wid = p5D.scene.game.canvas.width * 0.495// 500
      this.ht = p5D.scene.game.canvas.height * 0.95
    } else {
      //single containter mode
      this.numpty = 2 * this.numpty
    }



    //later can connect with input x and y
    // let pad = 25,
    //   padX = 30

    let pad = 5,
      padX = 10
    if (this.modtype == 'reg') {
      this.x = p5D.wid * 0.5 + pad + padX
      this.y = p5D.ht * 0.0 + pad
    } else {
      this.x = p5D.wid * 0.0 + pad - 5 + padX
      this.y = p5D.ht * 0.0 + pad
    }

    // variables to handle interactions ----
    this.clickedrect = [{}, {}]
    this.clickedtrigger = false
    this.tooltipclass = 'tooltipcontainer'
    this.tooltipclassId = 'tooltipcontainerId'
    // variables to handle interactions ----

    this.celllist = []
    this.container = null
    this.shapegridlist = []
    this.container_view()
    // let nummod = 2 * this.numptx
    let nummod = 20;

    this.modperfpairlist = []
    this.modidpairlist = []

    // main func that renders the models on the vis --- >
    // this.fill_models(nummod);
  } // end constructor


  destroy_modelgeom() {
    let elemAll = this.get_modelrects()
    for (let m = 0; m < elemAll.length; m++) {
      let elements = elemAll[m]
      elements.forEach((box, i) => {
        box.destroy()
      })
    }

    elemAll = this.get_modellines();
    for (let m = 0; m < elemAll.length; m++) {
      let elements = elemAll[m]
      elements.forEach((box, i) => {
        box.destroy()
      })
    }

    console.log('destroyed bod container items ', this)

  }


  fill_models(nummod = 30) {
    // --- here we connect with real model data from tensor flow ---
    this.destroy_modelgeom()
    let modeldata = this.get_modeldata(nummod)
    let modpairobj = this.new_makemodelpairs(modeldata)

    let some = this.model_draw(modpairobj)
  }

  compute_cell_req(d, maxval = 1, fac = 0.95) {
    return +Math.floor(map(d, 0, maxval, 1, this.numptx * fac, true))
  }

  new_makemodelpairs(modeldata) {
    //resetting 
    this.modperfpairlist = []
    this.modidpairlist = []

    let pairlist = []
    let modelmap = {}
    let maxval = p5D.modman.maxval_allmods
    let limit = 100
    let metric_rmse = 'rmse'
    let metric = 'rankscore'
    let perflist_init = Object.keys(modeldata).map((k, i) => {
      let mod_met = modeldata[k]['modobj'][metric]
      return mod_met
    })

    // ++++++++ adjust perflist metric for both list ++++++++++++
    let maxperf = -1
    perflist_init = Object.keys(modeldata).map((k, i) => {
      let d = perflist_init[i]
      let curr_metric = modeldata[k]['modobj']['model_metrics_test'][metric_rmse]
      let newperf = +d * (+maxval / curr_metric)
      if (maxperf < newperf) maxperf = newperf
      return newperf
    })

    // console.log(' ----- orig perf list was ', this.modtype, perflist_init)

    let perflist = perflist_init.map((p, i) => {
      return +map(p, 0, maxval, 0, limit)
    })

    // debugger

    Object.keys(modeldata).forEach((k, i) => modelmap[perflist[i]] = modeldata[k]['modelid'])
    // ++++++++ adjust perflist metric for both list ++++++++++++
    perflist.sort((a, b) => +b - +a)
    let newmodelmap = {}
    perflist.forEach((d, i) => newmodelmap[d] = modelmap[d])

    // loop from left and right to create the pairs
    let left = 0,
      right = perflist.length,
      fac = 0.3,
      checkmax = -1,
      mincell = 20,
      addon = 0

    let numbar = p5D.modman.nummodelpergen
    while (left < right) {
      let arrItem = [],
        count = 0,
        summ = 0, 
        count_numbar = 0
      // numbar = +Math.floor(Math.random()*3 + 1)
      // console.log(' --- starting val addon ')
      new Array(numbar).fill(null).forEach((f, i) => {
        // if(summ > 175) return
        let iter = perflist.length - count - addon
        if (i == 0) iter = 0 + left
        let val = perflist[iter]

        // console.log(' perf val ', val)
        arrItem.push(val)
        summ += val
        count += 1
        count_numbar += 1
      })
      addon += count_numbar - 1
      if (checkmax < summ) checkmax = summ
      pairlist.push(arrItem)
      left += 1
      right -= count_numbar - 1
    }

    let pairlist_mapped = pairlist.map(p => {
      let arrval = []
      p.forEach(v => {
        let val = +map(v, 0, limit, mincell, checkmax)
        arrval.push(val)
      })
      return arrval
    })

    let modelidlist = pairlist.map((p, i) => {
      let maparr = p.map(v => newmodelmap[v])
      return maparr
    })
    let valfac = maxval * 1
    let cell_pairlist = pairlist_mapped.map((p, i) => {
      // if(p.length < 3) fac = 0.65
      // else fac = 0.25
      let cellarr = p.map(c => this.compute_cell_req(c, valfac, fac))
      return cellarr
    })
    console.log('  ----- perf list data finally ', this.modtype, pairlist, pairlist_mapped, modelidlist, cell_pairlist)
    this.modperfpairlist.push(...cell_pairlist)
    this.modidpairlist.push(...modelidlist)

    // this.modperfpairlist = cell_pairlist
    // this.modidpairlist = modelidlist

    this.modpairobj_data = {
      'modcellpairs': this.modperfpairlist,
      'modidpairs': this.modidpairlist,
      'modtype': this.modtype
    }

    // console.log('mod pair list length ', this.modperfpairlist, this.modidpairlist)
    return this.modpairobj_data
  }

  tooltiptextDOM_hide() {
    $('#' + this.tooltipclassId).remove();
  }

  tooltiptextDOM_show(geom = null) {
    let scene = p5D.scene
    let px = scene.input.mousePointer.x,
      py = scene.input.mousePointer.y
    let mx = px + 10,
      my = py + 10
    $('#' + this.tooltipclassId).remove();
    let str = `<div class = ${this.tooltipclass} id = ${this.tooltipclassId}></div>`
    $('body').append(str);

    let obj = geom.dataobj,
      modmet = obj.model_metrics,
      hyp = obj.hyperparams

    // console.log('checking data obj gem ', obj)

    let headerclass = 'ttip_blackheader'
    let content = `<div class = ${headerclass} id = ${headerclass}_id> </div>`

    Object.keys(obj).forEach((key, i) => {
      if (key == 'hyperparams' || key == 'model_metrics' || key == 'index' || key == 'type_hilow') return
      content += `<div class = 'ttipcontent' > <span class = 'ttipkey' > ${key}: </span> <span class = 'ttipvalue'> ${obj[key]}</span> </div>`
    })

    Object.keys(modmet).forEach((key, i) => {
      if (i > 2) return
      content += `<div class = 'ttipcontent' > <span class = 'ttipkey' > ${key}: </span> <span class = 'ttipvalue'> ${modmet[key]}</span> </div>`
    })

    Object.keys(hyp).forEach((key, i) => {
      content += `<div class = 'ttipcontent' > <span class = 'ttipkey' > ${key}: </span> <span class = 'ttipvalue'> ${hyp[key]}</span> </div>`
    })


    $("#" + this.tooltipclassId).append(content);
    let pos = $('canvas').position()
    let tp = pos.top + my,
      lft = pos.left + mx
    $('.' + this.tooltipclass).css('top', tp);
    $('.' + this.tooltipclass).css('left', lft);

    // $('.ttipkey').css('font-weight', 300)

  }


  get_modelrects() {
    let scene = p5D.scene
    let cons = scene.children.list.filter((el, i) => el.type == 'Container' && el.modtype == this.modtype ? true : false)
    let elemAll = []
    for (let m = 0; m < cons.length; m++) {
      let elements = cons[m].list.filter((el, i) => el.name == 'modelrect' && el.modtype == this.modtype ? true : false)
      elemAll.push(elements)
    }
    return elemAll
  }

  get_modellines() {
    let scene = p5D.scene
    let cons = scene.children.list.filter((el, i) => el.type == 'Container' && el.modtype == this.modtype ? true : false)
    let elemAll = []
    for (let m = 0; m < cons.length; m++) {
      let elements = cons[m].list.filter((el, i) => el.name == 'linefeature' && el.modtype == this.modtype ? true : false)
      elemAll.push(elements)
    }
    return elemAll
  }


  reset_rectcol() {
    // reset color for all
    let elemAll = this.get_modelrects()
    this.clickedrect = [{}, {}]

    for (let m = 0; m < elemAll.length; m++) {
      let elements = elemAll[m]
      elements.forEach((obj, d) => {
        obj.setFillStyle(obj.styleobj.col, obj.styleobj.alpha)
      })
    }
  }

  activate_otherviews(geom) {
    let self = this
    let data = geom.dataobj
    let modelid = data.modelid

    //hyperparame circles
    d3.selectAll('.circle_unitvis').each(function (d) {
      if (d.model_id == modelid) {
        $(this).attr('r', '10')
        $(this).attr('stroke', 'white')
        $(this).attr('stroke-weight', '10')
        // console.log(' checking ', d3.selectAll(this), $(this), self)
      }
    })
  }

  deactivate_otherviews(geom) {
    d3.selectAll('.circle_unitvis').attr('r', 4)
    d3.selectAll('.circle_unitvis').attr('stroke', '')
    d3.selectAll('.circle_unitvis').attr('stroke-weight', 0)
  }
  add_interactions() {
    let elemAll = this.get_modelrects()
    this.clickedrect.forEach((s, k) => {
      Object.keys(s).forEach((h, j) => {
        s[h] = false
      })
    })
    for (let m = 0; m < elemAll.length; m++) {
      let elements = elemAll[m]
      elements.forEach((box, i) => {

        let {
          col,
          hovercol,
          alpha,
          clickedcol
        } = box.styleobj;


        //INTERACTIONS
        box.on('pointerover', (pointer, localX, localY, event) => {
          // if (self.clicked_rectoverlay == true) return
          this.tooltiptextDOM_show(box)
          this.activate_otherviews(box);
          if (this.clickedrect[m][i] == true) {
            return
          }



          box.setFillStyle(hovercol, 1);

        })

        box.on('pointerout', (pointer, localX, localY, event) => {
          this.tooltiptextDOM_hide();
          this.deactivate_otherviews(box);

          if (this.clickedrect[m][i] == true) {
            return
          }
          box.setFillStyle(col, alpha);
        })

        box.on('pointerdown', (pointer, localX, localY, event) => {
          if (this.clickedtrigger) return
          this.clickedtrigger = true
          setTimeout(() => {
            this.clickedtrigger = false
          }, 500);

          // this.clickedrect.forEach((s, k) => {
          //   Object.keys(s).forEach((h, j) => {
          //     s[h] = false
          //   })
          // })

          this.reset_rectcol()

          if (i in this.clickedrect[m]) {
            this.clickedrect[m][i] = !this.clickedrect[m][i]
          } else {
            this.clickedrect[m][i] = true
          }



          if (this.clickedrect[m][i]) {
            box.setFillStyle(clickedcol, 1);
          } else {
            box.setFillStyle(col, alpha);
          }

          this.rect_click_actions(box)
        }) // end of pointer down --- 

      }) // end of for each
    }
  } // end of add interactions


  rect_click_actions(geom) {
    console.log(' clicked geom .... ', geom);


    // p5D.modman.OMS.calc_model_rankscore(p5D.modman.modschemalist, p5D.modman.maxval_allmods);

    p5D.modman.highlightedmodel_id = geom.dataobj.modelid
    p5D.modman.highlighted_modtype = this.modtype

    p5D.modman.topkmodel_num = +Math.floor(Math.random() * 30) + 8
    p5D.modman.topkmodelsobj = p5D.modman.OMS.query_topkmodels(p5D.modman.topkmodel_num)

    p5D.moddet_train.highlightedmodel_id = p5D.moddet_test.highlightedmodel_id = geom.dataobj.modelid //+Math.floor(Math.random() * 10);

    p5D.moddet_train.highlightedmodel_type = p5D.moddet_test.highlightedmodel_type = this.modtype


    p5D.moddet_train.highlightedmodel_type = p5D.moddet_test.highlightedmodel_type = geom.dataobj.type
    p5D.moddet_train.update_vis()
    p5D.moddet_test.update_vis()

    p5D.moddet_text.txt_additions()
    p5D.moddet_text.clicked_txt_additions()

    if (p5D.featman.currentview == p5D.featman.viewtype.HISTOGRAMPLOTS) p5D.histomulti.update_vis();

    if (p5D.featman.currentview == p5D.featman.viewtype.CORRELATIONPLOTS) p5D.cortar.update_vis();

    if (p5D.featman.currentview == p5D.featman.viewtype.SCATMATRIX) p5D.corvars.update_vis();


    setTimeout(() => {
      p5D.TTLineVis.highlightedmodel_id = geom.dataobj.modelid
      p5D.TTLineVis.highlightedmodel_type = this.modtype
      p5D.TTLineVis.update_vis();
    }, 200);

  }


  model_draw(modpairobj) {
    console.log('CALC MOD PAIRS ', modpairobj)
    let {
      modcellpairs,
      modidpairs,
      modtype
    } = modpairobj
    let margin = 2
    // iterating per row
    this.modeldraw_obj = modcellpairs.map((mp, i) => {
      if (i > this.celllist.length - 1) return

      let modid_two = modidpairs[i]

      let startpt = 0,
        endpt = 0,
        cellmods = null
      let modelobjs = []
      let r2info = -1
      // console.log(' perf new cell starting ++++++++++++++++++++ ')
      mp.forEach((g, j) => {
        // if (j > 2) return
        // endpt += g + margin
        endpt = startpt + g + margin
        // if (endpt > this.numptx - 1) endpt = this.numptx
        // if (g < 5) endpt += 1
        cellmods = this.celllist[i].slice(startpt, endpt)
        // console.log('perf cells found ', cellmods, startpt, endpt, mp)
        startpt = margin + endpt

        let modobj1 = p5D.modman.modschemalist[modtype][modid_two[j]]['modobj']
        let R2_sc1 = modobj1['model_metrics_test']['R2']
        let type1 = 'high'
        if (R2_sc1 < r2info) {
          type1 = 'low'
        }

        r2info = R2_sc1

        let parmod = new ModelDraw({
          'cells': cellmods,
          'type': type1,
          'container': this.container,
          'modelid': modid_two[j], //'model_' + i + 1,
          'modtype': this.modtype,
          'index': i
        })

        modelobjs.push(parmod)
      }) // end of for each

      let arrobjs = [...modelobjs]
      this.clickedrect = arrobjs.map(f => {
        return {}
      })
      this.add_interactions();
      return arrobjs
    });


  }


  get_modeldata(nummod = 10) {
    let moddata_obj = p5D.modman.modschemalist[this.modtype];
    console.log('checkout modeldata perf ', moddata_obj)
    return moddata_obj;
  }

  create_fillerdata(nummod = 30) {
    let modeldata = []
    for (let i = 0; i < nummod; i++) {
      let obj = {
        'perf': random(0, 1)
      }
      modeldata.push(obj)
    }
    return modeldata;
  }



  container_view() {
    this.container = this.scene.add.container(this.x, this.y).setInteractive();
    this.container.modtype = this.modtype
    this.graphics = this.scene.add.graphics().setInteractive()
    // this.scene.input.setDraggable(this.container);
    this.scene.input.on('drag', (pointer, gameObject, dragX, dragY) => {
      gameObject.x = dragX;
      gameObject.y = dragY;
      this.show()
    });
    this.add_cells();
    this.show();
  }

  create_bbox() {

    let x1 = this.x,
      y1 = this.y,
      x2 = this.x + this.wid,
      y2 = this.y,
      x3 = this.x,
      y3 = this.y + this.ht,
      x4 = this.x + this.wid,
      y4 = this.y + this.ht

    return [
      [x1, y1],
      [x2, y2],
      [x3, y3],
      [x4, y4]
    ]
  }

  add_cells() {
    let bbxarr = this.create_bbox()
    let numptx = this.numptx,
      numpty = this.numpty
    this.sizeX = Math.floor(this.wid / numptx),
      this.sizeY = Math.floor(this.ht / numpty)

    let x = bbxarr[0][0],
      y = bbxarr[0][1]
    x = 0, y = 0 // when added with container
    for (let i = 0; i < numpty; i++) {
      let cellgrouped = []
      for (let j = 0; j < numptx; j++) {
        let obj = {
          'row': i,
          'col': j,
          'empty': true,
          'shape': null // auto updates when cell draw shap called
        }
        let cellobj = new Cell(obj)
        let shape = cellobj.cell_draw_shape(x, y, this.sizeX * 0.85, this.sizeY * 0.85)
        cellgrouped.push(cellobj)
        this.container.add(shape)
        x += this.sizeX
      } // inner for ends
      y += this.sizeY
      // x = bbxarr[0][0]
      x = 0 // when added to container
      this.celllist.push(cellgrouped)
    } // outer for ends
    console.log('ADDED ALL CELLS .... ', this.celllist)
  }


  show() {
    this.graphics.clear();
    this.graphics.lineStyle(1, '0xC9C9C9', 0.5);
    this.graphics.strokeRectShape(this.container.getBounds());
  }
}