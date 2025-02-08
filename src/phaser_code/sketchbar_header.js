/**
 * class to add contents and interaction to the
 * header bar on top of main phaser canvas sketch
 */
class SketchHeader {
    //constructor
    constructor() {
        this.containerid = 'sketchbar_headbar';
        this.idname1 = 'tf';
        this.idname2 = 'reg'
        this.spinners = {}
        this.htmlcontent();
        this.add_minispinner();
        this.addinteractions();
        console.log('sketch header content gen ... ')
    }

    add_minispinner() {
        this.spinners[this.idname1] = new MiniSpinner(`spinnerhead_div_${this.idname1}`, `spinnerwrap_mini_${this.idname1}`)
        this.spinners[this.idname2] = new MiniSpinner(`spinnerhead_div_${this.idname2}`, `spinnerwrap_mini_${this.idname2}`)
    }

    content_gen(headname, nummod, idgiven) {
        //  <a href = ""
        // class = "uk-icon-button uk-margin-small-right headbarbtns"
        // uk-icon = "play"
        // uk-tooltip = "title: Start Training"
        // id = "sidebar"></a>
        let content = `
        <div class = 'spinnerhead_div' id = 'spinnerhead_div_${idgiven}' ></div>
        <div class = 'texthead_div'> ${headname}</div>
        <div class = 'subtext_head_div' id=subtext_head_div_${idgiven}> ${nummod} </div>

        <div class = 'btnhead_div' id = 'btnhead_${idgiven}'>
        <a href = ''
        class = 'uk-icon-button uk-margin-small-right headbarbtns'
        uk-icon = 'close'
        uk-tooltip = 'title: Stop Training'
        id = 'sidebar'> </a>
        <a href = ""
        class = "uk-icon-button uk-margin-small-right headbarbtns"
        uk-icon = "download"
        uk-tooltip = "title: Export Model"
        id = "exportmodelbtn"></a>
        </div>
        `
        
        let dropdowncontent = `
        <div class="uk-inline sortdivwrap">
        <button class="uk-button uk-button-default sortbuttondiv " type="button">Sort Models</button>
        <div uk-dropdown="pos: bottom-justify" class = "sortdropdown">
            <ul class="uk-nav uk-dropdown-nav" class = "sortdropdown">
                <li><a href="#">By Residual Score</a></li>
                <li><a href="#">By RMSE</a></li>
                <li><a href="#">By Max-Error</a></li>
                <li><a href="#">By R2-Score</a></li>
            </ul>
        </div>
        </div>
        `

        content += dropdowncontent
        return content
    }


    update_nummod_text(txtinput = '', id) {
        $('#subtext_head_div_' + id).text(txtinput);
    }


    htmlcontent() {
        $('#' + this.containerid).empty();
        let headname1 = 'Tensforflow + HP Tuning',
            headname2 = 'Regular ML + Feature Selection',
            nummod = '-' //+Math.floor(+Math.random() * 10).toFixed(2)
        let content = `
            <div class = 'skheaderdiv tf_head_div'></div>
            <div class = 'skheaderdiv reg_head_div'></div>
        `
        $('#' + this.containerid).append(content);

        // tensorflow header
        let content1 = this.content_gen(headname1, nummod, this.idname1)
        $('.tf_head_div').append(content1);

        // regular model header
        let content2 = this.content_gen(headname2, nummod, this.idname2)
        $('.reg_head_div').append(content2);

        //add button for singlecontainer mode
        content2 = `
            <a href = ""
            class = "uk-icon-button uk-margin-small-right headbarbtns"
            uk-icon = "menu"
            uk-tooltip = "title: Single Bin Comparison Mode"
            id = "singlecontainerbtn"></a>
        `
        $('#btnhead_' + this.idname2).append(content2);
    }

    addinteractions() {
        $('.headbarbtns').on('click', function (e) {
            e.preventDefault()
            // console.log('head bar btn pressed ', this)

            let id = $(this).attr('id');
            if (id == 'singlecontainerbtn') {
                console.log('head bar btn pressed ', id)
                p5D.singlecontainer = !p5D.singlecontainer;
                p5D.modman = new ModelManager();
                p5D.cleanup_containers();
                if (p5D.singlecontainer == true) {
                    p5D.singlecontainersetup();
                } else {
                    p5D.multicontainersetup();
                }
                setTimeout(() => {
                    p5D.modman.genmodel = true
                }, 200);
            }

            // class = "alertdiv"

            if (id == 'exportmodelbtn') {
                console.log(' export btn pressed ')


                  const alert = document.createElement('ion-alert');
                  alert.cssClass = 'alert-div';
                  alert.header = 'Exporting Model';
                  alert.subHeader = 'Success';
                  alert.message = 'Model is succesfully saved';
                  alert.buttons = ['Done'];

                  document.body.appendChild(alert);
                  alert.present();

                setTimeout(() => {
                    $('.alert-div').remove();
                }, 5000);   
            }


            

        })
    }
}




/**
 * class that makes the control input content with sliders and input
 */
class ControlInput {

    constructor(containerid = '', addeddiv = '') {
        this.contentgen = false;
        this.workflowdialog_show = false
        this.containerclass = containerid
        this.addeddivclass = addeddiv
    }

    renderform() {
        if (this.contentgen) return
        // this.html_headerbtncontent()
        this.htmlcontent()
        this.hyperparamcontent_tf()
        this.hyperparamcontent_reg()
        this.featurecontent()
        this.interactions()
        this.contentgen = true
    }


    // html_headerbtncontent() {
    //     let content = `
    //     <div class='controlinput'>
    //         <div class="uk-inline">
    //             <!-- <button class="uk-button uk-button-default controlbtnheader" id="controlbtnheaderId" type="button">Control
    //                 Input</button> -->

    //             <a href="" class="uk-icon-button uk-margin-small-right controlbtnheader" uk-icon="grid"
    //                 uk-tooltip="title: Train or Load Models" id="load_trainmdls_btn"></a>
    //             <a href="" class="uk-icon-button uk-margin-small-right controlbtnheader" uk-icon="settings"
    //                 uk-tooltip="title: Preferences" id="sidebar"></a>
    //             <div uk-dropdown="mode: click" id="dropdowndivId" class="dropdowndivclass">
    //             </div>
    //         </div>
    //     </div>
    //     `;
    //     $(`.headbar`).append(content);
    // }

    htmlcontent() {
        let content = `<div class = '${this.addeddivclass} uk-animation-slide-bottom-medium'></div>`;
        $(`.${this.containerclass}`).append(content);
    }

    hyperparamcontent_tf() {
        let col_len = p5D.datast.data.columns.length - 1
        let rangedict = {
            'hidden_layers': [1, 30],
            'num_features': [3, col_len],
            'num_epochs': [2, 50]
        }
        let topclassname = 'content_formwrap'

        let modtype = 'tf'
        let modelid = 'model_1'
        let modobj = p5D.modman.modschemalist[modtype][modelid]['modobj']
        let keyname = 'hyperparams'
        let arrInput = Object.keys(modobj[keyname])

        let content = `<div class = '${topclassname} uk-animation-slide-bottom-medium'>`;

        content += `<div class ='forminpheader'>
                <ion-card-header>
                    <ion-card-subtitle class = 'formsub_header'>Hyperparameters for Tensorflow Models</ion-card-subtitle>
                </ion-card-header>
                <a href = ""
                class = "uk-icon-button uk-margin-small-right foldbtn"
                uk-icon = "triangle-down"
                uk-tooltip = "title: Collapse content"
                id = "foldbtn_${keyname}"></a>
                </div>`

        content += this.main_formcontent(arrInput, rangedict, keyname)
        content += `</div>`
        $('.' + this.addeddivclass).append(content)
    }

    hyperparamcontent_reg() {
        let col_len = p5D.datast.data.columns.length - 1
        let rangedict = {
            'k_regressors': [2, 20],
            'num_features': [3, col_len],
            'num_epochs': [2, 50]
        }
        let topclassname = 'content_formwrap'

        let modtype = 'reg'
        let modelid = Object.keys(p5D.modman.modschemalist[modtype])[0]
        let modobj = p5D.modman.modschemalist[modtype][modelid]['modobj']
        let keyname = 'hyperparams_reg'
        let arrInput = Object.keys(modobj['hyperparams'])

        let content = `<div class = '${topclassname} uk-animation-slide-bottom-medium'>`;

        content += `<div class ='forminpheader'>
                <ion-card-header>
                    <ion-card-subtitle class = 'formsub_header'>Hyperparameters for Regular Models</ion-card-subtitle>
                </ion-card-header>
                <a href = ""
                class = "uk-icon-button uk-margin-small-right foldbtn"
                uk-icon = "triangle-down"
                uk-tooltip = "title: Collapse content"
                id = "foldbtn_${keyname}"></a>
                </div>`
        content += this.main_formcontent(arrInput, rangedict, keyname, false)
        content += `</div>`
        $('.' + this.addeddivclass).append(content)
    }

    featurecontent() {
        let topclassname = 'content_formwrap'
        let keyname = 'featwts'
        let arrInput = p5D.datast.data.columns


        let content = `<div class = '${topclassname} uk-animation-slide-bottom-medium'>`;

        content += `<div class ='forminpheader'>
                <ion-card-header>
                    <ion-card-subtitle class = 'formsub_header'>Feature Weights</ion-card-subtitle>
                </ion-card-header>
                <a href = ""
                class = "uk-icon-button uk-margin-small-right foldbtn"
                uk-icon = "triangle-down"
                uk-tooltip = "title: Collapse content"
                id = "foldbtn_${keyname}"></a>
                </div>`

        content += this.main_formcontent(arrInput, {}, keyname, false)
        content += `</div>`
        $('.' + this.addeddivclass).append(content)
    }

    main_formcontent(arrInput, rangedict, keyname, dbl_knobs = true) {
        let self = this
        let content = `<div class ='forminpcontent uk-animation-slide-bottom-medium' id = 'forminp_${keyname}'>`

        arrInput.forEach((h, i) => {
            let minv = 0,
                maxv = 1
            if (Object.keys(rangedict).length > 0) {
                try {
                    maxv = rangedict[h][1]
                    minv = rangedict[h][0]
                } catch (e) {}
            }
            let val = (maxv - minv) * 0.5
            content += `<div class = 'inprowcontent' id = 'inprow_${h}_${keyname}'>
                       <ion-item class ='ionitem_rangewrap'>
                       <ion-chip color="secondary" class = 'texthead_ionchip'>
                        <ion-label color="dark">${h}</ion-label>
                        </ion-chip>
                       <ion-checkbox  id = "cb-${h}-${keyname}" class = "checkbox_any" checked = "true" color="light"></ion-checkbox>
                        <ion-range dual-knobs= ${dbl_knobs} min="${minv}" max="${maxv}" step="0.1" snaps="true" value = ${val}>
                         <ion-label slot="start">${minv}</ion-label>
                         <ion-label slot="end">${maxv}</ion-label>
                        </ion-range>
                    </ion-item>
                      </div>
                      `
        })
        content += `</div>`
        return content

    }


    interactions() {
        $('.foldbtn').on('click', function (e) {
            e.preventDefault()
            let id = $(this).attr('id');
            if (id == 'foldbtn_hyperparams') {
                $('#forminp_hyperparams').toggle();
            }

            if (id == 'foldbtn_hyperparams_reg') {
                $('#forminp_hyperparams_reg').toggle();
            }

            if (id == 'foldbtn_featwts') {
                $('#forminp_featwts').toggle();
            }
        })

        $('.checkbox_any').on('click', function (e) {
            let id = $(this).attr('id')
            let idkeys = id.split('-'),
                selector = '#inprow_' + idkeys[1] + '_' + idkeys[2],
                opac = $(selector).css('opacity')

            if (+opac == 1.0) {
                $(selector).css('opacity', 0.4)
            } else {
                $(selector).css('opacity', 1.0)
            }
        })

        $('#load_trainmdls_btn').on('click', function (e) {
            e.preventDefault()
            console.log(' workflow needs to be pushed in .. ')
            this.workflowdialog_show = !this.workflowdialog_show
            if (this.workflowdialog_show) p5D.wrkSel = new WorkflowSelector();
            else {
                p5D.wrkSel.hide_thisdialog();
            }
            setTimeout(() => {
                $('.tooltipcontainer').remove();
            }, 1500);


        })

    }
}