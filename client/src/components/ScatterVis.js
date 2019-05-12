import Vis from "./Vis";
import { Scatter } from "./ChartTypes";

export class ScatterVis extends Vis {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    super.componentDidMount();
    this.chartType = new Scatter(
      this.props,
      this.svg,
      this.main,
      this.zoom,
      this.x,
      this.y,
      this.xAxis,
      this.yAxis,
      this.w,
      this.h,
      this.barColor,
      this.transitionDuration
    );
  }
}
