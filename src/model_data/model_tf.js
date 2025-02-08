/*
CLASS TO PREP THE DATA FOR A TENSORFLOW JS MODEL  =======================================================================================
*/
class TFData {
  constructor(data = null, targetcol = "", colrem = [], colsuse = null) {
    this.colremove = colrem
    this.targetcol = targetcol
    this.data = this.removecol_data(data)
    this.cols = colsuse
    if (!this.cols) this.cols = this.get_topcols(this.data)
    // else console.log('USING GIVEN COLS ', this.cols)
    this.updatedata_byfeatures(this.cols)
    this.dataobject = this.data_prep();
  }


  get_topcols(data) {
    let numvars = 5
    return p5D.datast.get_topcolumns(numvars, 'variance', true)
  }

  removecol_data(data) {
    return data.map((row, i) => {
      Object.keys(row).forEach((el, j) => {
        if (this.colremove.indexOf(el) != -1) delete row[el]
      })
      return row
    })
  }


  updatedata_byfeatures(features = ['abtest', 'vehicle type', 'postal code']) {
    let data = this.data,
      dataNew = []
    if (features != null && features.length > 0) {
      data.forEach((row, i) => {
        let obj = {}
        Object.keys(row).forEach((d, i) => {
          if (features.indexOf(d) != -1) {
            obj[d] = row[d]
          }
        });
        dataNew.push(obj);
      });
      this.data = dataNew.slice(0);
    }
    // console.log(' in tf updated features ', features, this.data)
  }

  data_prep() {
    let data = this.data
    const features = Object.keys(data[0])
    const categoricalFeatures = new Set(features.filter((f) => {
      return p5D.datast.colinfo[f]['dtype'] == 'categorical'
    }))
    // console.log(' STARTING TF DATA PREP ... categorical features and data .. ', categoricalFeatures, data)
    const [xTrain, xTest, yTrain, yTest, X_d, Y_d, XT_d, YT_d] = this.create_tfdataobj(data, features, categoricalFeatures, 0.1);
    const obj = {
      'xTrain_tf': xTrain,
      'xTest_tf': xTest,
      'yTrain_tf': yTrain,
      'yTest_tf': yTest,
      'xTrain': X_d,
      'xTest': XT_d,
      'yTrain': Y_d,
      'yTest': YT_d
    }
    // console.log('DATA PREP DONE IN TFDATA ', obj, this.data)
    return obj
  }

  create_tfdataobj(data, features, categoricalFeatures, testSize) {
    let colinfo = p5D.datast.colinfo;
    // console.log('creating data set ', data)
    const oneHot = (val, categoryCount) =>
      Array.from(tf.oneHot(val, categoryCount).dataSync());
    // normalized = (value − min_value) / (max_value − min_value)
    const normalize = tensor =>
      tf.div(
        tf.sub(tensor, tf.min(tensor)),
        tf.sub(tf.max(tensor), tf.min(tensor))
      );

    let X_d = data.map((r, i) =>
      features.flatMap(f => {
        if (categoricalFeatures.has(f)) {
          return oneHot(!r[f] ? 0 : colinfo[f]['uniquevals'].indexOf(r[f]), colinfo[f]['uniquevals'].length);
        }
        return !r[f] ? 0 : r[f];
      })
    );
    // console.log(' lets check Xd ', X_d)
    let Y_d = data.map(r => (!r[this.targetcol] ? 0 : r[this.targetcol]))
    const X_t = normalize(tf.tensor2d(X_d));
    const y = tf.tensor(Y_d);
    const splitIdx = parseInt((1 - testSize) * data.length, 10);

    const [xTrain, xTest] = tf.split(X_t, [splitIdx, data.length - splitIdx]);
    const [yTrain, yTest] = tf.split(y, [splitIdx, data.length - splitIdx]);

    X_d = xTrain.arraySync()
    Y_d = yTrain.arraySync()
    let XT_d = xTest.arraySync()
    let YT_d = yTest.arraySync()
    // console.log('++ tf Xd and Yd are ', X_d, Y_d, XT_d, YT_d);
    // console.log('++ tf Xd and Yd are ', xTrain, xTest, yTrain, yTest);
    return [xTrain, xTest, yTrain, yTest, X_d, Y_d, XT_d, YT_d];
  };
}

/*
CLASS TO MODEL A TENSFLOW JS LINEAR REGRESSION MODEL =======================================================================================
*/
class TFModel {
  constructor(id) {
    let createnewdata = true
    this.hyperparams = {
      'activation': 'sigmoid',
      'loss': 'meanSquaredError',
      'batchsize': Math.floor(random(16,96)),
      'epochs': Math.floor(random(0,1)*10),
      'shuffle': true,
      'split': Math.floor(random(0,0.4))
    }
    this.results = null;
    this.id = id
    this.nummod = 0
    // this.data = data
    // this.colremove = colrem
    // this.targetcol = targetcol
    this.modelname = 'TF_LinearRegression'
    this.trainmetricobj = []
    let numvars = Math.floor(random(0, 1) * 10)
    this.colsuse = p5D.datast.get_topcolumns(numvars, 'variance', true)
    if (createnewdata) p5D.tfdata = new TFData(p5D.datast.data, p5D.targetcol, p5D.colremove, this.colsuse)
    this.model_pipeline()
  }

  // src = https://codesandbox.io/s/linear-regression-with-tensorflow-js-vorgf?file=/src/index.js
  // src = https://www.curiousily.com/posts/predicting-house-prices-using-linear-regression-with-tensorflow-js/
  async model_pipeline() {
    // tf.engine().startScope()
    const {
      xTrain_tf,
      xTest_tf,
      yTrain_tf,
      yTest_tf
    } = p5D.tfdata.dataobject

    // console.log('++ inside model x and y are ', xTrain_tf, xTest_tf, yTrain_tf, yTest_tf);
    const linearModel = await this.train_linearmodel(xTrain_tf, yTrain_tf);
    // const trueValues = yTest.dataSync();
    tf.tidy(() => {
      const lmPreds = linearModel.predict(xTest_tf).dataSync();
    })
    tf.dispose(xTrain_tf)
    tf.dispose(xTest_tf)
    tf.dispose(yTrain_tf)
    tf.dispose(yTest_tf)

    this.build_results();
    // this.add_boid(); // COMMENTED
    console.log('TF -> DONE MODEL PIPELINE ALL STEPS ---------------------------')
    this.trigger_gobalupdate();
    // tf.engine().endScope()
  } // end of model pipeline

   trigger_gobalupdate() {
     let maxmodels = 2
     p5D.modelCounterTf += 1
     if (p5D.modelCounterTf > maxmodels) {
       this.nummod = maxmodels //p5D.modman.modellist.length
       p5D.modelCounterTf = 0
       p5D.bodcontainerlist['tf'].fill_models(this.nummod);
       console.log('TRIGGERED VIS FROM TF MODEL -- ', this.nummod)
     }
   }


  async train_linearmodel(xTrain, yTrain) {
    console.log('--- > TENSORFLOW MODEL BEGINS CONSTR ... ')

    const model = tf.sequential();

    //input layer
    model.add(
      tf.layers.dense({
        inputShape: [xTrain.shape[1]],
        units: xTrain.shape[1],
        activation: this.hyperparams['activation']
      })
    );
    //output layer
    model.add(tf.layers.dense({
      units: 1
    }));

    model.compile({
      optimizer: tf.train.sgd(0.001),
      loss: this.hyperparams['loss'],
      metrics: [tf.metrics.meanAbsoluteError]
    });

    const trainLogs = [];
    const lossContainer = document.getElementById("loss-cont");
    const accContainer = document.getElementById("acc-cont");

    await model.fit(xTrain, yTrain, {
      verbose: 2,
      batchSize: this.hyperparams['batchsize'],
      epochs: this.hyperparams['epochs'],
      shuffle: this.hyperparams['shuffle'],
      validationSplit: this.hyperparams['split'],
      callbacks: {
        onEpochEnd: async(epoch, logs) => {
          // console.log('Metric per epoch, RMSE: ', epoch, Math.sqrt(logs.loss), ' =============================== ')
          trainLogs.push({
            rmse: Math.sqrt(logs.loss),
            val_rmse: Math.sqrt(logs.val_loss),
            mae: logs.meanAbsoluteError,
            val_mae: logs.val_meanAbsoluteError
          });
          // tfvis.show.history(lossContainer, trainLogs, ["rmse", "val_rmse"]);
          // tfvis.show.history(accContainer, trainLogs, ["mae", "val_mae"]);
        }
      }
    });
    tf.dispose(xTrain)
    tf.dispose(yTrain)
    console.log('finished training model tf')
    this.trainmetricobj = trainLogs
    return model;
  } // end of train_linearmodel

  // prev used, now do not use this ------
  add_boid() {
    let config = {
      'scene': p5D.scene,
      // 'x': random(p5D.wid * 0.2, p5D.wid * 0.3),
      // 'y': random(p5D.ht * 0.4, p5D.ht * 0.6),
      'x': random(p5D.wid * 0.01, p5D.wid * 0.3),
      'y': random(p5D.ht * 0.02, p5D.ht * 0.4),
      'modresults': this.results,
      'attractor': p5D.attlist[0],
      'modtype': 'tf'
    }
    p5D.boids.push(new Boid(config));
  }

  build_results() {
    let metric = this.trainmetricobj.pop(),
      obj = {}
    if (metric) {
      obj['r2_score'] = random(0, 1.0);
      obj['rmse'] = metric['rmse'] //random(100, 1000);
      obj['mae'] = metric['mae']
      obj['name'] = this.modelname
      obj['id'] = this.id
      obj['colsuse'] = this.colsuse
    }
    this.results = obj
  }
}
