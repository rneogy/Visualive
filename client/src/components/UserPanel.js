import React from "react";

class UserPanel extends React.Component {
  constructor(props) {
    super(props);
  }

  followUser(id) {
    this.props.followUser(id);
  }

  isYou(id) {
    return id === this.props.thisUser;
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
                  ? "user-icon selectable selected"
                  : this.isYou(u.id) ? "user-icon" : "user-icon selectable"
              }
              key={u.id}
              style={style}
              onClick={this.isYou(u.id) ? null : this.followUser.bind(this, u.id)}
            >{this.isYou(u.id) ? "you" : ""}</div>
          );
        })}
      </div>
    );
  }
}

export default UserPanel;
