/*
GLOBAL VARS   ===========================================================================================================
*/
let p5D = {}
p5D.boids = [],
  p5D.attlist = [], p5D.bodcontainerlist = {},
  p5D.modellist = [], p5D.trials = 0,
  // p5D.num_models = 16, 
  p5D.MAXITER = 300,
  p5D.modelCounterReg = 0,
  p5D.modelCounterTf = 0



p5D.wid = 1200, p5D.ht = 500
p5D.tfdata = null

let stats = null;

function set_data() {
  // college data
  p5D.csvpath = './data/college_model.csv'
  p5D.targetcol = 'score' // college
  p5D.colremove = ['institution', 'world_rank']

  // movie data
  // p5D.csvpath = './data/movie_model.csv'
  // p5D.targetcol = 'imdb_score' // movie
  // p5D.colremove = ['color', 'director_name', 'actor_2_name', 'genres', 'actor_1_name', 'movie_title', 'actor_3_name', 'plot_keywords', 'd3mIndex']
  
  // auto data
  // p5D.csvpath = './data/autos_model.csv'
  // p5D.targetcol = 'price' // auto
  // p5D.colremove = ['car name', 'model', 'd3mIndex']

  // cancer mortality data
  p5D.csvpath = './data/cancer_reg.csv'
  p5D.targetcol = 'TARGET_deathRate' // auto
  p5D.colremove = ['PctSomeCol18_24', 'PctUnemployed16_Over', 'PctPrivateCoverageAlone']


  // financial data 2015_Financial_Data.csv
  // p5D.csvpath = './data/2015_Financial_Data.csv'
  // p5D.targetcol = 'Price_Variation' // auto
  // p5D.colremove = ['PTB ratio', 'R&D to Revenue', 'Class']
}

/*
FUNCTIONS TO LOAD P5JS FUNS ===========================================================================================================
*/
function preload() {
  (async function dothis() {
    p5D.spin = new Spinner();
    p5D.spin.showSpinner('lets wait a bit ... ')
    set_data()
    p5D.datast = new DataStore(p5D.csvpath, p5D.targetcol)
    await p5D.datast.data_operations();
    p5D.tfdata = new TFData(p5D.datast.data, p5D.targetcol, p5D.colremove)
    console.log('data in store length ', p5D.datast.data.length, p5D.datast, p5D.tfdata)

    p5D.wid = $('#sketchbar').width()
    setup_phaser();
  })()
}

function setup() {}