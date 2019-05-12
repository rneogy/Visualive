import Vis from "./Vis";
import { Bars } from "./ChartTypes";

export class BarVis extends Vis {
  constructor(props) {
    super(props);
  }

  componentDidMount() {
    super.componentDidMount();
    this.chartType = new Bars(
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
