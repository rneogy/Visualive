import React from "react";
import Vis from "./Vis";
import Tree from "./Tree";
import {Container} from 'reactstrap';

class Root extends React.Component {
  render() {
    return (
      <Container>
        <Vis/>
      </Container>
    )
    ;
  }
}

export default Root;