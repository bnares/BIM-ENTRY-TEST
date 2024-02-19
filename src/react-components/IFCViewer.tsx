import * as React from "react"
import * as OBC from "openbim-components"
import { FragmentsGroup } from "bim-fragment"
import * as THREE from "three";



export function IFCViewer() {
  
    
    let components : OBC.Components;
    const createViewer = async ()=>{
        const container = document.getElementById("viewer-container") as HTMLDivElement;
        components = new OBC.Components();
        const sceneComponent = new OBC.SimpleScene(components);
        sceneComponent.setup();
        components.scene = sceneComponent;
        const scene = sceneComponent.get();

        const renderer = new OBC.PostproductionRenderer(components, container);
        //renderer.postproduction.customEffects.outlineEnabled = true;
        components.renderer = renderer;
        const cameraComponent = new OBC.OrthoPerspectiveCamera(components);
        components.camera = cameraComponent;
        const raycasterComponent = new OBC.SimpleRaycaster(components);
        components.raycaster = raycasterComponent;
       
        components.init();

        cameraComponent.updateAspect();
        renderer.postproduction.enabled = true;
        let fragments = new OBC.FragmentManager(components);

        const exportModelProperties = (model : FragmentsGroup, fileName: string = "fragmentProperties")=>{
          const data =  JSON.stringify({...model.properties});
          const blob = new Blob([data], {type:"application/json"});
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${fileName}`;
          a.click();
          URL.revokeObjectURL(url);
        }

        const exportFragments = (model : FragmentsGroup)=>{
          const binaryData = fragments.export(model);
          const blob = new Blob([binaryData]);
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${model.name.replace(".ifc","")}.frag`;
          a.click();
          URL.revokeObjectURL(url);
        }
        
        
        const camera = components.camera.get();
        //camera.updateAspect();
        if(camera instanceof OBC.OrthoPerspectiveCamera){
            await components.camera.get().controls.setLookAt(10,10,1,0,0,0);
        }
        
        const grid = new OBC.SimpleGrid(components);

        const boxMaterial = new THREE.MeshStandardMaterial({ color: '#6528D7' });
        const boxGeometry = new THREE.BoxGeometry(3, 3, 3);
        const cube = new THREE.Mesh(boxGeometry, boxMaterial);
        cube.position.set(0, 1.5, 0);
        scene.add(cube);
        //scene.setup();
        //components.init();

        

        const fragmentIfcLoader = new OBC.FragmentIfcLoader(components);
        fragmentIfcLoader.settings.wasm = {
            path: "https://unpkg.com/web-ifc@0.0.44/",
            absolute: true
        }
        fragmentIfcLoader.settings.webIfc.COORDINATE_TO_ORIGIN = true;
        fragmentIfcLoader.settings.webIfc.OPTIMIZE_PROFILES = true;

        const highlighter = new OBC.FragmentHighlighter(components);
        highlighter.setup();

        const loadFragments = async ()=>{
          if(fragments.groups.length) return;
          // const file = await fetch('../../frag/HNS-CTL-MOD-EST-001 (2).frag');
          // const data = await file.arrayBuffer();
          // const buffer = new Uint8Array(data);
          // const fragmntGroup = await fragments.load(buffer);
          // console.log("model: ",fragmntGroup);
          const input = document.createElement("input");
          input.type = "file";
          input.accept = ".frag";
          const reader = new FileReader();
          reader.addEventListener("load", async ()=>{
            const binary = reader.result;
            if(!(binary instanceof ArrayBuffer)) return;
            const fragmentBinary = new Uint8Array(binary);
            await fragments.load(fragmentBinary);
          });
          input.addEventListener("change",()=>{
            const filesList = input.files;
            if(!filesList) return;
            reader.readAsArrayBuffer(filesList[0]);
          })
          input.click();
        }

        const loadFragmentProperties = async (model : FragmentsGroup)=>{
          const input = document.createElement("input");
        input.type = "file";
        input.accept = "application/json";
        const reader = new FileReader();
        var projects={};
        reader.addEventListener("load",async ()=>{
            const json = reader.result as string;
            if(!json)return;
            projects = JSON.parse(json);
            //console.log("projects Object: ",projects);
            model.properties = projects;
            await onModelLoaded(model);
        })
        input.addEventListener('change', () => {
            const filesList = input.files
            if (!filesList) { return }
            reader.readAsText(filesList[0])
        })
        input.click();
            
        };

        const classifier = new OBC.FragmentClassifier(components);
        const classifierWindow = new OBC.FloatingWindow(components);
        classifierWindow.visible = false;
        components.ui.add(classifierWindow);
        classifierWindow.title = "Model Group";


        var classifierBtn = new OBC.Button(components);
        classifierBtn.tooltip = "Model Group";
        classifierBtn.materialIcon = "account_tree";
        classifierBtn.onClick.add(()=>{
          
          classifierWindow.visible = !classifierWindow.visible;
        })


        const createModelTree = async ()=>{
          const fragmentTree = new OBC.FragmentTree(components);
          await fragmentTree.init();
          fragmentTree.update([]);
          await fragmentTree.update(["model","storeys", "entities"]);
          const tree = fragmentTree.get().uiElement.get("tree");
          await classifierWindow.slots.content.dispose(true);
          fragmentTree.onHovered.add((fragmentMap)=>{
            highlighter.highlightByID("hover", fragmentMap);
          });
          fragmentTree.onSelected.add((fragmentMap)=>{
            highlighter.highlightByID("select", fragmentMap);
          })
          return tree;
        }

        const onModelLoaded = async (model : FragmentsGroup)=>{
          highlighter.update();
          classifier.byModel(model.ifcMetadata.name, model);
          classifier.byStorey(model);
          classifier.byEntity(model);
          propertiesProcessor.process(model);
          //console.log("classifier: ",classifier.get());
          const tree = await createModelTree();
          classifierWindow.addChild(tree);
          highlighter.events.select.onHighlight.add(async (fragmentMap)=>{
            var values = [...Object.values(fragmentMap)[0]][0];
            //console.log("values: ",values);
            propertiesProcessor.renderProperties(model, Number(values))
          })
        }


        fragments.onFragmentsLoaded.add(async (model)=>{
          loadFragmentProperties(model);
          //console.log("propserties adter loading: ", model);
        })

        const propertiesProcessor = new OBC.IfcPropertiesProcessor(components);
        highlighter.events.select.onClear.add(()=>{
          propertiesProcessor.cleanPropertiesList();
        })

        fragmentIfcLoader.onIfcLoaded.add(async (model)=>{
          exportFragments(model);
          exportModelProperties(model, model.name.replace(".ifc",""));
          onModelLoaded(model);
          
          
        })

        const loadButton = new OBC.Button(components);
        loadButton.materialIcon = "download";
        loadButton.tooltip = "Load fragment";

        loadButton.onClick.add(()=> loadFragments());

        const loadDataBtn = new OBC.Button(components);
        loadDataBtn.tooltip = "Load IFC/Frag";
        loadDataBtn.materialIcon = "publish"
        loadDataBtn.addChild(
          fragmentIfcLoader.uiElement.get("main"),
          loadButton
        )        

          
          
          const highlighterMaterial = new THREE.MeshBasicMaterial({
            color:"#BCF124",
            depthTest:false,
            opacity:0.8,
            transparent: true,
          });
          highlighter.add("redSelection", highlighterMaterial);
          highlighter.outlineMaterial.color.set(0xf0ff7a);
          let lastSelection;
          let singleSelection = {
            value: true,
          };

          

          // const highlightOnClick = async (event? : any)=>{
          //   const result = await highlighter.highlight("redSelection",singleSelection.value);
          //   console.log("result: ",result);
          //   if(result){
          //     lastSelection = {};
          //     for(const fragment of result.fragments){
          //       const fragmentID = fragment.id;
          //       lastSelection[fragmentID] = [result.id];
          //     }
          //   }
          // }

        //   const highlightOnId = async ()=>{
        //     const result = await highlighter.highlight('redSelection', singleSelection.value);
        //     console.log("result: ",result);
        //     if (result) {
        //     lastSelection = {};
        //     for (const fragment of result.fragments) {
        //       let fragmentID = fragment.id;
        //       lastSelection[fragmentID] = [result.id];
        //     }
        //     if(lastSelection !== undefined){
        //       highlighter.highlightByID("redSelection",lastSelection)
        //     }
        //   }
        // }
        //container.addEventListener("click", ()=>highlightOnId())

        const mainToolbar = new OBC.Toolbar(components, {name:"Main Toolbar", position:'bottom'});
        mainToolbar.addChild(
            //fragmentIfcLoader.uiElement.get("main"),
            loadDataBtn,
            fragments.uiElement.get("main"),
            classifierBtn,
            propertiesProcessor.uiElement.get("main"),
            //loadButton,
        )
        components.ui.addToolbar(mainToolbar);
    }

    


  React.useEffect(() => {
    createViewer()
    return () => {
      components.dispose()
    }
    }, [])


  return (
    <div
      id="viewer-container"
      className="dashboard-card"
      style={{ minWidth: 0, position: "relative", height:'100vh', width:'100vw' }}
    />
  )
}