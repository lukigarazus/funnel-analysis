import React, { Component } from "react";
import Chart from "react-google-charts";

class SankeyChart extends Component<{ data: any[] }> {
  render() {
    return (
      <Chart
        width={900}
        height={"350px"}
        chartType="Sankey"
        loader={<div>Loading Chart</div>}
        data={this.props.data}
        rootProps={{ "data-testid": "1" }}
        options={{
          iterations: 128,
          padding: 50,
        }}
      />
    );
  }
}
export default SankeyChart;
