import { createRoot } from "react-dom/client";

import { reactiveModel } from "./models/mobxReactiveModel.js";
window.reactiveModel = reactiveModel; // window.reactiveModel -> rends accessible partout, même depuis la console du navigateur.

import { ReactRoot } from "./reactjs/ReactRoot.jsx";




// mount the app in the browser page. Test at http://localhost:8080/react.html
createRoot(document.getElementById("root")).render(<ReactRoot model={reactiveModel} />);