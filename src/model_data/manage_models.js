class ModelManager {
    constructor() {
        this.modellist = []
        this.num_models_trainmode = 20
        this.topkmodel_num = 30
        this.trainmodelgo = false
        this.genmodel = false
        this.modelcounter = 0
        this.modeliteration = 0
        this.maxval_allmods = -1
        this.main_metric = 'rmse'

        this.nummodelpergen = 4
        this.highlightedmodel_id = -1
        this.highlighted_modtype = ''

        this.modelcolors = {
            'tf': '#F1948A',
            'reg': '#5A63EC'
        }

        this.lastmodelid_dict = {
            'tf': 0,
            'reg': 1000
        }

        if (p5D.singlecontainer == true) {
            this.modschemalist = {
                'combo': {},
                'tf': {},
                'reg': {}
            }
        } else {
            this.modschemalist = {
                'tf': {},
                'reg': {}
            }
        }
        this.SIM = new SimulateModel()
        this.OMS = new OperationsModelSchema();
    }

    // train new models
    train_realmodels() {
        //add boids
        if (this.modellist.length < this.num_models_trainmode && true) {
            let toss = random(0, 1)
            // let toss2 = random(0, 1)
            // if (toss2 < toss) toss = toss2
            if (toss < 0.5 && true) {
                this.modellist.push(new RegModel(this.modelcounter));
                p5D.sketchhead.spinners['reg'].showSpinner();
            } else {
                // this.modellist.push(new TFModel(this.modelcounter));
                this.modellist.push(new RegModel(this.modelcounter, 1));
                p5D.sketchhead.spinners['tf'].showSpinner();
            }
            this.modelcounter++
            console.log('TRAINING NEW MODEL  .. ', this.modelcounter, toss)
        } else {
            this.trainmodelgo = false
            console.log('FROM PHASER => TRAINING DONE ... -->')
            p5D.sketchhead.spinners['reg'].hideSpinner();
            p5D.sketchhead.spinners['tf'].hideSpinner();
        }
    }

    // used to simulate loading of pretrained models 
    train_realmodels_sim(num = 0) {

        if (this.modelcounter > num) {
            this.trainmodelgo = false
            console.log('TRAIN MODEL SIM STOPPED .... ', this.maxval_allmods)
            p5D.gen_visualizations();
            p5D.sketchhead.spinners['reg'].hideSpinner();
            p5D.sketchhead.spinners['tf'].hideSpinner();
            return
        }
        if (this.trainmodelgo) {
            p5D.sketchhead.spinners['reg'].showSpinner();
            p5D.sketchhead.spinners['tf'].showSpinner();


            console.log('in train mods sim ', p5D.modman)
            // first gen model data for both
            for (let item in p5D.bodcontainerlist) {
                let nummod = this.nummodelpergen //Math.floor(Math.random() * 75 + 25)
                // fillin mod schema list here
                let lastmodelid = -1,
                    addon = 0
                new Array(nummod)
                    .fill(null)
                    .forEach((f, m) => {
                        let idval = this.lastmodelid_dict[item] + m
                        // let idnum = +m + lastmodelid
                        console.log('xxx model id ', idval, this.lastmodelid_dict, item)
                        let id = 'model_' + idval
                        let modschem = new ModelDataSchema(id, item)
                        this.modschemalist[item][id] = modschem
                        lastmodelid = idval
                    })

                // this.lastmodelid_dict[item] = lastmodelid
                this.lastmodelid_dict[item] += nummod
                addon = nummod
            }

            // calc max mainmetric val both model types
            Object.keys(this.modschemalist).forEach((ms) => {
                let schemalist = this.modschemalist[ms]
                Object.keys(schemalist).forEach((mods) => {
                    let val = schemalist[mods]['modobj']['model_metrics_test'][this.main_metric]
                    if (this.maxval_allmods < val) this.maxval_allmods = val
                })
            })

            // rank the models
            this.OMS.calc_model_rankscore(this.modschemalist, this.maxval_allmods);

            try {
                this.topkmodelsobj = this.OMS.query_topkmodels(this.topkmodel_num)
            } catch (e) {
                console.log('ERRORED FINDING TOP K MODLS .. ', e)
            }

            // draw/render the models
            for (let item in p5D.bodcontainerlist) {
                //nummod of no use
                let nummod = 0 //Object.keys(this.modschemalist[item]).length
                p5D.bodcontainerlist[item].fill_models(nummod)
            }
            this.modelcounter += 1
            this.update_num_mod_txt();
        }
        this.trainmodelgo = false
        setTimeout(() => {
            this.trainmodelgo = true
        }, 3000);
    }

    // used to load pretrained models
    gendraw_newmodels(num = 0) {
        if (this.genmodel) {
            console.log('in gen mods ', p5D.modman)
            // first gen model data for both
            let lastmodelid = 0
            for (let item in p5D.bodcontainerlist) {
                let nummod = 20 * this.nummodelpergen //Math.floor(Math.random() * 75 + 25)
                // fillin mod schema list here
                new Array(nummod)
                    .fill(null)
                    .forEach((f, m) => {
                        let idnum = +m + lastmodelid
                        let id = 'model_' + idnum
                        let modschem = new ModelDataSchema(id, item)
                        this.modschemalist[item][id] = modschem
                    })
                lastmodelid = nummod
            }

            // calc max rmmain metric se val both model types
            Object.keys(this.modschemalist).forEach((ms) => {
                let schemalist = this.modschemalist[ms]
                Object.keys(schemalist).forEach((mods) => {
                    let val = schemalist[mods]['modobj']['model_metrics_test'][this.main_metric]
                    if (this.maxval_allmods < val) this.maxval_allmods = val
                })
            })

            // rank the models
            this.OMS.calc_model_rankscore(this.modschemalist, this.maxval_allmods);

            try {
                this.topkmodelsobj = this.OMS.query_topkmodels(this.topkmodel_num)
            } catch (e) {
                console.log('ERRORED FINDING TOP K MODLS .. ', e)
            }


            // draw/render the models
            for (let item in p5D.bodcontainerlist) {
                let nummod = Object.keys(this.modschemalist[item]).length
                p5D.bodcontainerlist[item].fill_models(nummod)
            }

        }
        this.genmodel = false
        console.log('GEN MODEL STOPPED .... ', this.maxval_allmods)

    }

    update_num_mod_txt() {
        let nummod1 = Object.keys(p5D.modman.modschemalist['tf']).length
        let nummod2 = Object.keys(p5D.modman.modschemalist['reg']).length
        p5D.sketchhead.update_nummod_text(`${nummod1} Models`, 'tf')
        p5D.sketchhead.update_nummod_text(`${nummod2} Models`, 'reg')
    }


    get_recomm_models(numrecom = 5) {
        let obj = this.topkmodelsobj;
        let tfids = obj['tf']
        let regids = obj['reg']
        let allids = regids.concat(tfids)
        allids = p5D.datast.get_uniquevals(allids);
        allids = p5D.datast.shuffleArr(allids)
        let modidFinal = []
        new Array(numrecom).fill(null).forEach((m, i) => {
            modidFinal.push(allids[i])
        })

        return modidFinal

    }

    // for radial bar vis
    get_topmodeldata(type = 'Training Set') {
        let obj = this.topkmodelsobj;
        let tfids = obj['tf']
        let regids = obj['reg']

        let iterobj = regids
        if (tfids.length < regids.length) iterobj = tfids
        let newdata = []
        iterobj.forEach((t, i) => {
            let tf_rmse = p5D.modman.modschemalist['tf'][tfids[i]]['modobj']['model_metrics_test']['rmse']
            let reg_rmse = p5D.modman.modschemalist['reg'][regids[i]]['modobj']['model_metrics_test']['rmse']
            if (type == 'Training Set') {
                tf_rmse = p5D.modman.modschemalist['tf'][tfids[i]]['modobj']['model_metrics_train']['rmse']
                reg_rmse = p5D.modman.modschemalist['reg'][regids[i]]['modobj']['model_metrics_train']['rmse']
            }
            //invert rmse
            let maxval = Math.max(reg_rmse, tf_rmse)
            reg_rmse = 2 * maxval - reg_rmse
            tf_rmse = 2 * maxval - tf_rmse

            let obj = {
                id: i,
                reg: +reg_rmse.toFixed(3),
                tf: +tf_rmse.toFixed(3),
                tfid: tfids[i],
                regid: regids[i]
            }
            newdata.push(obj)
        })

        return newdata
    }

    // can be used by any calass
    get_specific_modeldata_radial(type = 'Training Set', modelid, modtype) {
        let othermodtype = 'reg'
        if (modtype == 'reg') othermodtype = 'tf'
        let othermodelid = Object.keys(p5D.modman.modschemalist[othermodtype])[0]
        let tf_rmse = p5D.modman.modschemalist[modtype][modelid]['modobj']['model_metrics_test']['rmse']
        let reg_rmse = p5D.modman.modschemalist[othermodtype][othermodelid]['modobj']['model_metrics_test']['rmse']
        if (type == 'Training Set') {
            tf_rmse = p5D.modman.modschemalist[modtype][modelid]['modobj']['model_metrics_train']['rmse']
            reg_rmse = p5D.modman.modschemalist[othermodtype][othermodelid]['modobj']['model_metrics_train']['rmse']
        }
        //invert rmse
        let maxval = Math.max(reg_rmse, tf_rmse)
        reg_rmse = 2 * maxval - reg_rmse
        tf_rmse = 2 * maxval - tf_rmse

        let out = {
            id: -1,
            reg: +reg_rmse.toFixed(3),
            tf: +tf_rmse.toFixed(3),
            tfid: modelid,
            regid: othermodelid
        }
        return out
    }

    // can be used by any calass
    get_specific_modeldata(modelid, modtype) {
        console.log(' instance ', modelid, modtype)
        let modobj = this.modschemalist[modtype][modelid]['modobj'];
        let predinst_train = modobj['pred_train']['pred_err_N']
        let predinst_test = modobj['pred_test']['pred_err_N']

        let predinst_train_org = modobj['pred_train']['pred_err']
        let predinst_test_org = modobj['pred_test']['pred_err']

        let predinst_org = predinst_train_org.concat(predinst_test_org)
        let predinst = predinst_train.concat(predinst_test)
        let out = {
            'modelid': modelid,
            'modtype': modtype,
            'pred_err_N': predinst,
            'pred_err': predinst_org
        }
        return out
    }

    // used by modellinevis
    get_instancevisdata(nummodels) {
        let obj = this.topkmodelsobj;
        let modinstobj = {}
        for (let item in this.modschemalist) {
            let modelidlist = obj[item].slice(0, nummodels * 0.5)
            modinstobj[item] = modelidlist.map((m, i) => {
                let modobj = this.modschemalist[item][m]['modobj']
                let predinst_train = modobj['pred_train']['pred_err_N']
                let predinst_test = modobj['pred_test']['pred_err_N']

                let predinst_train_org = modobj['pred_train']['pred_err']
                let predinst_test_org = modobj['pred_test']['pred_err']

                let predinst_org = predinst_train_org.concat(predinst_test_org)
                let predinst = predinst_train.concat(predinst_test)
                let obj = {
                    'modelid': modelidlist[i],
                    'modtype': item,
                    'pred_err_N': predinst,
                    'pred_err': predinst_org
                }
                return obj
            })
        }
        let finaldata = modinstobj['reg'].concat(modinstobj['tf'])
        finaldata = p5D.datast.shuffleArr(finaldata)
        console.log('instance bar final data ', finaldata)
        return finaldata
    }

    prep_histomodeldata(parobj) {
        let obj = this.topkmodelsobj,
            newdata = [],
            numbins = 6
        // arr = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
        for (let item in obj) {
            let modelidlist = obj[[item]] // item is tf or reg
            let paritemlist = parobj[item]
            let maxval = d3.max(paritemlist),
                minval = 0,
                sep = (maxval - minval) / numbins
            let arr = paritemlist.map((d, k) => {
                return k * sep
            })
            paritemlist.forEach((p, j) => {
                let modelid = modelidlist[j]
                let parvalue = p
                let parvalue_binned = p5D.datast.find_closest_frmarr(arr, p)
                // let r2score = +Math.random()
                let r2score = this.modschemalist[item][modelid]['modobj']['model_metrics_test']['R2']
                let obj = {
                    model_id: modelidlist[j],
                    bin_model_in: parvalue_binned,
                    mod_acc_bin: r2score,
                    bin_model_in_orig: parvalue,
                    modtype: item
                }
                newdata.push(obj)
            })
        }
        return newdata
    }


    get_histomodeldata(parname = 'learning_rate') {
        let obj = this.topkmodelsobj;
        let parobj = {}
        for (let item in this.modschemalist) {
            let models = this.modschemalist[item];
            let parvallist = []
            Object.keys(models).forEach((m, i) => {
                let modelidlist = obj[item]
                if (modelidlist.indexOf(m) != -1) {
                    let modobj = models[m]['modobj'];
                    parvallist.push(modobj['hyperparams'][parname])
                }
            })
            parobj[item] = parvallist
        }
        let datahisto = this.prep_histomodeldata(parobj)
        return datahisto
    }



}

/**
 * class that defines operations that can be 
 * done on modeldataschema objects
 */
class OperationsModelSchema {
    constructor() {

    }

    print_all_modschema() {
        this.print_modschema('train')
        this.print_modschema('test')
    }

    print_modschema(type = 'train') {
        console.log(' ++++++++++++++++++++++++++++++++++++++++ ')
        console.log('MODEL METRIC DATA FOR : ', type)
        let modschema = p5D.modman.modschemalist;
        Object.keys(modschema).forEach(f => {
            let schema = modschema[f]
            let rmselist = [],
                R2list = [],
                residlist = []
            console.log(' +++ STARTING : ', f)
            Object.keys(schema).forEach(m => {
                let modobj = schema[m]['modobj']
                let metric = modobj['model_metrics_' + type]
                // console.log('mod metrics for : ', m, f, metric, modobj)
                let rmse = metric['rmse']
                let R2 = metric['R2']
                let resid = metric['residual_score']
                rmselist.push(rmse)
                R2list.push(R2)
                residlist.push(resid)
                console.log('----- RMSE : ', rmse)
                console.log('----- R2 : ', R2)
                console.log('----- Residual : ', resid)
            })

            console.log('max and min RMSE : ', min(rmselist), max(rmselist))
            console.log('max and min R2 : ', min(R2list), max(R2list))
            console.log('max and min Residual : ', min(residlist), max(residlist))
        })
    }


    bestmodel_bytype(type = 'tf', shufle = true) {
        let bestmodobj = this.bestmodelids // { tf : [{modid, rankscore}
        console.log('bestmodel id before shuffle ', bestmodobj)
        let factor = 0
        if (shufle) {
            console.log(' shuffle on ')
            // return bestmodobj[type].map((f, i) => f.modelid)
            factor = 0.75
        } else {
            factor = 1.0
        }
        let tf_modkeys = bestmodobj[type].map((f, i) => i)
        let tf_modvals = bestmodobj[type].map((f, i) => f.modelid)
        tf_modkeys = tf_modkeys.sort((a, b) => {
            return bestmodobj[type][b]['rankscore'] - bestmodobj[type][a]['rankscore']
        })
        tf_modvals = tf_modkeys.map((m, i) => {
            let toss = Math.random()
            if (toss < factor) return tf_modvals[m] // this is sorted
            else return tf_modvals[i] // this is shuffled
        })
        return tf_modvals

    }

    query_topkmodels(k = 20) {
        let num = +Math.floor(k * 1.0)
        let tf_bestmods = this.bestmodel_bytype('tf')
        let reg_bestmods = this.bestmodel_bytype('reg')
        let obj = {
            'tf': tf_bestmods.slice(0, num),
            'reg': reg_bestmods.slice(0, num)
        }
        return obj
    }

    // not using now
    find_bestKModels(modschemalist = {}, k = 5) {

        Object.keys(modschemalist).forEach((m, i) => {
            let schemas = modschemalist[m]
            Object.keys(schemas).forEach((s, j) => {
                let modobj = schemas[s]['modobj']
                console.log(' model check ', s, j, modobj)

            })
        })

        return null // k similar models
    }

    // calc rank score for each modobj between 0-1 (higher score better)
    calc_model_rankscore(modschemalist, maxval) {
        let rankscoreobj = {},
            fac = 0,
            highestval = 50,
            threshscore = 0.1 * highestval

        let bestmodelids = {};
        //calc rankscore 1st
        Object.keys(modschemalist).forEach((sc, i) => {
            let schemalist = modschemalist[sc] // tf or reg
            let ranknormlist = []
            Object.keys(schemalist).forEach((m, j) => { //m = modelid
                let modobj = schemalist[m]['modobj']
                let metric = modobj['model_metrics_test'][p5D.modman.main_metric]
                let normval = metric / maxval
                let ranknorm = 1 - normval
                console.log('check out the normval and maxval ', normval, maxval, metric)
                ranknormlist.push(ranknorm)
            })

            Object.keys(schemalist).forEach((m, j) => { //m = modelid
                let modobj = schemalist[m]['modobj']
                let maxrank = max(ranknormlist)

                // let rankscore = +((1 - normval) * 100.0).toFixed(4)
                let rankscore = +map(ranknormlist[j], 0, maxrank, 0, highestval)
                modobj['rankscore'] = +rankscore.toFixed(4) + fac
                modobj['rank'] = -1
                rankscoreobj[rankscore] = -1
                console.log('rankscore after normalizing ', rankscore)

                if (rankscore > threshscore) {
                    let obj = {
                        'modelid': m,
                        'rankscore': rankscore
                    }
                    if (sc in bestmodelids) {
                        bestmodelids[sc].push(obj)
                    } else {
                        bestmodelids[sc] = [obj]
                    }
                }
            })
        })

        let rankindices = p5D.datast.get_sortarr_indices(Object.keys(rankscoreobj), false); // ascending =  true | false
        Object.keys(rankscoreobj).forEach((key, i) => {
            rankscoreobj[key] = rankindices[i]
        })
        //calc rank then
        Object.keys(modschemalist).forEach((sc, i) => {
            let schemalist = modschemalist[sc] // tf or reg
            Object.keys(schemalist).forEach((m, j) => { //m = modelid
                let modobj = schemalist[m]['modobj']
                modobj['rank'] = rankscoreobj[modobj['rankscore']]
            })
        })


        this.bestmodelids = bestmodelids;
        console.log(' calc rank score done ... ', this.bestmodelids)

    }




}

/**
 * class that defines the data schema for each ML model
 */
class ModelDataSchema {
    constructor(modid = 0, modfamily = 'tf') {
        this.modelid = modid
        this.modobj = {
            'modelid': modid,
            'family': modfamily
        }
        this.totalmodels = p5D.modman.modellist.length;
        this.buildschema()
    }
    buildschema() {
        this.modobj['hyperparams'] = this.gen_hyperparams();
        this.modobj['pred_test'] = p5D.modman.SIM.gen_pred_instances('test', this.modobj['family']);
        this.modobj['pred_train'] = p5D.modman.SIM.gen_pred_instances('train', this.modobj['family']);

        this.modobj['model_metrics_train'] = this.gen_modmetrics('train');
        this.modobj['model_metrics_test'] = this.gen_modmetrics('test');

        this.modobj['feature_wts'] = this.gen_featwts();
        this.modobj['sim_mods'] = this.gen_sim_models(this.modelid, 10);
    }

    gen_hyperparams() {
        let obj = {}
        if (this.modobj['family'] == 'tf') obj = this.gen_tf_hyperparams()
        else obj = this.gen_reg_hyperparams()
        return obj
    }
    gen_tf_hyperparams() {
        let featusednum = this.getnum_features()
        let hyper_obj = {
            'learning_rate': +Math.random().toFixed(3),
            'num_epochs': +Math.floor(Math.random() * 50) + 2,
            'drop_out': +Math.random().toFixed(2),
            'hidden_layers': +Math.floor(Math.random() * 10) + 2,
            'num_features': featusednum
            // 'algorithm': 'sgd'
        }
        return hyper_obj
    }

    getnum_features() {
        let numcols = p5D.datast.data.columns.length
        let featusednum = +Math.floor(Math.random() * numcols)
        if (featusednum < 5) featusednum = +Math.floor(Math.random() * 10 + 3)
        return featusednum
    }

    gen_reg_hyperparams() {
        let featusednum = this.getnum_features()
        // let hyper_obj = {
        //     'learning_rate': +Math.random().toFixed(3),
        //     'num_epochs': +Math.floor(Math.random() * 50) + 10,
        //     'l2_weight': +Math.random().toFixed(3),
        //     'k_regressors': +Math.floor(Math.random() * 15) + 2,
        //     'num_features': featusednum
        // }

        let hyper_obj = {
            'learning_rate': 0.064,
            'num_epochs': 15,
            'l2_weight': 0.08,
            'k_regressors': 12,
            'num_features': featusednum
        }
        return hyper_obj
    }


    gen_featwts() {
        let featwt_obj = {}
        p5D.datast.columns.forEach(col => {
            featwt_obj[col] = Math.random();
        });
        return featwt_obj;
    }

    gen_sim_models(id, k) {
        let model_idlist = new Array(this.totalmodels)
            .fill(null)
            .map((m, i) => i)
            .filter((f, i) => {
                let toss = Math.random() * 10
                return toss > 6
            })
        return model_idlist
    }


    gen_modmetrics_rand() {
        let highval = 100
        if (this.modobj['family'] == 'tf') highval = 20
        let modmet_obj = {
            'rmse': +Math.random().toFixed(6) * highval + 5,
            'R2': +Math.random().toFixed(6),
            'residual_score': +Math.random().toFixed(6),
            'max_error': +Math.random().toFixed(6)
        }
        return modmet_obj;
    }


    gen_modmetrics(type = 'train') {
        let pred = this.modobj['pred_' + type]
        let prederr = pred['pred_err']
        let orig = pred['orig']
        let target = pred['pred']

        let resid = p5D.datast.find_residual_avg(prederr)
        let r2score_obj = p5D.datast.find_r2squared(orig, target)
        let rmse = p5D.datast.find_rmse_self(prederr)
        let max_err = p5D.datast.find_maxerror(prederr)

        let modmet_obj = {
            'rmse': +rmse.toFixed(4),
            'R2': +r2score_obj['r2sq'].toFixed(4),
            'residual_score': +resid.toFixed(4),
            'max_error': +max_err.toFixed(6)
        }
        return modmet_obj;
    }



    schema() {
        let modobj = {
            'modelid': this.modelid,
            'family': 'tensorflow',
            'hyperparams': {
                'learning_rate': +Math.random().toFixed(3),
                'drop_out': +Math.random().toFixed(2),
                'hidden_layers': +Math.floor(Math.random() * 10) + 2,
                'algorithm': 'sgd'
            },
            'model_metrics_train': {
                'rmse': +Math.random().toFixed(4) + 0.1,
                'max_error': +Math.random().toFixed(4) + 0.1,
                'residual_score': +Math.random().toFixed(4) + 0.1,
                'R2': +Math.random().toFixed(4) + 0.1,
            },
            'model_metrics_test': {
                'rmse': +Math.random().toFixed(4) + 0.1,
                'max_error': +Math.random().toFixed(4) + 0.1,
                'residual_score': +Math.random().toFixed(4) + 0.1,
                'R2': +Math.random().toFixed(4) + 0.1,
            },
            'feature_wts': {
                'fa': 0.5,
                'fb': 0.2,
                'fc': 0.1,
                'fd': 0.8,
            },
            'pred_train': {
                'orig': [],
                'pred': []
            },
            'pred_test': {
                'orig': [],
                'pred': []
            },
            'similar_models': []
        }
    }
}