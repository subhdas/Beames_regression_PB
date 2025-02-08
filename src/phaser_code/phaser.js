/*
FUNCTION TO INSTANTIATE PHASER JS LIFECYLCE FUNCS  ===========================================================================================================
*/
function setup_phaser() {
  let width = p5D.wid,
    height = p5D.ht
  var config = {
    type: Phaser.AUTO,
    width: width,
    height: height,
    parent: "sketchbar",
    backgroundColor: '#3E3E3E',
    physics: {
      default: "arcade",
      arcade: {
        gravity: {
          y: 200
        }
      }
    },
    scene: {
      preload: preload,
      create: create,
      update: update
    }
  };
  var self = {};
  self.game = new Phaser.Game(config);

  /**
   * manages the page UI buttons menus etc.
   */
  p5D.manageUI = function () {
    p5D.sketchhead = new SketchHeader();
    p5D.controlinp = new ControlInput('dropdowndivclass', 'controlinpWrap');

    setTimeout(() => {
      p5D.wrkSel = new WorkflowSelector();
    }, 200);
  }

  p5D.resetUI = function () {
    $('.sidebar').empty();
    $('.detailbar').empty();
    // p5D.controlinp = new ControlInput('dropdowndivclass', 'controlinpWrap');
    $('.tooltipcontainer').remove();
    p5D.modman.modelcounter = 0
     for (let item in p5D.bodcontainerlist) {
       p5D.bodcontainerlist[item].destroy_modelgeom();
     }
  }


  p5D.gen_visualizations = function () {
    p5D.spin.showSpinnerPromise('analysing models ... ').then((d) => {
      p5D.modcompvis = new ModCompareManagerVis();
      //add correlation with target variable
      p5D.featman = new FeatureManagerVis();
      // p5D.modline = new ModRegLine(p5D.datast);   
      p5D.TTLineVis = new TrainTestLineVis('detailbar')
      console.log('spinner hidden in gen vis')
      p5D.spin.hideSpinner();

      p5D.controlinp.renderform();

      // let nummod1 = p5D.bodcontainerlist['tf'].modeldraw_obj.length * 2
      // let nummod2 = p5D.bodcontainerlist['reg'].modeldraw_obj.length * 2

      let nummod1 = Object.keys(p5D.modman.modschemalist['tf']).length
      let nummod2 = Object.keys(p5D.modman.modschemalist['reg']).length
      p5D.sketchhead.update_nummod_text(`${nummod1} Models`, 'tf')
      p5D.sketchhead.update_nummod_text(`${nummod2} Models`, 'reg')

      p5D.modman.modeliteration += 1

    }).catch(e => {
      console.log('ERRORED ON SPIN PROMISE ', e)
    })


  }

  function preload() {
    // to load rounded rects
    this.load.plugin('rexroundrectangleplugin', 'https://raw.githubusercontent.com/rexrainbow/phaser3-rex-notes/master/dist/rexroundrectangleplugin.min.js', true);

    p5D.singlecontainer = false;
    p5D.manageUI()
    p5D.scene = this
    console.log(' CHECK p5D in PHASER PRELOAD .. ', p5D)

    container_setup();
    console.log('done preloading ..... ')
  }

  p5D.singlecontainersetup = function () {
    let config = {
      'scene': p5D.scene,
      'x': 0,
      'y': 0,
      'modtype': 'tf'
    }

    let wid = p5D.scene.game.canvas.width * 0.98 // 500
    let ht = p5D.scene.game.canvas.height * 0.95 // 500
    config['wid'] = wid
    config['ht'] = ht
    p5D.bodcontainerlist[config['modtype']] = new ContainterGrid(config)
  }

  p5D.multicontainersetup = function () {
    p5D.attlist = []
    //add attractors
    for (let i = 0; i < 1; i++) {
      // p5D.attlist.push(new Attractor(width * 0.5, height * 0.5))
    }
    let config = {
      'scene': p5D.scene,
      'x': 0,
      'y': 0,
      'modtype': 'tf'
    }
    setTimeout(() => {
      config['modtype'] = 'tf'
      p5D.bodcontainerlist[config['modtype']] = new ContainterGrid(config)
    }, 50);
    setTimeout(() => {
      config['modtype'] = 'reg'
      p5D.bodcontainerlist[config['modtype']] = new ContainterGrid(config)
    }, 50)
  }

  p5D.cleanup_containers = function () {
    p5D.bodcontainerlist = {}
    let c = p5D.scene.children.list.filter(f => {
      return f.type == 'Container'
    })
    c.forEach(k => k.destroy())

    // remove the rectangles
    let g = p5D.scene.children.list.filter(f => {
      return f.type == 'Graphics' || f.type == 'Line'
    })
    g.forEach(k => k.destroy())


  }

  function container_setup() {

    // creates the model manager and also the model data schema that stores all the model data
    p5D.modman = new ModelManager();

    if (p5D.singlecontainer == true) {
      console.log('SETTING UP SINGLE CONTAINER ... ', p5D.singlecontainer)
      p5D.singlecontainersetup();
    } else {
      p5D.multicontainersetup()
    }


  }


  // setup code
  function create() {
    console.log(' what is scene ', this)
    stats = new Stats();
    // stats.showPanel(0); // 0: fps, 1: ms, 2: mb, 3+: custom
    // document.body.appendChild(stats.dom);
    //
    // // PREP OTHER VISUALIZATIONS ==============================================
    // gen_visualizations()
    p5D.spin.hideSpinner()


    // p5D.modelcounter = 0
    // p5D.genmodel = true
    // p5D.trainmodelgo = false
    // setTimeout(() => {
    //   p5D.trainmodelgo = true
    // }, 100);


  }




  // draw function
  function update() {
    stats.begin();
    //   // gen and raw model vis without orig models being trained--- >
    if (p5D.modman.genmodel == true) p5D.modman.gendraw_newmodels();
    //train orig models --- >
    if (p5D.modman.trainmodelgo == true) p5D.modman.train_realmodels_sim(5)
    // if (p5D.modman.trainmodelgo == true) p5D.modman.train_realmodels()

    stats.end();
  }
}