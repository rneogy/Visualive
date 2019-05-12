const express = require("express");
const path = require("path");

const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const d3 = require("d3");
// between 0 and 10
let color_num = 0;

// interpolate between 0.2 and 0.8
const colors = () => {
  color_num = num + (Math.random() * 2 + 6)
  return d3.interpolateRainbow(color_num*0.06 + 0.2);
}

const publicPath = path.resolve(__dirname, "..", "client", "dist");

app.use(express.static(publicPath));

http.listen(3000, () => {
  console.log(`Listening on port 3000 and looking in folder ${publicPath}`);
});

const State = {
  connections: [],
  chartOpen: false,
  chartType: "bars",
  selectedCountries: []
};

io.on("connection", socket => {
  const color = colors() //.pop(); // this breaks if there are more people online than there are colors
  console.log("User " + socket.id + " connected. Assigned color: " + color);
  const thisConnection = {
    id: socket.id,
    color: color,
    tracking: [],
    following: null
  };
  State.connections.push(thisConnection);

  // send full state to newly connected client
  socket.emit("initState", {...State, ...thisConnection});
  // send new client connection to everyone else
  socket.broadcast.emit("connectionsUpdate", State.connections);

  socket.on("highlightServer", i => {
    socket.broadcast.emit("highlight", i);
  });
  socket.on("unhighlightServer", i => {
    socket.broadcast.emit("unhighlight", i);
  });

  socket.on("changeCountryServer", c => {
    State.chartOpen = true;
    State.selectedCountries = c;
    socket.broadcast.emit("changeCountry", c);
  });

  // Following logic
  socket.on("followUser", id => {
    console.log(socket.id + " following " + id);
    socket.join(id + "-followers");
    io.to(id).emit("sendZoom");
  });

  socket.on("unfollowUser", id => {
    console.log(socket.id + " unfollowing " + id);
    socket.leave(id + "-followers");
  });

  socket.on("changeZoomSmoothServer", z => {
    socket.to(socket.id + "-followers").emit("changeZoomSmooth", z);
  });

  socket.on("changeZoomServer", d => {
    socket.to(socket.id + "-followers").emit("changeZoom", d);
    socket.to(socket.id + "-trackers").emit("trackZoom", d);
  });

  socket.on("changeZoomServerScatter", d => {
    socket.to(socket.id + "-followers").emit("changeZoomScatter", d);
    socket.to(socket.id + "-trackers").emit("trackZoomScatter", d);
  });

  socket.on("changeBrushServer", i => {
    socket.to(socket.id + "-followers").emit("changeBrush", i);
  });
  
  socket.on("removeBrushServer", i => {
    socket.to(socket.id + "-followers").emit("removeBrush", i);
  });

  // Tracking logic
  socket.on("trackUser", id => {
    console.log(socket.id + " tracking " + id);
    socket.join(id + "-trackers");
    io.to(id).emit("sendTrackZoom");
  });

  socket.on("untrackUser", id => {
    console.log(socket.id + " untracking " + id);
    socket.leave(id + "-trackers");
  });

  socket.on("trackZoomServer", d => {
    socket.to(socket.id + "-trackers").emit("trackZoom", d);
  });

  socket.on("changeChartServer", b => {
    State.chartType = b;
    socket.broadcast.emit("changeChart", b);
  });

  socket.on("disconnect", () => {
    console.log("User " + socket.id + " disconnected.");
    State.connections = State.connections.filter(c => {
      // if (c.id === socket.id) {
      //   colors.push(c.color);
      // }
      return c.id !== socket.id;
    });

    if (State.connections.length === 0) {
      // reset to base condition if all connections gone
      State.chartOpen = false;
      State.chartType = "bars";
      State.selectedCountries = [];
    }
    io.emit("connectionsUpdate", State.connections);
  });
});
