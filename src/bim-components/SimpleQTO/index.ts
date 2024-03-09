import { FragmentsGroup } from "bim-fragment";
import * as OBC from "openbim-components";
import * as WEBIFC from "web-ifc";
import { QTOCard } from "./QTOCard";

type QtoResult = {[setName: string]:{[qtoName: string]: number}};


export class SimpleQTO extends OBC.Component<QtoResult> implements OBC.UI, OBC.Disposable{
    static uuid: string = "c00e34b9-39c0-48ec-b9c6-9139e82b6ec9";
    enabled: boolean = true;
    private _components: OBC.Components; 
    private _qtoResult : QtoResult = {};
    private _qtoList: {[key: string]:any}[] = [];
    uiElement: OBC.UIElement<any> = new OBC.UIElement<{
        activationBtn: OBC.Button,
        qtoList : OBC.FloatingWindow
    }>();

    constructor(components : OBC.Components){
        super(components);
        this._components = components;
        components.tools.add(SimpleQTO.uuid, this);
        this.setUI();
    }

    private setUI(){
        const activationBtn = new OBC.Button(this._components);
        activationBtn.materialIcon = "functions";

        const qtoList = new OBC.FloatingWindow(this._components);
        qtoList.title = "Quantification";
        this._components.ui.add(qtoList);
        qtoList.visible = false;

        activationBtn.onClick.add(()=>{
            qtoList.visible = !qtoList.visible;
        })

        this.uiElement.set({activationBtn: activationBtn, qtoList: qtoList});
    }

    setup = async ()=>{
        const highlighter = await this._components.tools.get(OBC.FragmentHighlighter);
        highlighter.events.select.onHighlight.add(async (fragmentIdMap: OBC.FragmentIdMap)=>{
            //console.log("add element fragment: ",fragmentIdMap);
            //this.resetQuantities();
            //await this.resetWindow();
            this.sumQuantities(fragmentIdMap);
        })

        highlighter.events.select.onClear.add(async ()=>{
            this.resetQuantities();
            await this.resetWindow();
        })
    }

    resetQuantities = ()=>{
        this._qtoResult = {};
    }

    resetWindow = async ()=>{
        const qtoList = this.uiElement.get("qtoList");
        console.log("qtoWindow in resetWindow: ",qtoList);
        //console.log("children: ",qtoList.children[0].children);
        for(const childID in qtoList.children[0].children){
            const qtoCard = qtoList.children[0].children[childID] as QTOCard;
            //console.log("childId: ",childID);
            //console.log("card from reset window: ", qtoCard);
            if(qtoCard){
                qtoCard.qtyValueList = [];
                //qtoList.domElement.removeChild(qtoCard.domElement);
                await qtoCard.dispose();
                qtoCard.removeFromParent();
            }
            

        }
        console.log("resetWidnow qtoList: ", qtoList);
        
        qtoList.cleanData();
    }

    updateUI =()=>{
        const qtoList = this.uiElement.get("qtoList");
        qtoList.cleanData();
        //qtoList.dispose();
        console.log("qtoResult in update START: ",this._qtoResult);
        for(const setName in this._qtoResult){
            this._qtoList = [];
            
            if(this._qtoResult.hasOwnProperty(setName)){
                console.log("updateUI setName: ",setName);
                const qtoCard = new QTOCard(this.components);
                qtoCard.setName = setName;
                const qtoValues = this._qtoResult[setName];
                console.log("uopdateUI qtoValues: ",qtoValues);
                for(const qtoName in qtoValues){
                    if(qtoValues.hasOwnProperty(qtoName)){
                        const qtoValue = qtoValues[qtoName];
                        const item = {[qtoName]: qtoValue};
                        this._qtoList.push(item);
                        console.log("ADDED ITEM: ",item);
                    }else{
                        console.log("NO SUCH PROPERTY INSIDE!!!!!!!!!!!!!!!!!!!!!!!!!")
                    }
                }
                 qtoCard.qtyValueList = this._qtoList;
                 qtoList.addChild(qtoCard);
                 //console.log("qtoList END: ",this._qtoList);   
                
            }else{
                console.log("NO SUCH PROPERTYOUTSIDE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
            }

        }
        //if(this._qtoResult.hasOwnProperty())
        this.resetQuantities();
    }

    sumQuantities = async (fragmentIdMap: OBC.FragmentIdMap) =>{
        //this.resetWindow();
        //console.log("begining of sumQuantities result: ",this._qtoResult);
        console.log("sumQuantities fragmentIdMap: ",fragmentIdMap)
        this.resetQuantities();
        const fragmentManager = await this._components.tools.get(OBC.FragmentManager);
        for(const fragmentID in fragmentIdMap){
            const fragment = fragmentManager.list[fragmentID];
            console.log("one of selected fragments: ",fragment);
           const model = fragment.mesh.parent;
           console.log("model sumQuantities: ",model);
           if(!(model instanceof FragmentsGroup) && model.properties) continue;
           const properties = model.properties;
            OBC.IfcPropertiesUtils.getRelationMap(
                properties, 
                WEBIFC.IFCRELDEFINESBYPROPERTIES,
                (setID, relatedIDs)=>{
                    //const uiDataElem = new QTOCard(this._components);
                    const set = properties[setID];
                    const expressIDs = fragmentIdMap[fragmentID];
                    const workingIDs = relatedIDs.filter(id=>expressIDs.has(id.toString()));
                    const {name : setName} = OBC.IfcPropertiesUtils.getEntityName(properties, setID);
                    
                    if(set.type !== WEBIFC.IFCELEMENTQUANTITY || workingIDs.length==0 || !setName) return;
                    if(!(setName in this._qtoResult)) this._qtoResult[setName] = {};
                    //console.log("set: ",set);
                    //uiDataElem.setName = setName.toString();
                    //console.log(properties[setID]);
                    //console.log("first qtoResult: ",this._qtoResult);
                    
                    OBC.IfcPropertiesUtils.getQsetQuantities(
                        properties,
                        setID,
                        (qtoId)=>{
                            const {name: qtoName} = OBC.IfcPropertiesUtils.getEntityName(properties, qtoId);
                            const {value} = OBC.IfcPropertiesUtils.getQuantityValue(properties, qtoId);
                            if(!qtoName || !value) return;
                            if(!(qtoName in this._qtoResult[setName])) this._qtoResult[setName][qtoName] = 0;
                            this._qtoResult[setName][qtoName] += value;
                           
                            //uiDataElem.qtoName = qtoName;
                            //uiDataElem.qtoValue = this._qtoResult[setName][qtoName].toString();
                            //const floatWindow = this.uiElement.get("qtoList");
                            //floatWindow.addChild(uiDataElem);
                            //console.log("second qtoResukt: ",this._qtoResult);

                        }
                    )

                }
            )
            
            
        }
        console.log("_qtoResult in sumQuantities: ",this._qtoResult);
        this.resetWindow();
        this.updateUI();
    }

    get(): QtoResult {
        return this._qtoResult;
    }
    async dispose(){
        this.uiElement.dispose();
        this.resetQuantities();
    }
    

}