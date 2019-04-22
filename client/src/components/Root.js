import React from "react";
import Vis from "./Vis";
import Tree from "./Tree";
import TopBar from "./TopBar";
import { Container } from "reactstrap";

class Root extends React.Component {
  render() {
    return (
      <Container>
        <TopBar />
        <Vis />
      </Container>
    );
  }
}

export default Root;
