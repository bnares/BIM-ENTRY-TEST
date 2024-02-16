import * as React from "react"
import * as Router from "react-router-dom"
import { IFCViewer } from "./IFCViewer"



export function ProjectDetailsPage() {
  //const routeParams = Router.useParams<{ id: string }>()
  //if (!routeParams.id) {return (<p>Project ID is needed to see this page</p>)}
  
  
  return (
    <div className="page" id="project-details">
      
      <div className="main-page-content">
        
        <IFCViewer />
      </div>
    </div>
  )
}