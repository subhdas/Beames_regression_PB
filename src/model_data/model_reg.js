class RegModel {
  constructor(id, type = 0) {
    let createnewdata = true
    this.type = type
    this.hyperparams = {
      'gainFunction': 'gini',
      'maxDepth': Math.floor(random(0, 1) * 15),
      'minNumSamples': Math.floor(random(0, 1) * 25)
    }
    console.log('REGULAR MODEL CONSTR BEGINS .......................... ', id)
    this.results = null;
    this.id = id
    this.modelnameopt = ['linear_reg', 'bayesian_reg', 'ridge_reg', 'nn_reg', 'randomforest_reg', 'gradient_boost_reg']
    // this.build_model_mljs(); // MLjs is exported as ML
    let numvars = Math.floor(random(0, 1) * 10)

    this.nummod = 0
    this.colsuse = p5D.datast.get_topcolumns(numvars, 'variance', true)
    if (createnewdata) p5D.tfdata = new TFData(p5D.datast.data, p5D.targetcol, p5D.colremove, this.colsuse)
    this.build_model_machinelearnjs();
    this.build_results();
    // this.add_boid(); // COMMENTED
  }


  get_data() {
    let {
      xTrain,
      xTest,
      yTrain,
      yTest
    } = p5D.tfdata.dataobject;
    // console.log('IN REG MODEL DATA ', this.id, xTrain, xTest, yTrain, yTest)
    return [xTrain.slice(0), xTest.slice(0), yTrain.slice(0), yTest.slice(0)]
  }

  get_dummydata() {
    let numpt = 500,
      numvars = 30
    var x = new Array(numpt).fill();
    var y = new Array(numpt).fill();
    var val = 0.0;
    x = Array.from(x, (el, i) => {
      y[i] = random(0, 100)
      let arr = new Array(numvars).fill()
      return Array.from(arr, (d) => random(0, 20))
    });
    return [x, x, y, y]
  }

  // makes results object for a regression model
  build_results() {
    let obj = {},
      ind = floor(random(0, 1) * 5);
    obj['r2_score'] = random(0, 1.0);
    obj['rmse'] = random(100, 1000);
    obj['name'] = this.modelnameopt[ind]
    obj['id'] = this.id
    obj['colsuse'] = this.colsuse
    this.results = obj
  }

  splice_data(xTrain, xTest, yTrain, yTest, num = 400, numvar = 50) {
    xTrain = xTrain.slice(0).splice(0, num)
    xTest = xTest.slice(0).splice(0, numvar)
    yTrain = yTrain.slice(0).splice(0, num)
    yTest = yTest.slice(0).splice(0, numvar)
    return [xTrain, xTest, yTrain, yTest]
  }

  // working model using machinelearn js: using now ---- >
  build_model_machinelearnjs() {
    const {
      SGDRegressor
    } = ml.linear_model;
    const {
      mean_squared_error
    } = ml.metrics
    console.log(' ')
    let config = {
      'epochs': 100,
      'learning_rate': 0.0001,
      'reg_factor.l1': 0.1,
      'reg_factor.l2': 0.2
    }
    const reg = new SGDRegressor(config);

    let [xTrain, xTest, yTrain, yTest] = this.get_data();
    // let [xTrain, xTest, yTrain, yTest] = this.get_dummydata();
    // [xTrain, xTest, yTrain, yTest] = this.splice_data(xTrain, xTest, yTrain, yTest)
    // console.log('++++ check x and y in reg model ', xTrain, yTrain)
    p5D.x = xTrain, p5D.y = yTrain
    reg.fit(xTrain, yTrain);
    var yhat = reg.predict(xTrain);
    let mse = mean_squared_error(yTrain, yhat)
    console.log(' REG MODEL DONE:  machine learn JS estimates are ', this.id, mse)
    this.trigger_gobalupdate();
    // var modely = jStat.models.ols(yTrain, xTrain);
    // var modelyhat = jStat.models.ols(yhat, xTrain);
    // console.log(' ### machine learn JS y hat R2 found ', this.id, modelyhat.R2)
  }


  trigger_gobalupdate() {
    let maxmodels = 2
    p5D.modelCounterReg += 1
    if (p5D.modelCounterReg > maxmodels) {
      this.nummod = maxmodels // p5D.modman.modellist.length
      p5D.modelCounterReg = 0
      // hack solution for demo
      if (this.type == 0) p5D.bodcontainerlist['reg'].fill_models(this.nummod);
      else p5D.bodcontainerlist['tf'].fill_models(this.nummod);
      console.log('TRIGGERED VIS FROM REG MODEL ', this.nummod)
    }
  }

  //not using now
  r2_score() {
    lr['r2'] = Math.pow((n * sum_xy - sum_x * sum_y) / Math.sqrt((n * sum_xx - sum_x * sum_x) * (n * sum_yy - sum_y * sum_y)), 2);
  }
  // not using now : prev used, now not needed ---- >
  add_boid() {
    let config = {
      'scene': p5D.scene,
      // 'x': random(p5D.wid * 0.7, p5D.wid * 0.8),
      // 'y': random(p5D.ht * 0.4, p5D.ht * 0.6),
      'x': random(p5D.wid * 0.05, p5D.wid * 0.2),
      'y': random(p5D.ht * 0.05, p5D.ht * 0.2),
      'modresults': this.results,
      'attractor': p5D.attlist[0],
      'modtype': 'reg'
    }
    p5D.boids.push(new Boid(config));
  }

  async build_wrapper() {
    await this.build_model_mljs()
  }

  // works but it iis slow
  build_model_mljs() {
    let num_datapt = 50
    const {
      DecisionTreeRegression
    } = ML
    // let [xTrain, xTest, yTrain, yTest] = this.get_data();
    let [xTrain, xTest, yTrain, yTest] = this.get_dummydata();

    console.log('++++ check x and y in reg model ', xTrain, yTrain)
    p5D.x = xTrain, p5D.y = yTrain
    const treeoptions = {
      gainFunction: this.hyperparams['gainFunction'],
      maxDepth: this.hyperparams['maxDepth'],
      minNumSamples: this.hyperparams['minNumSamples']
    };
    var reg = new DecisionTreeRegression(treeoptions);
    reg.train(xTrain, yTrain);
    var yhat = reg.predict(xTrain);
    console.log('### MLJS estimates are ', yTrain, yhat)

    var modely = jStat.models.ols(yTrain, xTrain);
    var modelyhat = jStat.models.ols(yhat, xTrain);
    console.log('y hat R2 found ', this.id, modely.R2, modelyhat.R2)
  }
}