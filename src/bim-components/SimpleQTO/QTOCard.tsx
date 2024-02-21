import * as OBC from "openbim-components";

export class QTOCard extends OBC.SimpleUIComponent implements OBC.Disposable{ 

    set qtoName(value: string){
        const nameElem = this.getInnerElement("qtoName") as HTMLParagraphElement;
        nameElem.textContent = value;
    }

    set qtoValue(value: string){
        const valueElem = this.getInnerElement("qtoValue") as HTMLParagraphElement;
        valueElem.textContent = value;
    }

    set qtoCardTitle(value: string){
        const titleName = this.getInnerElement("qtoCardTitle") as HTMLTitleElement;
        titleName.textContent = value;
    }

    constructor(components: OBC.Components){
        const template = `
            <div class="quantityWindow">
                <h3 id="qtoCardTitle"></h3>
                <div style="display:flex; align-items:center; justify-content: center; gap:10px, flex-direction:column">
                    <p id="qtoName"></p>
                    <p id="qtoValue"></p>
                </div>
            </div>
        `
        super(components, template);
    }

    async dispose() {
        await this.dispose();
    }
}