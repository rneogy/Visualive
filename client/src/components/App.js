import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import "../css/app.css";
import Route from "react-router-dom/es/Route";
import Switch from "react-router-dom/es/Switch"
import Root from "./Root"

class App extends React.Component {
  render() {
    return (
      <div>
        <Switch>
          <Route exact path="/" component={Root} />
        </Switch>
      </div>
    )
    ;
  }
}

export default App;