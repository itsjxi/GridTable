import './style.css'
import javascriptLogo from './javascript.svg'
import viteLogo from '/vite.svg'
import { setupCounter } from './counter.js'
import { Model } from './model/model';
import { TableView } from './view/tableView';




const model =  new Model()
const container = document.querySelector(".container");
const datarender = new TableView(model.gridData , model.columns,container);
datarender.init();




