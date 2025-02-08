/**
 * CLass that simulates prediction for a given model
 */
class SimulateModel {

    constructor() {
        this.split_ratio = 0.75
        let {
            traindata,
            testdata
        } = this.gen_traintestdata()
        this.traindata = traindata.slice(0)
        this.testdata = testdata.slice(0)

        console.log('simulate model data ', this)
    }

    gen_pred_instances(type = 'train', modtype = 'tf') {
        let toss = Math.random(),
            toss2 = Math.random()

        if (toss < 0.5) {
            return this.gen_pred_wide(type, 100)
        } else {
            if (toss2 < 0.25)  return this.gen_pred_wide(type, 200)
            else return this.gen_pred_instances_d(type, modtype)
        }

    }

    gen_pred_instances_d(type = 'train', modtype = 'tf') {
        let trial = 1
        let toss = Math.random(),
            toss2 = Math.random()
        if (toss < 0.5) trial = 2
        if (modtype == 'reg' && p5D.modman.modeliteration < 2) {
            if (toss2 < 0.65) trial = 2
            else trial = 3

            if(toss2 < 0.2) trial = 1
        }

        if (modtype == 'reg' && p5D.modman.modeliteration > 1) {
            if (toss2 < 0.35) trial = 2
        }

        if (modtype == 'tf' && p5D.modman.modeliteration > 0) {
            let toss2 = Math.random()
            if (toss2 < 0.65) trial = 3
            else trial = 0
        }

        if (modtype == 'tf' && p5D.modman.modeliteration > 1) {
            let toss2 = Math.random()
            if (toss2 < 0.5) trial = 2
            else trial = 3
        }

        // best mods
        if (trial == 0) {
            return this.gen_pred_wide(type, 30)
        }

        // best mods
        if (trial == 1) {
            return this.gen_pred_default(type)
        }
        // worse models
        if (trial == 2) {
            return this.gen_pred_wide(type, 500)
        }
        // medium worse
        if (trial == 3) {
            return this.gen_pred_wide(type, 1000)
        }
    }

    gen_pred_wide(type = 'train', factor = 1000) {
        let {
            pred_inst,
            tarcol
        } = this.get_pred_tarcol(type)
        //make predictions
        let chance = 0.6
        if (type == 'train') chance = 0.4
        pred_inst = pred_inst.map((v, i) => {
            let val = v
            let toss = Math.random()
            if (toss < chance) {
                let addon = Math.random() * factor
                let toss2 = Math.random()
                if (toss2 < 0.5) val += addon
                else val -= addon
            }
            return +val.toFixed(2)
        })
        // calc pred error
        const {
            diff,
            diff_norm
        } = this.cal_pred_err(tarcol, pred_inst)

        let obj = {
            'orig': tarcol,
            'pred': pred_inst,
            'pred_err': diff,
            'pred_err_N': diff_norm
        }
        return obj
    }



    gen_pred_default(type = 'train') {
        let {
            pred_inst,
            tarcol
        } = this.get_pred_tarcol(type)
        //make predictions
        let chance = 0.7
        if (type == 'train') chance = 0.3
        pred_inst = pred_inst.map((v, i) => {
            let val = v
            let toss = Math.random()
            if (toss < chance) {
                let addon = Math.random() * 100 - 75
                let toss2 = Math.random()
                if (toss2 < 0.5) val += addon
                else val -= addon
            }
            return +val.toFixed(2)
        })
        // calc pred error
        const {
            diff,
            diff_norm
        } = this.cal_pred_err(tarcol, pred_inst)

        let obj = {
            'orig': tarcol,
            'pred': pred_inst,
            'pred_err': diff,
            'pred_err_N': diff_norm
        }
        return obj
    }


    //++++ helper func below ++++++++++

    get_pred_tarcol(type = 'train') {
        let data = this.testdata
        if (type == 'train') data = this.traindata
        let tarcol = p5D.datast.get_column(data, p5D.datast.targetcol)
        return {
            tarcol: tarcol,
            pred_inst: tarcol.slice(0)
        }
    }

    gen_traintestdata() {
        let ratioTrain = this.split_ratio
        let fulldata = p5D.datast.data.slice(0)
        let ratioTest = 1 - ratioTrain
        let numinstances = fulldata.length * ratioTrain
        let train_data = fulldata.slice(0, numinstances);
        numinstances = fulldata.length * ratioTest
        let test_data = fulldata.slice(fulldata.length - numinstances);
        return {
            traindata: train_data.slice(0),
            testdata: test_data.slice(0)
        }
    }



    cal_pred_err(tarcol, pred_inst) {
        let diff = tarcol.map((t, i) => {
            return pred_inst[i] - t
        })

        let maxv = d3.max(diff),
            minv = d3.min(diff)

        let diff_norm = diff.map((d, i) => {
            let val = +map(d, minv, maxv, 0, 1).toFixed(3)
            if (val > 0.5) {
                d = val - 0.5
                val = 0.5 + (d * Math.random() * 0.5)
            }
            return val
        })
        return {
            diff: diff,
            diff_norm: diff_norm
        }
    }

}