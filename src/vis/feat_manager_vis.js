/**
 * class to manage the feature related visualizations
 */
class FeatureManagerVis {
    constructor() {
        // current views present ... 
        this.viewtype = {
            SCATMATRIX: 0,
            CORRELATIONPLOTS: 1,
            HISTOGRAMPLOTS: 2,
        }

        this.containerclass = 'sidebar'
        this.addeddivclass = 'featurevisdiv'
        this.visdiv_scatmat = 'cormatrixdiv'
        this.visdiv_cortar = 'cortargetdiv'
        this.visdiv_histo = 'histomultiplediv'
        this.currentview = this.viewtype.CORRELATIONPLOTS
        this.htmlcontent();
        this.interactions();
        p5D.cortar = new CorrTarget(this.addeddivclass, this.visdiv_cortar);
        p5D.corvars = new CorrVars(this.addeddivclass, this.visdiv_scatmat);
        p5D.histomulti = new HistoMulti(this.addeddivclass, this.visdiv_histo);

        this.genvis_once()
    }

    genvis_once() {
        // this.currentview = this.viewtype.HISTOGRAMPLOTS
        p5D.corvars.update_vis();
        $('.' + this.visdiv_scatmat).hide();
        p5D.cortar.update_vis();
        // $('.' + this.visdiv_cortar).hide();
        p5D.histomulti.update_vis();
        $('.' + this.visdiv_histo).hide();
    }

    set_view(givenview = this.viewtype.SCATMATRIX) {
        this.currentview = givenview
        if (this.currentview == this.viewtype.SCATMATRIX) {
            $('.' + this.visdiv_cortar).hide()
            $('.' + this.visdiv_histo).hide()
            $('.' + this.visdiv_scatmat).show()
            p5D.featwtVis.update_vis() // hack solution

        } else if (this.currentview == this.viewtype.CORRELATIONPLOTS) {
            $('.' + this.visdiv_scatmat).hide()
            $('.' + this.visdiv_histo).hide()
            $('.' + this.visdiv_cortar).show()
        } else if (this.currentview == this.viewtype.HISTOGRAMPLOTS) {
            $('.' + this.visdiv_scatmat).hide()
            $('.' + this.visdiv_cortar).hide()
            $('.' + this.visdiv_histo).show()
        }
    }

    htmlcontent() {
        let content = `    
        <div class ='featvis_btndiv'>
        <a href = '' class = 'uk-icon-button uk-margin-small-right featvisbtns' uk-icon = 'thumbnails' uk-tooltip = 'title: Scatterplot Matrix View' id = 'scatmatbtn'> </a>
        <a href = "" class = "uk-icon-button uk-margin-small-right featvisbtns" uk-icon = "pencil" uk-tooltip = "title: Scatterplot Small Multiples" id = "smallmultbtn"></a>
        <a href = "" class = "uk-icon-button uk-margin-small-right featvisbtns" uk-icon = "list" uk-tooltip = "title: Distributions of parameters" id = "histodistrbtn"></a>
        </div>        
        <div class =${this.addeddivclass}></div>
        `;
        $('.' + this.containerclass).append(content);
    }

    interactions() {
        let self = this;
        $('.featvisbtns').on('click', function (ev, i) {
            ev.preventDefault();
            let id = $(this).attr('id')
            if (id == 'scatmatbtn') {
                console.log('scatmat clicked ', this)
                self.set_view(self.viewtype.SCATMATRIX)
            }

            if (id == 'smallmultbtn') {
                console.log('smallmultbtn clicked ', this)
                self.set_view(self.viewtype.CORRELATIONPLOTS)
            }

            if (id == 'histodistrbtn') {
                console.log('histo distr button clicked ', this)
                self.set_view(self.viewtype.HISTOGRAMPLOTS)
            }
        })

    }
}

/**
 * class to manage the train and test radial bar charts for k models
 */
class ModCompareManagerVis {
    constructor(addeddiv_vis = 'radialbars_wrapdiv', addeddiv_txt = 'radialbars_wrapdiv_txt') {
        this.containerclass = 'sidebar'
        this.addeddivclass_vis = addeddiv_vis
        this.addeddivclass_txt = addeddiv_txt
        this.htmlcontent();
        this.gen_radialcharts();
        setTimeout(() => {
            this.gen_radialtextcontent();
        }, 3000);
    }

    htmlcontent() {
        // let content = `
        // <div class =${this.addeddivclass_vis}></div>
        // <div class =${this.addeddivclass_txt}></div>
        // `;
        let content = `
        <div class =${this.addeddivclass_vis}></div>
        `;
        $('.' + this.containerclass).append(content);
    }

    gen_radialtextcontent() {
        // p5D.moddet_text = new RadialBarTextOverlay(this.addeddivclass_txt, 'radialtext_content')
        p5D.moddet_text = new RadialBarTextOverlay(this.addeddivclass_vis, 'radialtext_content')
    }

    gen_radialcharts() {
        p5D.moddet_train = new ModDetailRadial(this.addeddivclass_vis, 'radialbardiv_train', 'Training Set');
        p5D.moddet_test = new ModDetailRadial(this.addeddivclass_vis, 'radialbardiv_test', 'Test Set');
    }
}