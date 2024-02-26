import { QTOCardValue } from "./QTOCardValue";
import * as OBC from "openbim-components";

export type qtyValue = [
    {[qtoName: string]: number}
]

export class QTOCard extends OBC.SimpleUIComponent {

    declare slots: { actionButtons: OBC.SimpleUIComponent<HTMLElement>; };
    onDelete = new OBC.Event();
    onCardClick = new OBC.Event();
    private _qtyValueListElement : HTMLParagraphElement;
    // slots: { actionButtons: OBC.SimpleUIComponent; };
    


    set setName(value: string){
        const setNameElement = this.getInnerElement("setName") as HTMLParagraphElement;
        setNameElement.textContent = value;
    };

    set qtyValueList(value : any){
        while(this._qtyValueListElement.firstChild){
            this._qtyValueListElement.removeChild(this._qtyValueListElement.firstChild);
        }
        //console.log("value: ",value);
        for(const qtoEntry of value){
            //console.log("qtoEntry: ", qtoEntry);
            for(const qtoName in qtoEntry){
                const number = qtoEntry[qtoName];
                const qtoCardValue = new QTOCardValue(this.components);
                qtoCardValue.qtoValue =  number.toFixed(2);
                qtoCardValue.qtoName = qtoName;
                this._qtyValueListElement.appendChild(qtoCardValue.domElement);
            }
        }

    }

    constructor(components: OBC.Components){
        
        const template = `
            <div style="display: flex; flex-direction:column; justify-content:space-between; align-items:center">
                <div>
                    <h3 id="setName" >
                        SetName
                    </h3>
                    <div id="qtyValueList">
                    
                    </div>
                </div>
                <div data-tooeen-slot="actionButtons"> 
                    data-tooeen-slot we tell the openBim engine that this is a slot with name actionButtons
                </div>
            </div>
        `
        super(components, template);
        const cardElement = this.get();
        cardElement.addEventListener("click",()=>{
            this.onCardClick.trigger();
        })

        this.setSlot("actionButtons",new OBC.SimpleUIComponent<HTMLElement>(components));
        this.slots.actionButtons.addChild(new OBC.SimpleUIComponent(components))
        this._qtyValueListElement = this.getInnerElement("qtyValueList") as HTMLDivElement;
        //this.slots.actionButtons.addChild(new OBC.SimpleUIComponent(components));
        
    }

    async dispose(){
        while(this._qtyValueListElement.firstChild){
            this._qtyValueListElement.removeChild(this._qtyValueListElement.firstChild);
        }
    }
}