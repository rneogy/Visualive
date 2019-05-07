import React from "react";

class UserPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  followUser(id) {
    this.props.followUser(id);
  }

  render() {
    return (
      <div id="user-panel" className="text-center">
        <h4>Users</h4>
        {this.props.users.map((u, i) => {
          const style = {
            background: u.color,
            animationDelay: -i + "s"
          };
          return (
            <div
              className={
                u.id === this.props.following
                  ? "user-icon selected"
                  : "user-icon"
              }
              key={u.id}
              style={style}
              onClick={this.followUser.bind(this, u.id)}
            />
          );
        })}
      </div>
    );
  }
}

export default UserPanel;
