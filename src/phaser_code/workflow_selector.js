class WorkflowSelector {
    //constructor here
    constructor() {
        this.containerid = 'body'
        this.htmlcontent()
        this.interactions()
        console.log('workflow selector done')
    }


    htmlcontent() {

        $('.initdialog').remove()
        let content = `
        <div class = 'initdialog'>
        </div>
        `
        $(this.containerid).append(content)

        content = `
        <button class="uk-button uk-button-default btnWorkflow" id = "newmodel_btn">Train New Models</button>
        <button class = "uk-button uk-button-default btnWorkflow btnWorkflow_sec"
        id = "loadmodel_btn" > Load Pre - trained </button>
        `

        $('.initdialog').append(content)


        let posobj = $('#sketchbar').position();
        let width = $('#sketchbar').width();
        let height = $('#sketchbar').height();
        let widdiag = width * 0.45,
            htdiag = height * 0.15
        let toppos = posobj.top + height * 0.5 - htdiag * 0.5
        let leftpos = posobj.left + width * 0.5 - widdiag * 0.5 // (height * 0.5)
        $('.initdialog').css('top', toppos)
        $('.initdialog').css('left', leftpos)
        $('.initdialog').css('width', widdiag)
        $('.initdialog').css('height', htdiag)
        $('.mainbar').css('opacity', 0.25)

    }

    hide_thisdialog() {
        $('.initdialog').hide()
        $('.mainbar').css('opacity', 1.0)
    }

    interactions() {

        let containerclass = 'btnWorkflow'
        let self = this
        $('.' + containerclass).on('click', function (ev, i) {
            ev.preventDefault();
            let id = $(this).attr('id')

            if (id == 'newmodel_btn') {
                console.log('new model btn pressed ... ');
                self.hide_thisdialog();
                p5D.resetUI();
                p5D.modman.trainmodelgo = true;
                // p5D.gen_visualizations();
                //  p5D.modman.train_realmodels()
            }

            if (id == 'loadmodel_btn') {
                console.log('load pretrained model btn pressed ... ');
                self.hide_thisdialog();
                p5D.resetUI();
                p5D.modman.genmodel = true
                p5D.gen_visualizations();
                //  p5D.modman.gendraw_newmodels();
            }

        })
    }
}

/**
 * class that holds UI spinner to show at loading point 
 */
class Spinner {

    constructor() {
        this.defaultLoadingText = 'Loading .....'
        this.htmlcontent();
        this.spinnerShow = false;
        console.log('spinner adds .. ')
    }


    toggleSpinner(txtinput = '') {
        this.spinnerShow = !this.spinnerShow;
        if (this.spinnerShow) {
            if (txtinput != '') {
                $('.spinnertext').text(txtinput)
            }
            $('.spinnerwrap').show();
            console.log('showing spinner')
        } else {
            $('.spinnerwrap').hide();
            console.log('hiding spinner')
        }
    }


    showSpinner(txtinput = '') {
        if (txtinput != '') {
            $('.spinnertext').text(txtinput)
        }
        $('.spinnerwrap').show();
        console.log('showing spinner')
    }

    showSpinnerPromise(txtinput = '') {
        return new Promise(resolve => {
            this.showSpinner(txtinput);
            setTimeout(() => {
                resolve('done')
            }, 200);
        });

    }


    hideSpinner() {
        $('.spinnerwrap').hide();
        console.log('hiding spinner')
    }

    htmlcontent() {
        $('.spinnerwrap').remove()
        let str =
            `
			<div class = 'spinnerwrap'>
				<div uk-spinner="ratio: 6" id = 'spinnerwidget'></div>
				<div class = 'spinnertext'>${this.defaultLoadingText}</div>
			</div>
		`
        $('body').append(str)

        setTimeout(() => {
            $('#spinnerwidget').find('circle').css('stroke-width', '1.2px')
        }, 200)
        $('.spinnerwrap').hide();
    }

}


/**
 * class that holds UI spinner to show at loading point 
 */
class MiniSpinner {

    constructor(containerid = '', spinwrapid = '') {
        // this.defaultLoadingText = 'Loading .....'
        this.containerid = containerid
        this.spinwrapclass = 'spinnerwrap_mini'
        this.spinwrapid = spinwrapid;
        this.htmlcontent();
        this.spinning = false;
    }

    showSpinner() {
        if (this.spinning) return
        $('#' + this.spinwrapid).show();
        this.spinning = true
    }


    hideSpinner() {
        if (!this.spinning) return
        $('#' + this.spinwrapid).hide();
        this.spinning = false
    }

    htmlcontent() {
        $('#' + this.spinwrapid).remove()
        let str =
            `
			<div class = ${this.spinwrapclass} id = ${this.spinwrapid}>
				<div uk-spinner="ratio: 6" id = 'spinnerwidget_mini' class ='spinnerwidget_mini_cl'></div>
			</div>
        `
        $('#' + this.containerid).append(str)

        setTimeout(() => {
            $('.spinnerwidget_mini_cl').find('circle').css('stroke-width', '3px')
            $('.spinnerwidget_mini_cl').find('circle').css('stroke', 'rgb(185,185,185')
            $('.spinnerwidget_mini_cl').css('padding', '5px')
        }, 200)
        $('#' + this.spinwrapid).hide();
    }

}