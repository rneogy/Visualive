import Vis from "./Vis";
import { Lines } from "./ChartTypes";

export class LineVis extends Vis {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    super.componentDidMount();
    this.chartType = new Lines(
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
