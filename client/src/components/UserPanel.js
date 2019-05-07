import React from "react";

class UserPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  componentDidUpdate() {}

  render() {
    return (
      <div id="user-panel" className="text-center">
        <h4>Users</h4>
        {this.props.users.map((u, i) => {
          const style = {
            background: u.color,
            animationDelay: -i + "s"
          };
          return <div className="user-icon" key={u.id} style={style} />;
        })}
      </div>
    );
  }
}

export default UserPanel;
