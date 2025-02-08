/**
class holds data for the grid cell
*/
class Cell {
  constructor(obj) {
    const {
      row,
      col,
      empty,
      shape
    } = obj
    this.row = row
    this.col = col
    this.strokewid = 2
    this.empty = empty
    this.shape = shape

  }

  cell_draw_shape(x, y, wid, ht) {
    let col = Phaser.Display.Color.GetColor(188, 188, 188)
    let rad = 2,
      fac = 0.5,
      facht = 0.5
    // let shapegrid = p5D.scene.add.rexRoundRectangle(x, y, wid * fac, ht * fac, rad, col).setInteractive()
    let shapegrid = p5D.scene.add.rectangle(x, y, wid * fac, ht * facht, col).setInteractive()
    shapegrid.name = 'cellgrid'
    shapegrid.setFillStyle(col, 0.05);
    // shapegrid.setStrokeStyle(2, col, 1);
    this.shape = shapegrid
    return shapegrid
  }


}


/*
class that draws model representations
*/
class ModelDraw {
  constructor(config) {
    let {
      cells,
      type,
      container,
      modelid,
      index,
      modtype
    } = config
    this.container = container
    this.cells = cells
    this.type = type
    this.modelid = modelid
    this.index = index
    this.modtype = modtype
    this.modeldata = p5D.modman.modschemalist[this.modtype][this.modelid]['modobj']
    // type  decides the color of the model (low and high based on model perf)
    this.color_setup()
    this.r = 5
    this.modshapelist = []
    this.showrect()
    this.showline()
  }


  color_setup() {
    this.alpharect = 0.6

    // blue + green
    this.coltype1 = '0x5A63EC'
    this.coltype1_light = '0xA9D7E1'
    this.coltype2 = '0x239B56'
    this.coltype2_light = '0xD1F2EB'

    // blue + yellow
    this.coltype1 = '0x5A63EC'
    this.coltype1_light = '0xA9D7E1'
    this.coltype2 = '0xF1948A'
    this.coltype2_light = '0xFADBD8'



    this.col = this.coltype1 //Phaser.Display.Color.GetColor(20, 50, 200)
    if (this.type == 'low') this.col = this.coltype1_light //Phaser.Display.Color.GetColor(150, 150, 200)

    if (this.modtype == 'tf') {
      // greenish
      this.col = this.coltype2
      if (this.type == 'low') this.col = this.coltype2_light 
    }

    // oerrides tf and reg when singlecontainer is on
    if (p5D.singlecontainer == true) {
      let st = this.modelid
      let intid = parseInt(st[st.length - 1])
      if (this.index % 2 == 0) {
        this.col = this.coltype1 //blueish
        // if (this.type == 'low') this.col = '0xA9D7E1'
      } else {
        this.col = this.coltype2 // greenish
        // if (this.type == 'low') this.col = '0xD1F2EB' //'0x82E0AA' 
      }
    }

    this.hovercol = '0xE0523E' // redish pale
    this.hovercol = '0xFF1ECF' // pink
    this.hovercol = '0x1EFF54' // green
    // this.clickedcol = '0xE1E1E1' //  white
    // this.clickedcol = '0x000000' // black
    this.clickedcol = this.hovercol
    this.linecol = '0X000'
  }

  // not using
  add_container() {
    let scene = p5D.scene
    // let cshape = this.cells.map((c) => c.shape)
    this.graphics = scene.add.graphics().setInteractive()
    this.graphics.clear();
    this.graphics.lineStyle(2, 0xff0000);
    this.graphics.strokeRectShape(this.container.getBounds());
  }


  get_numfeatures(){
    let modobj = p5D.modman.modschemalist[this.modtype][this.modelid]['modobj']
    return modobj['hyperparams']['num_features']
  }

  showline() {
    let scene = p5D.scene
    let numfeats = this.get_numfeatures()
    let maxfeatlen = p5D.datast.data.columns.length
    let linelen = +Math.floor(numfeats/maxfeatlen *(this.cells.length - 1))
    // console.log('line num feats ', numfeats, this.modtype, this.modelid)
    // let linelen = Math.floor(Math.random() * this.cells.length - 1)
    if (linelen <= 0) linelen = 1
    if (linelen > this.cells.length - 1) linelen = this.cells.length - 1
    let sx = this.cells[0].shape.x - this.cells[0].shape.width * 0.5,
      sy = this.cells[0].shape.y,
      ex = this.cells[linelen].shape.x + this.cells[0].shape.width * 0.5,
      ey = this.cells[linelen].shape.y,
      ht = this.cells[0].shape.height * 0.85
    let xpos = sx + (ex - sx) * 0.5
    let ypos = sy + (ey - sy) * 0.5
    let wid = (ex - sx)
    let linemarker = scene.add.line(0, 0, xpos, ypos, xpos + wid, ypos)
    linemarker.setStrokeStyle(2,this.linecol, 1)
    linemarker.setLineWidth(2, 2);
    linemarker.name ='linefeature'
    linemarker.modtype = this.modtype

    this.container.add(linemarker)

  }

  // func that renders the rounded rects representing models !!! 
  showrect() {
    let scene = p5D.scene
    let sx = this.cells[0].shape.x - this.cells[0].shape.width * 0.5,
      sy = this.cells[0].shape.y,
      ex = this.cells.slice(-1)[0].shape.x + this.cells[0].shape.width * 0.5,
      ey = this.cells.slice(-1)[0].shape.y,
      ht = this.cells[0].shape.height * 0.85

    // let col = Phaser.Display.Color.GetColor(20, 200, 120)
    let shapegrid = scene.add.rexRoundRectangle(sx + (ex - sx) * 0.5, sy + (ey - sy) * 0.5, (ex - sx), ht, 2, this.col).setInteractive()
    shapegrid.setFillStyle(this.col, this.alpharect);
    shapegrid.setStrokeStyle(1, this.col, 1);
    shapegrid.name = 'modelrect'
    shapegrid.modtype = this.modtype;
    shapegrid.styleobj = {
      'col': this.col,
      'hovercol': this.hovercol,
      'alpha': this.alpharect,
      'clickedcol': this.clickedcol
    }

    let hpobj = this.modeldata['hyperparams']
    let metobj = this.modeldata['model_metrics_test']

    if (hpobj == null) {
      hpobj = {
        'learning_rate': +Math.random().toFixed(3),
        'drop_out': +Math.random().toFixed(2),
        'hidden_layers': +Math.floor(Math.random() * 10) + 2,
        'algorithm': 'sgd'
      }
    }

    if (metobj == null) {
      metobj = {
        'accuracy': +Math.random().toFixed(4) + 0.1,
        'precision': +Math.random().toFixed(4) + 0.1,
        'residual_score': +Math.random().toFixed(4) + 0.1,
        'R2': +Math.random().toFixed(4) + 0.1,
      }
    }

    let famfound = this.modtype
    if(p5D.singlecontainer == true){
      if(this.index % 2 == 0){
        //tf
        famfound = 'reg'
      }else{
        famfound = 'tf'
      }
    }

    shapegrid.dataobj = {
      'type_hilow': this.type,
      'type': famfound,
      'hyperparams': hpobj,
      'model_metrics': metobj,
      'modelid': this.modelid,
      // 'rank': this.modeldata['rank'],
      'rankscore': this.modeldata['rankscore'],
      'index': this.index

    }

    this.rectobj = shapegrid
    if (this.container) this.container.add(shapegrid)
  }

  showcir() {
    let scene = p5D.scene,
      cells = this.cells
    cells.forEach((c, i) => {
      let cl = c.shape,
        // x = cl.x + p5D.bodcontainerlist["reg"].x,
        // y = cl.y + p5D.bodcontainerlist["reg"].y
        x = cl.x,
        y = cl.y
      let md = scene.add.circle(x, y, this.r, this.col)
      if (this.container) this.container.add(md)
      md.setFillStyle(this.col, 0.2);
      md.setStrokeStyle(this.strokewid, this.col, 1);
      // scene.input.setDraggable(this.circleboid);
      this.modshapelist.push(md)
    });
  }

}