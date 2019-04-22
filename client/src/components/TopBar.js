import React from "react";
import { Container, Row, Col } from "reactstrap";

class TopBar extends React.Component {
  render() {
    return (
      <Container id="top-bar">
        <h2 className="text-white">Average Income Over Time in 2011 USD</h2>
      </Container>
    );
  }
}

export default TopBar;
