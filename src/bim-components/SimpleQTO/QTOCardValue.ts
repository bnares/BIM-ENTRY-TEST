import * as OBC from "openbim-components";

export class QTOCardValue extends OBC.SimpleUIComponent implements OBC.Disposable{ 

    onDelete = new OBC.Event();
    onCardClick = new OBC.Event();
    set qtoName(value: string){
        const nameElem = this.getInnerElement("qtoName") as HTMLParagraphElement;
        nameElem.textContent = value;
    }

    set qtoValue(value: string){
        const valueElem = this.getInnerElement("qtoValue") as HTMLParagraphElement;
        valueElem.textContent = value;
    }

    // set qtoCardTitle(value: string){
    //     const titleName = this.getInnerElement("qtoCardTitle") as HTMLTitleElement;
    //     titleName.textContent = value;
    // }

    constructor(components: OBC.Components){
        const template = `
           
                <div style="display:flex; align-items:center; justify-content: flex-start; gap:5px; padding:5px;">
                    <b><span id="qtoName" style="font-wight: bold;"></span></b> : <span id="qtoValue"></span>
                </div>
           
        `
        super(components, template);
    }

    async dispose() {
        await this.dispose();
    }
}